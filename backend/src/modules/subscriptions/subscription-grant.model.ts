import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  SUBSCRIPTION_GRANT_SOURCES,
  SUBSCRIPTION_GRANT_STATUSES,
  SUBSCRIPTION_PLAN_CODES,
} from "./subscription.constants.js";

/** One job listing paid for by a grant. cityKey drives the per-plan city limit. */
const consumedJobSchema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    cityKey: { type: String, trim: true, default: "" },
    cityKeys: { type: [String], default: [] },
    consumedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

/**
 * An entitlement held by an employer: the free plan, a paid purchase, or a
 * manual Operations grant. Credits are consumed atomically (see
 * subscription-entitlement.service.ts).
 */
const subscriptionGrantSchema = new Schema(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
    planCode: { type: String, enum: SUBSCRIPTION_PLAN_CODES, required: true },
    planName: { type: String, trim: true, default: "" },
    packageLabel: { type: String, trim: true, default: "" },
    source: { type: String, enum: SUBSCRIPTION_GRANT_SOURCES, required: true },
    /** Lower is consumed first. Free = 0, paid = 1. */
    consumePriority: { type: Number, required: true, default: 1 },
    jobCredits: { type: Number, required: true, min: 0 },
    jobCreditsUsed: { type: Number, required: true, min: 0, default: 0 },
    listingValidityDays: { type: Number, required: true, min: 1 },
    maxCities: { type: Number, required: true, min: 1 },
    consumedJobs: { type: [consumedJobSchema], default: [] },
    status: {
      type: String,
      enum: SUBSCRIPTION_GRANT_STATUSES,
      required: true,
      default: "active",
    },
    paymentOrderId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentOrder",
      default: null,
    },
    priceInr: { type: Number, required: true, min: 0, default: 0 },
    activatedAt: { type: Date, required: true, default: Date.now },
    grantedByOperationsUserId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      default: null,
    },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "subscription_grants" },
);

subscriptionGrantSchema.index({
  employerId: 1,
  status: 1,
  consumePriority: 1,
  activatedAt: 1,
});
/** Exactly one free grant per employer — makes auto-assignment race-safe. */
subscriptionGrantSchema.index(
  { employerId: 1 },
  { unique: true, partialFilterExpression: { planCode: "free" }, name: "uniq_free_grant_per_employer" },
);
/** One paid order can only ever produce one grant (duplicate webhooks). */
subscriptionGrantSchema.index(
  { paymentOrderId: 1 },
  {
    unique: true,
    partialFilterExpression: { paymentOrderId: { $type: "objectId" } },
    name: "uniq_grant_per_payment_order",
  },
);
subscriptionGrantSchema.index({ "consumedJobs.jobId": 1 });

export type SubscriptionGrant = InferSchemaType<typeof subscriptionGrantSchema>;
export type SubscriptionGrantLean = SubscriptionGrant & { _id: Types.ObjectId };

export const SubscriptionGrantModel = model(
  "SubscriptionGrant",
  subscriptionGrantSchema,
);
