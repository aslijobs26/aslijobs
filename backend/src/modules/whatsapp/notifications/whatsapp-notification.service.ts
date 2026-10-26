import { maskWhatsAppRecipient } from "../whatsapp.service.js";
import {
  getWhatsAppNotificationTemplate,
  isWhatsAppNotificationEvent,
  resolveWhatsAppNotificationDelivery,
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

  const delivery = resolveWhatsAppNotificationDelivery(
    payload.event,
    payload.preferredLanguage,
  );
  if (!delivery) {
    console.info(
      `[WhatsAppNotification] skipped unconfigured event=${payload.event} language=${payload.preferredLanguage ?? "en"}`,
    );
    return "skipped_unconfigured";
  }

  const { templateName, languageCode } = delivery;
  const bodyParameters = buildWhatsAppNotificationBodyParameters(
    payload.event,
    payload,
  );
  if (
    payload.event === "EMPLOYER_ACCOUNT_APPROVED" &&
    bodyParameters.length === 0
  ) {
    console.info(
      "[WhatsAppNotification] Employer approval notification skipped - missing profile type",
      { employerId: payload.entityId.trim() },
    );
    return "skipped_unconfigured";
  }
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
    templateName,
    language: languageCode,
    recipientMasked: maskWhatsAppRecipient(payload.phoneNumber),
    bodyParameters,
    ...(payload.correlationId?.trim()
      ? { correlationId: payload.correlationId.trim() }
      : {}),
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
    templateName,
    languageCode,
    bodyParameters,
    ...(urlButtonParameters.length > 0 ? { urlButtonParameters } : {}),
    ...(payload.idempotencyScope?.trim()
      ? { idempotencyScope: payload.idempotencyScope.trim() }
      : {}),
    idempotencyKey,
    ...(payload.correlationId?.trim()
      ? { correlationId: payload.correlationId.trim() }
      : {}),
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
