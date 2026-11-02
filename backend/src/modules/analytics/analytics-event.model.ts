import { Schema, model, type InferSchemaType, type Types } from "mongoose";

/**
 * Production website/app analytics events.
 *
 * Privacy rules:
 * - No passwords, OTPs, tokens, documents, or PII payloads.
 * - visitorId / sessionId are opaque client UUIDs.
 * - Do not store raw IP addresses on this collection.
 * - referrerHost is hostname-only (no full URL with query params).
 */
export const ANALYTICS_EVENT_NAMES = [
  "page_view",
  "session_start",
  "registration_started",
  "registration_completed",
  "otp_verified",
  "profile_completed",
  "job_search",
  "job_detail_viewed",
  "job_apply_started",
  "job_application_submitted",
  "employer_job_posted",
  "interview_scheduled",
  "interview_completed",
  "offer_sent",
  "candidate_selected",
  "candidate_joined",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export const ANALYTICS_PORTALS = [
  "public_site",
  "employer",
  "job_seeker",
  "unknown",
] as const;

export type AnalyticsPortal = (typeof ANALYTICS_PORTALS)[number];

export const ANALYTICS_DEVICES = [
  "desktop",
  "mobile",
  "tablet",
  "unknown",
] as const;

export type AnalyticsDevice = (typeof ANALYTICS_DEVICES)[number];

const analyticsEventSchema = new Schema(
  {
    eventName: {
      type: String,
      enum: ANALYTICS_EVENT_NAMES,
      required: true,
      index: true,
    },
    occurredAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
      index: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    portal: {
      type: String,
      enum: ANALYTICS_PORTALS,
      required: true,
      default: "public_site",
    },
    device: {
      type: String,
      enum: ANALYTICS_DEVICES,
      required: true,
      default: "unknown",
    },
    referrerHost: {
      type: String,
      trim: true,
      maxlength: 255,
      default: "",
    },
    utmSource: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    utmMedium: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    utmCampaign: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    utmContent: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    utmTerm: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    /** Current visit attribution. Does not replace the first-touch fields above. */
    sessionUtmSource: { type: String, trim: true, maxlength: 120, default: "" },
    sessionUtmMedium: { type: String, trim: true, maxlength: 120, default: "" },
    sessionUtmCampaign: { type: String, trim: true, maxlength: 120, default: "" },
    sessionUtmContent: { type: String, trim: true, maxlength: 120, default: "" },
    sessionUtmTerm: { type: String, trim: true, maxlength: 120, default: "" },
    landingPath: { type: String, trim: true, maxlength: 500, default: "" },
    audience: {
      type: String,
      enum: ["job_seeker", "employer", "unknown"],
      default: "unknown",
    },
    idempotencyKey: { type: String, trim: true, maxlength: 140, default: "" },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "analytics_events",
  },
);

analyticsEventSchema.index({ eventName: 1, occurredAt: -1 });
/** Registration-page counts filter event, path, and time together. */
analyticsEventSchema.index({ eventName: 1, path: 1, occurredAt: -1 });
analyticsEventSchema.index({ visitorId: 1, occurredAt: -1 });
analyticsEventSchema.index({ sessionId: 1, occurredAt: -1 });
analyticsEventSchema.index({ portal: 1, occurredAt: -1 });
analyticsEventSchema.index({ eventName: 1, audience: 1, occurredAt: -1 });
analyticsEventSchema.index({ utmSource: 1, occurredAt: -1 });
analyticsEventSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $gt: "" } } },
);

export type AnalyticsEventDocument = InferSchemaType<
  typeof analyticsEventSchema
> & {
  _id: Types.ObjectId;
  eventName: AnalyticsEventName;
  portal: AnalyticsPortal;
  device: AnalyticsDevice;
};

export const AnalyticsEventModel = model(
  "AnalyticsEvent",
  analyticsEventSchema,
);
