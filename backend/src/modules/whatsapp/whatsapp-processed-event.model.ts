import { Schema, model } from "mongoose";

const whatsAppProcessedEventSchema = new Schema(
  {
    messageId: { type: String, required: true, unique: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

whatsAppProcessedEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 7 },
);

export const WhatsAppProcessedEventModel = model(
  "WhatsAppProcessedEvent",
  whatsAppProcessedEventSchema,
);

export async function claimWhatsAppEvent(messageId: string): Promise<boolean> {
  try {
    await WhatsAppProcessedEventModel.create({ messageId });
    return true;
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? (error as { code?: number }).code
        : undefined;
    if (code === 11000) {
      return false;
    }
    throw error;
  }
}

/**
 * Releases a claim after enqueue/routing failure so Meta redelivery (or a later
 * recovery path) can process the message. Never throws.
 */
export async function releaseWhatsAppEvent(messageId: string): Promise<void> {
  try {
    await WhatsAppProcessedEventModel.deleteOne({ messageId });
  } catch (error) {
    console.error(
      `[WhatsAppWebhook] claim_release_failed messageId=${messageId} reason=${
        error instanceof Error ? error.name : "unknown"
      }`,
    );
  }
}
