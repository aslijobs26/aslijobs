import { Schema, model } from "mongoose";
import { WHATSAPP_NOTIFICATION_EVENTS } from "./whatsapp-notification.constants.js";

/**
 * queued: claimed locally, not yet offered to Meta.
 * processing: a worker or inline attempt is in flight.
 * accepted: Meta returned a message id. This is not delivery.
 * sent | delivered | read: webhook statuses, in that order.
 * failed: Meta or the worker rejected the send and it may be reclaimed.
 * ambiguous: the request timed out or the network dropped after it may have
 * been accepted. It is not retried, because a retry could duplicate the message.
 */
const STATUSES = [
  "queued",
  "processing",
  "accepted",
  "sent",
  "delivered",
  "read",
  "failed",
  "ambiguous",
] as const;

export const WHATSAPP_NOTIFICATION_DISPATCH_STATUSES = STATUSES;

export type WhatsAppNotificationDispatchStatus = (typeof STATUSES)[number];

/** A queued or processing row with no message id can be reclaimed after this. */
export const WHATSAPP_NOTIFICATION_STALE_CLAIM_MS = 15 * 60 * 1000;

const HANDED_OFF_STATUSES: WhatsAppNotificationDispatchStatus[] = [
  "accepted",
  "sent",
  "delivered",
  "read",
  "ambiguous",
];

const whatsAppNotificationDispatchSchema = new Schema(
  {
    idempotencyKey: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    event: {
      type: String,
      enum: WHATSAPP_NOTIFICATION_EVENTS,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    templateName: {
      type: String,
      required: true,
      trim: true,
    },
    language: {
      type: String,
      required: true,
      trim: true,
    },
    bodyParameters: {
      type: [String],
      default: [],
    },
    urlButtonParameters: {
      type: [String],
      default: [],
    },
    /** Exact rendered template text saved after Meta accepts the send. */
    renderedBody: {
      type: String,
      trim: true,
      default: "",
      maxlength: 4096,
    },
    recipientMasked: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: STATUSES,
      required: true,
      default: "queued",
      index: true,
    },
    messageId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    correlationId: {
      type: String,
      trim: true,
      default: "",
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    failureClass: {
      type: String,
      trim: true,
      default: "",
    },
    lastMetaCode: {
      type: String,
      trim: true,
      default: "",
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    statusAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

export const WhatsAppNotificationDispatchModel = model(
  "WhatsAppNotificationDispatch",
  whatsAppNotificationDispatchSchema,
);

function sanitizeTemplateParameters(values: readonly string[] | undefined): string[] {
  return (values ?? [])
    .slice(0, 10)
    .map((value) => value.trim().slice(0, 1000));
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

export type WhatsAppDispatchClaimSnapshot = {
  status: string;
  messageId?: string | null;
  updatedAt?: Date | null;
};

/**
 * Failed rows with no Meta message id can be sent again.
 * Accepted, delivered, and ambiguous rows must not be sent again.
 * A fresh queued or processing row is left alone so two requests cannot both send.
 */
export function decideDispatchReclaim(
  existing: WhatsAppDispatchClaimSnapshot | null,
  now = new Date(),
): "reclaim" | "duplicate" {
  if (!existing) {
    return "duplicate";
  }
  if ((existing.messageId ?? "").trim()) {
    return "duplicate";
  }
  if (existing.status === "failed") {
    return "reclaim";
  }
  const updatedAt = existing.updatedAt?.getTime() ?? now.getTime();
  const stale =
    now.getTime() - updatedAt >= WHATSAPP_NOTIFICATION_STALE_CLAIM_MS;
  if (
    stale &&
    (existing.status === "queued" || existing.status === "processing")
  ) {
    return "reclaim";
  }
  return "duplicate";
}

export async function claimWhatsAppNotificationDispatch(input: {
  idempotencyKey: string;
  event: string;
  entityId: string;
  templateName: string;
  language: string;
  recipientMasked: string;
  bodyParameters?: readonly string[];
  urlButtonParameters?: readonly string[];
  correlationId?: string;
}): Promise<"claimed" | "duplicate"> {
  try {
    await WhatsAppNotificationDispatchModel.create({
      ...input,
      bodyParameters: sanitizeTemplateParameters(input.bodyParameters),
      urlButtonParameters: sanitizeTemplateParameters(input.urlButtonParameters),
      status: "queued",
      correlationId: input.correlationId?.trim() ?? "",
      statusAt: new Date(),
    });
    return "claimed";
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }
  }

  const existing = await WhatsAppNotificationDispatchModel.findOne({
    idempotencyKey: input.idempotencyKey,
  })
    .select("status messageId updatedAt")
    .lean();
  if (decideDispatchReclaim(existing) !== "reclaim") {
    return "duplicate";
  }

  const reclaimed = await WhatsAppNotificationDispatchModel.findOneAndUpdate(
    {
      idempotencyKey: input.idempotencyKey,
      status: existing?.status,
      messageId: { $in: ["", null] },
    },
    {
      $set: {
        status: "queued",
        templateName: input.templateName,
        language: input.language,
        bodyParameters: sanitizeTemplateParameters(input.bodyParameters),
        urlButtonParameters: sanitizeTemplateParameters(input.urlButtonParameters),
        recipientMasked: input.recipientMasked,
        correlationId: input.correlationId?.trim() ?? "",
        lastError: "",
        failureClass: "",
        lastMetaCode: "",
        statusAt: new Date(),
      },
    },
    { new: true },
  );
  return reclaimed ? "claimed" : "duplicate";
}

export async function markWhatsAppNotificationDispatchProcessing(input: {
  idempotencyKey: string;
  attempt: number;
}): Promise<void> {
  await WhatsAppNotificationDispatchModel.updateOne(
    {
      idempotencyKey: input.idempotencyKey,
      status: { $nin: HANDED_OFF_STATUSES },
    },
    {
      $set: {
        status: "processing",
        attemptCount: input.attempt,
        statusAt: new Date(),
      },
    },
  );
}

/**
 * Records Meta API acceptance. Does not mean the phone delivered the message.
 */
export async function markWhatsAppNotificationDispatchAccepted(input: {
  idempotencyKey: string;
  messageId: string;
  renderedBody?: string;
  urlButtonParameters?: readonly string[];
}): Promise<void> {
  const now = new Date();
  const renderedBody = input.renderedBody?.trim() ?? "";
  await WhatsAppNotificationDispatchModel.updateOne(
    {
      idempotencyKey: input.idempotencyKey,
      status: { $nin: ["sent", "delivered", "read"] },
    },
    {
      $set: {
        status: "accepted",
        messageId: input.messageId,
        acceptedAt: now,
        statusAt: now,
        lastError: "",
        failureClass: "",
        ...(renderedBody ? { renderedBody: renderedBody.slice(0, 4096) } : {}),
        ...(input.urlButtonParameters
          ? {
              urlButtonParameters: sanitizeTemplateParameters(
                input.urlButtonParameters,
              ),
            }
          : {}),
      },
    },
  );
}

/**
 * Meta returned a message id, but the acceptance row could not be saved.
 * Ambiguous is not retried, so a later attempt cannot send the template again.
 */
export async function lockWhatsAppNotificationDispatchAfterAccept(input: {
  idempotencyKey: string;
  messageId: string;
  lastError: string;
  renderedBody?: string;
}): Promise<void> {
  const now = new Date();
  const renderedBody = input.renderedBody?.trim() ?? "";
  await WhatsAppNotificationDispatchModel.updateOne(
    {
      idempotencyKey: input.idempotencyKey,
      status: { $nin: ["accepted", "sent", "delivered", "read"] },
    },
    {
      $set: {
        status: "ambiguous",
        failureClass: "ambiguous",
        messageId: input.messageId,
        lastError: input.lastError.slice(0, 300),
        statusAt: now,
        ...(renderedBody ? { renderedBody: renderedBody.slice(0, 4096) } : {}),
      },
    },
  );
}

/** @deprecated Meta acceptance is `accepted`. Kept so older callers still compile. */
export async function markWhatsAppNotificationDispatchSent(input: {
  idempotencyKey: string;
  messageId: string;
}): Promise<void> {
  await markWhatsAppNotificationDispatchAccepted(input);
}

export async function wasWhatsAppNotificationDispatchHandedOff(
  idempotencyKey: string,
): Promise<boolean> {
  const row = await WhatsAppNotificationDispatchModel.findOne({
    idempotencyKey,
    status: { $in: HANDED_OFF_STATUSES },
  })
    .select("_id")
    .lean();
  return Boolean(row);
}

export async function wasWhatsAppNotificationDispatchSent(
  idempotencyKey: string,
): Promise<boolean> {
  return wasWhatsAppNotificationDispatchHandedOff(idempotencyKey);
}

export async function markWhatsAppNotificationDispatchFailed(input: {
  idempotencyKey: string;
  lastError: string;
  failureClass?: string;
  metaCode?: string;
}): Promise<void> {
  const now = new Date();
  await WhatsAppNotificationDispatchModel.updateOne(
    {
      idempotencyKey: input.idempotencyKey,
      status: { $nin: ["sent", "delivered", "read", "accepted"] },
    },
    {
      $set: {
        status: "failed",
        failureClass: input.failureClass?.trim() || "permanent",
        lastMetaCode: input.metaCode?.trim() || "",
        lastError: input.lastError.slice(0, 300),
        failedAt: now,
        statusAt: now,
      },
    },
  );
}

export async function markWhatsAppNotificationDispatchAmbiguous(input: {
  idempotencyKey: string;
  lastError: string;
}): Promise<void> {
  const now = new Date();
  await WhatsAppNotificationDispatchModel.updateOne(
    {
      idempotencyKey: input.idempotencyKey,
      messageId: { $in: ["", null] },
      status: { $nin: ["accepted", "sent", "delivered", "read"] },
    },
    {
      $set: {
        status: "ambiguous",
        failureClass: "ambiguous",
        lastError: input.lastError.slice(0, 300),
        statusAt: now,
      },
    },
  );
}

const DELIVERY_RANK: Record<string, number> = {
  queued: 0,
  processing: 1,
  ambiguous: 2,
  failed: 3,
  accepted: 3,
  sent: 4,
  delivered: 5,
  read: 6,
};

export type WhatsAppWebhookDeliveryStatus =
  | "sent"
  | "delivered"
  | "read"
  | "failed";

/**
 * A newer webhook may advance the status. An older one must not overwrite it.
 * `failed` can replace acceptance or `sent`, and must not replace delivered or read.
 */
export function shouldApplyWhatsAppDeliveryStatus(
  current: string,
  incoming: WhatsAppWebhookDeliveryStatus,
): boolean {
  if (current === incoming) {
    return false;
  }
  if (incoming === "failed") {
    return (
      current === "queued" ||
      current === "processing" ||
      current === "accepted" ||
      current === "sent" ||
      current === "ambiguous"
    );
  }
  return (DELIVERY_RANK[incoming] ?? 0) > (DELIVERY_RANK[current] ?? 0);
}

export async function applyWhatsAppNotificationDeliveryStatus(input: {
  messageId: string;
  status: string;
  timestamp?: Date | null;
  errorCode?: string;
}): Promise<"updated" | "ignored" | "unknown"> {
  const messageId = input.messageId.trim();
  const incoming = input.status.trim() as WhatsAppWebhookDeliveryStatus;
  if (!messageId || !["sent", "delivered", "read", "failed"].includes(incoming)) {
    return "ignored";
  }

  const row = await WhatsAppNotificationDispatchModel.findOne({ messageId })
    .select("status event entityId")
    .lean();
  if (!row) {
    return "unknown";
  }
  if (!shouldApplyWhatsAppDeliveryStatus(row.status, incoming)) {
    return "ignored";
  }

  const at = input.timestamp ?? new Date();
  const patch: Record<string, unknown> = {
    status: incoming,
    statusAt: at,
  };
  if (incoming === "sent") {
    patch.sentAt = at;
  } else if (incoming === "delivered") {
    patch.deliveredAt = at;
  } else if (incoming === "read") {
    patch.readAt = at;
  } else {
    patch.failedAt = at;
    patch.failureClass = "permanent";
    patch.lastError = input.errorCode
      ? `webhook_failed code=${input.errorCode}`
      : "webhook_failed";
    if (input.errorCode) {
      patch.lastMetaCode = input.errorCode;
    }
  }

  const updated = await WhatsAppNotificationDispatchModel.updateOne(
    { messageId, status: row.status },
    { $set: patch },
  );
  return updated.modifiedCount === 1 ? "updated" : "ignored";
}
