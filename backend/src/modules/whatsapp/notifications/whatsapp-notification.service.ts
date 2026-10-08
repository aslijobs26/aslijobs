import { maskWhatsAppRecipient } from "../whatsapp.service.js";
import {
  getWhatsAppNotificationTemplate,
  isWhatsAppNotificationEvent,
  resolveWhatsAppNotificationLanguage,
  buildWhatsAppNotificationBodyParameters,
  buildWhatsAppNotificationUrlButtonParameters,
  whatsAppNotificationIdempotencyKey,
} from "./whatsapp-notification.policy.js";
import { claimWhatsAppNotificationDispatch } from "./whatsapp-notification.model.js";
import { enqueueWhatsAppNotificationJob } from "./whatsapp-notification.queue.js";
import type {
  WhatsAppNotificationEnqueueResult,
  WhatsAppNotificationPayload,
  WhatsAppNotificationQueueJob,
} from "./whatsapp-notification.types.js";

export type WhatsAppNotificationEnqueueDeps = {
  claim: typeof claimWhatsAppNotificationDispatch;
  enqueueJob: (job: WhatsAppNotificationQueueJob) => Promise<void>;
};

const defaultEnqueueDeps: WhatsAppNotificationEnqueueDeps = {
  claim: claimWhatsAppNotificationDispatch,
  enqueueJob: enqueueWhatsAppNotificationJob,
};

/**
 * Validates an event, maps the approved Meta template, and queues delivery.
 * Never waits on Meta. Never throws to the business caller.
 */
export async function enqueueWhatsAppNotification(
  payload: WhatsAppNotificationPayload,
  deps: WhatsAppNotificationEnqueueDeps = defaultEnqueueDeps,
): Promise<WhatsAppNotificationEnqueueResult> {
  if (!isWhatsAppNotificationEvent(payload.event) || !payload.entityId.trim()) {
    console.error("[WhatsAppNotification] skipped invalid event payload");
    return "skipped_unconfigured";
  }

  const template = getWhatsAppNotificationTemplate(payload.event);
  if (!template) {
    console.info(
      `[WhatsAppNotification] skipped unconfigured event=${payload.event}`,
    );
    return "skipped_unconfigured";
  }

  const languageCode = resolveWhatsAppNotificationLanguage(
    payload.event,
    payload.preferredLanguage,
  );
  const bodyParameters = buildWhatsAppNotificationBodyParameters(
    payload.event,
    payload,
  );
  const urlButtonParameters = buildWhatsAppNotificationUrlButtonParameters(
    payload.event,
    payload,
  );
  const idempotencyKey = whatsAppNotificationIdempotencyKey(
    payload.event,
    payload.entityId,
    payload.idempotencyScope,
  );

  const claim = await deps.claim({
    idempotencyKey,
    event: payload.event,
    entityId: payload.entityId.trim(),
    templateName: template.templateName,
    language: languageCode,
    recipientMasked: maskWhatsAppRecipient(payload.phoneNumber),
  });

  if (claim === "duplicate") {
    console.info(
      `[WhatsAppNotification] duplicate skipped event=${payload.event} entityId=${payload.entityId.trim()}`,
    );
    return "skipped_duplicate";
  }

  await deps.enqueueJob({
    event: payload.event,
    entityId: payload.entityId.trim(),
    phoneNumber: payload.phoneNumber,
    templateName: template.templateName,
    languageCode,
    bodyParameters,
    ...(urlButtonParameters.length > 0 ? { urlButtonParameters } : {}),
    ...(payload.idempotencyScope?.trim()
      ? { idempotencyScope: payload.idempotencyScope.trim() }
      : {}),
    idempotencyKey,
  });

  return "queued";
}

export function scheduleWhatsAppNotification(
  payload: WhatsAppNotificationPayload,
): void {
  void enqueueWhatsAppNotification(payload).catch((error) => {
    console.error("[WhatsAppNotification] enqueue rejected", {
      event: payload.event,
      entityId: payload.entityId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}
