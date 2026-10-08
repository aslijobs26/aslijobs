import { Schema, model } from "mongoose";
import { WHATSAPP_NOTIFICATION_EVENTS } from "./whatsapp-notification.constants.js";

const STATUSES = ["queued", "sent", "failed"] as const;

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
    },
    sentAt: {
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

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

export async function claimWhatsAppNotificationDispatch(input: {
  idempotencyKey: string;
  event: string;
  entityId: string;
  templateName: string;
  language: string;
  recipientMasked: string;
}): Promise<"claimed" | "duplicate"> {
  try {
    await WhatsAppNotificationDispatchModel.create({
      ...input,
      status: "queued",
    });
    return "claimed";
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return "duplicate";
    }
    throw error;
  }
}

export async function markWhatsAppNotificationDispatchSent(input: {
  idempotencyKey: string;
  messageId: string;
}): Promise<void> {
  await WhatsAppNotificationDispatchModel.updateOne(
    { idempotencyKey: input.idempotencyKey },
    {
      $set: {
        status: "sent",
        messageId: input.messageId,
        sentAt: new Date(),
        lastError: "",
      },
    },
  );
}

export async function wasWhatsAppNotificationDispatchSent(
  idempotencyKey: string,
): Promise<boolean> {
  const row = await WhatsAppNotificationDispatchModel.findOne({
    idempotencyKey,
    status: "sent",
  })
    .select("_id")
    .lean();
  return Boolean(row);
}

export async function markWhatsAppNotificationDispatchFailed(input: {
  idempotencyKey: string;
  lastError: string;
}): Promise<void> {
  await WhatsAppNotificationDispatchModel.updateOne(
    { idempotencyKey: input.idempotencyKey },
    {
      $set: {
        status: "failed",
        lastError: input.lastError.slice(0, 300),
      },
    },
  );
}
