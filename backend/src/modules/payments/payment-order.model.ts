import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { SUBSCRIPTION_PLAN_CODES } from "../subscriptions/subscription.constants.js";

export const PAYMENT_ORDER_STATUSES = [
  "created",
  "paid",
  "failed",
  "user_dropped",
  "expired",
  "cancelled",
] as const;

export type PaymentOrderStatus = (typeof PAYMENT_ORDER_STATUSES)[number];

const paymentOrderSchema = new Schema(
  {
    provider: { type: String, enum: ["cashfree"], required: true, default: "cashfree" },
    /** Our merchant order id sent to Cashfree. */
    orderId: { type: String, required: true, unique: true, trim: true },
    cfOrderId: { type: String, trim: true, default: "" },
    /** Checkout token. Returned to the employer once; never listed. */
    paymentSessionId: { type: String, trim: true, default: "", select: false },
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
    /** Team member who started checkout (null → account owner). */
    initiatedByTeamMemberId: { type: Schema.Types.ObjectId, default: null },
    planCode: { type: String, enum: SUBSCRIPTION_PLAN_CODES, required: true },
    planName: { type: String, trim: true, default: "" },
    packageLabel: { type: String, trim: true, default: "" },
    jobCredits: { type: Number, min: 1, default: null },
    listingValidityDays: { type: Number, min: 1, default: null },
    maxCities: { type: Number, min: 1, default: null },
    /** Total charged via Cashfree (base + GST), rupees. */
    amount: { type: Number, required: true, min: 1 },
    /** Plan price before tax. null on orders created before GST was added. */
    planPrice: { type: Number, default: null },
    baseAmount: { type: Number, default: null },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    discountAmount: { type: Number, min: 0, default: 0 },
    gstRatePercent: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    currency: { type: String, required: true, default: "INR" },
    status: {
      type: String,
      enum: PAYMENT_ORDER_STATUSES,
      required: true,
      default: "created",
      index: true,
    },
    cfPaymentId: { type: String, trim: true, default: "" },
    paymentGroup: { type: String, trim: true, default: "" },
    bankReference: { type: String, trim: true, default: "" },
    paidAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    failureReason: { type: String, trim: true, default: "" },
    grantId: { type: Schema.Types.ObjectId, ref: "SubscriptionGrant", default: null },
    expiresAt: { type: Date, required: true },
    lastVerifiedAt: { type: Date, default: null },
    environment: { type: String, enum: ["sandbox", "production"], required: true },
  },
  { timestamps: true, collection: "payment_orders" },
);

paymentOrderSchema.index({ employerId: 1, createdAt: -1 });
/** Stale-order reconcile sweep. */
paymentOrderSchema.index({ status: 1, createdAt: 1 });

export type PaymentOrder = InferSchemaType<typeof paymentOrderSchema>;
export type PaymentOrderLean = PaymentOrder & { _id: Types.ObjectId };

export const PaymentOrderModel = model("PaymentOrder", paymentOrderSchema);
