import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const paymentLinkSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true, select: false },
  orderId: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ["active", "paid", "expired"], default: "active", index: true },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true, collection: "payment_links" });

export type PaymentLink = InferSchemaType<typeof paymentLinkSchema>;
export type PaymentLinkLean = PaymentLink & { _id: Types.ObjectId };
export const PaymentLinkModel = model("PaymentLink", paymentLinkSchema);
