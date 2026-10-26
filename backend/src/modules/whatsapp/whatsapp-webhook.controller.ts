import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { claimWhatsAppEvent } from "./whatsapp-processed-event.model.js";
import { verifyWhatsAppSignature } from "./whatsapp-signature.js";
import { enqueueWhatsAppInbound } from "./whatsapp-inbound.queue.js";
import {
  applyWhatsAppNotificationDeliveryStatus,
  WhatsAppNotificationDispatchModel,
} from "./notifications/whatsapp-notification.model.js";
import { syncReminderWithDispatchStatus } from "./notifications/whatsapp-notification.reminder-sync.js";
import {
  applyInboxDeliveryStatus,
  isBotPausedForPhone,
  recordInboundUserMessage,
} from "./inbox/whatsapp-inbox-store.js";
import {
  describeInboundWhatsAppMessage,
  isWebhookForConfiguredPhone,
  whatsAppWebhookTime,
  type InboundWhatsAppMessage,
} from "./whatsapp-inbound-message.js";

type IncomingMessage = InboundWhatsAppMessage & {
  id?: string;
  from?: string;
  audio?: { id?: string; mime_type?: string };
};

export function verifyWhatsAppWebhook(req: Request, res: Response): void {
  const mode = String(req.query["hub.mode"] ?? "");
  const token = String(req.query["hub.verify_token"] ?? "");
  const challenge = String(req.query["hub.challenge"] ?? "");
  const expected = env.WHATSAPP_VERIFY_TOKEN.trim();

  if (mode === "subscribe" && expected && token === expected) {
    res.status(200).send(challenge);
    return;
  }

  console.error("[WhatsAppWebhook] verification rejected");
  res.sendStatus(403);
}

export function receiveWhatsAppWebhook(req: Request, res: Response): void {
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  const signature = req.header("x-hub-signature-256") ?? undefined;
  if (!verifyWhatsAppSignature(rawBody, signature, env.META_APP_SECRET)) {
    console.error("[WhatsAppWebhook] signature rejected");
    res.sendStatus(403);
    return;
  }

  const body = req.body as WebhookBody;
  console.info("[WhatsApp] webhook_received");

  void persistInboundMessages(body)
    .then(() => {
      if (!res.headersSent) {
        res.sendStatus(200);
      }
      console.info("[WhatsApp] webhook_ack");
      return routeConversationalMessages(body);
    })
    .catch((error: unknown) => {
      console.error(
        `[WhatsAppWebhook] inbound persist failed reason=${
          error instanceof Error ? error.name : "unknown"
        }`,
      );
      if (!res.headersSent) {
        res.sendStatus(500);
      }
    });
}

async function persistDeliveryStatuses(statuses: unknown[]): Promise<void> {
  for (const item of statuses) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const status = item as {
      id?: string;
      status?: string;
      timestamp?: string;
      errors?: Array<{ code?: number }>;
    };
    const messageId = status.id?.trim() || "";
    const deliveryStatus = status.status?.trim() || "unknown";
    const errorCode = status.errors?.find(
      (error) => typeof error.code === "number",
    )?.code;
    const timestampSeconds = Number(status.timestamp);
    const timestamp = Number.isFinite(timestampSeconds)
      ? new Date(timestampSeconds * 1000)
      : null;
    console.info("[WhatsAppWebhook] delivery status", {
      messageId: messageId || "-",
      status: deliveryStatus,
      ...(typeof errorCode === "number" ? { errorCode } : {}),
    });
    if (!messageId) {
      continue;
    }
    await applyInboxDeliveryStatus({
      providerMessageId: messageId,
      status: deliveryStatus,
      timestamp,
      ...(typeof errorCode === "number" ? { errorCode: String(errorCode) } : {}),
    });
    const result = await applyWhatsAppNotificationDeliveryStatus({
      messageId,
      status: deliveryStatus,
      timestamp,
      ...(typeof errorCode === "number" ? { errorCode: String(errorCode) } : {}),
    });
    if (result !== "updated") {
      continue;
    }
    const row = await WhatsAppNotificationDispatchModel.findOne({ messageId })
      .select("event entityId status")
      .lean();
    if (!row) {
      continue;
    }
    const reminderStatus =
      row.status === "failed"
        ? "failed"
        : row.status === "sent" ||
            row.status === "delivered" ||
            row.status === "read"
          ? "sent"
          : null;
    if (!reminderStatus) {
      continue;
    }
    await syncReminderWithDispatchStatus({
      event: row.event,
      entityId: row.entityId,
      status: reminderStatus,
      lastError:
        reminderStatus === "failed" && typeof errorCode === "number"
          ? `webhook_failed code=${errorCode}`
          : "",
    });
    console.info("[WhatsAppWebhook] delivery persisted", {
      messageId,
      event: row.event,
      status: row.status,
    });
  }
}

type WebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string };
        messages?: IncomingMessage[];
        statuses?: unknown[];
      };
    }>;
  }>;
};

function acceptsWebhookValue(
  value: { metadata?: { phone_number_id?: string } } | undefined,
): boolean {
  return isWebhookForConfiguredPhone(
    value?.metadata?.phone_number_id,
    env.WHATSAPP_PHONE_NUMBER_ID,
  );
}

async function persistInboundMessages(body: WebhookBody): Promise<void> {
  let persisted = 0;
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!acceptsWebhookValue(value)) {
        console.info("[WhatsAppWebhook] ignored event for a different phone number");
        continue;
      }
      if (value?.statuses?.length) {
        await persistDeliveryStatuses(value.statuses);
      }
      for (const message of value?.messages ?? []) {
        const messageId = message.id?.trim();
        const from = message.from?.trim();
        const described = describeInboundWhatsAppMessage(message);
        if (!messageId || !from || !described) continue;
        const saved = await recordInboundUserMessage({
          from,
          body: described.body,
          providerMessageId: messageId,
          messageType: described.messageType,
          occurredAt: whatsAppWebhookTime(message.timestamp),
        });
        if (saved.created) persisted += 1;
      }
    }
  }
  console.info(`[WhatsAppWebhook] inbox_persist created=${persisted}`);
}

async function routeConversationalMessages(body: WebhookBody): Promise<void> {
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!acceptsWebhookValue(value) || !value?.messages?.length) continue;

      for (const message of value.messages) {
        const messageId = message.id?.trim();
        const from = message.from?.trim();
        if (!messageId || !from) continue;

        const claimed = await claimWhatsAppEvent(messageId);
        if (!claimed) {
          console.info("[WhatsAppWebhook] duplicate event skipped");
          continue;
        }

        const paused = await isBotPausedForPhone(from);
        if (paused) {
          console.info(
            `[WhatsAppWebhook] bot paused; human inbox only messageId=${messageId}`,
          );
          continue;
        }

        if (message.type === "audio" && message.audio?.id) {
          await enqueueWhatsAppInbound({
            from,
            messageId,
            messageType: "audio",
            mediaId: message.audio.id,
            mimeType: message.audio.mime_type,
          });
          continue;
        }

        const extracted = extractText(message);
        if (!extracted?.text) continue;
        console.info(
          `[WhatsAppWebhook] routed conversational type=${message.type ?? "unknown"} messageId=${messageId}`,
        );
        await enqueueWhatsAppInbound({
          from,
          text: extracted.text,
          languageHint: extracted.languageHint,
          messageId,
          messageType: message.type,
        });
      }
    }
  }
}

function extractText(
  message: IncomingMessage,
): { text: string; languageHint: string } | null {
  if (message.type === "text") {
    const text = message.text?.body?.trim() || "";
    return text ? { text, languageHint: "" } : null;
  }
  if (message.type === "button") {
    const text = message.button?.text?.trim() || "";
    return text ? { text, languageHint: "" } : null;
  }
  if (message.type === "interactive") {
    const text =
      message.interactive?.button_reply?.title?.trim() ||
      message.interactive?.list_reply?.title?.trim() ||
      "";
    return text ? { text, languageHint: "" } : null;
  }
  return null;
}
