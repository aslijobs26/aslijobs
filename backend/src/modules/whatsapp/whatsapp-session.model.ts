import { Schema, model } from "mongoose";

const whatsAppSessionSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    language: {
      type: String,
      enum: ["en", "hi", "te", "ta", "kn", "ml"],
      default: "en",
    },
    activeRole: {
      type: String,
      enum: ["", "seeker", "employer"],
      default: "",
    },
    pendingLocation: { type: String, default: "" },
    pendingCategory: { type: String, default: "" },
    pendingOpenSearch: { type: Boolean, default: false },
    pendingIntent: { type: String, default: "" },
    /** Last answered product intent — used for short follow-ups (Status?, bare role). */
    lastIntent: { type: String, default: "" },
    /** e.g. job_search_no_match — menu follow-up after empty salary-constrained search. */
    pendingClarification: { type: String, default: "" },
    /** Same clarify field asked again without new slots — loop break after bound. */
    lastClarifyMissing: { type: String, default: "" },
    clarifyAttempts: { type: Number, default: 0 },
    pendingNearbyCity: { type: String, default: "" },
    lastLocation: { type: String, default: "" },
    lastCategory: { type: String, default: "" },
    lastExperience: { type: String, default: "" },
    lastExperienceYears: { type: Number, default: null },
    lastExperienceRange: { type: String, default: "" },
    lastMinSalary: { type: Number, default: null },
    lastMaxSalary: { type: Number, default: null },
    lastSalaryBasis: { type: String, enum: ["", "monthly", "annual"], default: "" },
    locationKind: {
      type: String,
      enum: ["", "city", "state"],
      default: "",
    },
    conversationState: {
      type: String,
      enum: ["", "NEW_USER_INTENT", "SEEKER_MENU", "EMPLOYER_MENU"],
      default: "",
    },
    /** Soft resume context from WhatsApp media extract — never auto-writes JobSeeker. */
    lastResumeSkills: { type: [String], default: [] },
    lastResumeAt: { type: Date, default: null },
    /** Last inbound message id that already got a media progress ack (idempotency). */
    lastMediaProgressMessageId: { type: String, default: "" },
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
