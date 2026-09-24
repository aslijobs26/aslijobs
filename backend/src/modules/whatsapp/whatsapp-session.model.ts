import { Schema, model } from "mongoose";

const whatsAppSessionSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    language: {
      type: String,
      enum: ["en", "hi", "te", "ta", "kn", "ml"],
      default: "en",
    },
    pendingLocation: { type: String, default: "" },
    pendingCategory: { type: String, default: "" },
    lastLocation: { type: String, default: "" },
    lastCategory: { type: String, default: "" },
    lastJobs: {
      type: [
        {
          jobId: { type: String, default: "" },
          jobTitle: { type: String, default: "" },
          companyName: { type: String, default: "" },
          cityName: { type: String, default: "" },
          salaryLabel: { type: String, default: "" },
        },
      ],
      default: [],
    },
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
