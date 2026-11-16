import { Schema, model } from "mongoose";

const RETENTION_SECONDS = 180 * 24 * 60 * 60;

/**
 * Append-only log of signed Cashfree webhook deliveries.
 * `payloadHash` dedupes retries; an event is reprocessed until processedAt is set.
 */
const paymentWebhookEventSchema = new Schema(
  {
    provider: { type: String, enum: ["cashfree"], required: true, default: "cashfree" },
    eventType: { type: String, trim: true, default: "" },
    orderId: { type: String, trim: true, default: "", index: true },
    cfPaymentId: { type: String, trim: true, default: "" },
    payloadHash: { type: String, required: true, unique: true },
    payload: { type: Schema.Types.Mixed, default: null },
    processedAt: { type: Date, default: null },
    processingError: { type: String, trim: true, default: "" },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "payment_webhook_events" },
);

paymentWebhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS });

export const PaymentWebhookEventModel = model(
  "PaymentWebhookEvent",
  paymentWebhookEventSchema,
);
