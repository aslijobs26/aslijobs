import { Schema, model } from "mongoose";

const whatsAppSessionSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    language: { type: String, enum: ["en", "hi", "te"], default: "en" },
    pendingLocation: { type: String, default: "" },
    pendingCategory: { type: String, default: "" },
    lastInteractionAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

whatsAppSessionSchema.index(
  { lastInteractionAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 14 },
);

export const WhatsAppSessionModel = model(
  "WhatsAppSession",
  whatsAppSessionSchema,
);
