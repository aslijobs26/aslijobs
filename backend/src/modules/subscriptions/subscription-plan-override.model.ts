import { Schema, model } from "mongoose";
import { SUBSCRIPTION_PLAN_CODES } from "./subscription.constants.js";

const subscriptionPlanOverrideSchema = new Schema(
  {
    code: { type: String, enum: SUBSCRIPTION_PLAN_CODES, unique: true, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    priceInr: { type: Number, min: 0, default: null },
    jobCredits: { type: Number, min: 1, default: null },
    listingValidityDays: { type: Number, min: 1, default: null },
    maxCities: { type: Number, min: 1, default: null },
    purchasable: { type: Boolean, default: false },
    contactSales: { type: Boolean, default: false },
    packageLabel: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    updatedByOperationsUserId: { type: Schema.Types.ObjectId, default: null },
  },
  { timestamps: true, collection: "subscription_plan_overrides" },
);

export const SubscriptionPlanOverrideModel = model(
  "SubscriptionPlanOverride",
  subscriptionPlanOverrideSchema,
);
