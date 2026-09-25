import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { claimWhatsAppEvent } from "./whatsapp-processed-event.model.js";
import { verifyWhatsAppSignature } from "./whatsapp-signature.js";
import { handleConversationalMessage } from "./whatsapp-bot.service.js";
import { WhatsAppService } from "./whatsapp.service.js";
import {
  nationalPhone,
  voiceUnclearCopy,
  type BotLanguage,
} from "./whatsapp-bot.logic.js";
import { WhatsAppSessionModel } from "./whatsapp-session.model.js";
import { generateFinalReply, transcribeWhatsAppAudio } from "./sarvam.client.js";

const whatsAppService = new WhatsAppService();

type IncomingMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
  audio?: { id?: string; mime_type?: string };
  button?: { text?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
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

  res.sendStatus(200);

  const body = req.body as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: IncomingMessage[];
          statuses?: unknown[];
        };
      }>;
    }>;
  };

  void processWebhook(body).catch((error: unknown) => {
    console.error(
      `[WhatsAppWebhook] async failure reason=${
        error instanceof Error ? error.name : "unknown"
      }`,
    );
  });
}

async function processWebhook(body: {
  entry?: Array<{
    changes?: Array<{
      value?: { messages?: IncomingMessage[]; statuses?: unknown[] };
    }>;
  }>;
}): Promise<void> {
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages?.length) {
        if (value?.statuses?.length) {
          console.info("[WhatsAppWebhook] status event acknowledged");
        }
        continue;
      }

      for (const message of value.messages) {
        const messageId = message.id?.trim();
        const from = message.from?.trim();
        if (!messageId || !from) continue;

        const claimed = await claimWhatsAppEvent(messageId);
        if (!claimed) {
          console.info("[WhatsAppWebhook] duplicate event skipped");
          continue;
        }

        const extracted = await extractText(message);
        if (!extracted?.text) continue;

        console.info(
          `[WhatsAppWebhook] routed conversational type=${message.type ?? "unknown"} messageId=${messageId}`,
        );
        await handleConversationalMessage({
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

async function extractText(
  message: IncomingMessage,
): Promise<{ text: string; languageHint: string } | null> {
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
  if (message.type === "audio" && message.audio?.id) {
    try {
      const media = await whatsAppService.downloadMedia(message.audio.id);
      const speech = await transcribeWhatsAppAudio({
        buffer: media.buffer,
        mimeType: message.audio.mime_type || media.mimeType,
      });
      console.info("[WhatsAppWebhook] voice transcript ready");
      return speech.transcript
        ? { text: speech.transcript, languageHint: speech.languageHint }
        : null;
    } catch (error) {
      console.error(
        `[WhatsAppWebhook] voice failed reason=${
          error instanceof Error ? error.name : "unknown"
        }`,
      );
      const phone = nationalPhone(message.from ?? "");
      const session = phone
        ? await WhatsAppSessionModel.findOne({ phone }).select("language").lean()
        : null;
      const language = (session?.language ?? "en") as BotLanguage;
      const generated = await generateFinalReply({
        originalText: "",
        language,
        accountType: "unknown",
        facts: { situation: "voice_failed" },
      });
      await whatsAppService.sendTextMessage(
        message.from ?? "",
        generated ?? voiceUnclearCopy(language),
      );
      return null;
    }
  }
  return null;
}
