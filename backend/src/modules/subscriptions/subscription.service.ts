import mongoose, { type Types } from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { EnterpriseLeadModel } from "./enterprise-lead.model.js";
import {
  GRANT_CONSUME_PRIORITY,
  computeGst,
  PURCHASABLE_PLAN_CODES,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PLAN_CODES,
  type PurchasablePlanCode,
  type SubscriptionPlanCode,
} from "./subscription.constants.js";
import {
  SubscriptionGrantModel,
  type SubscriptionGrantLean,
} from "./subscription-grant.model.js";

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    Number((error as { code?: unknown }).code) === 11000
  );
}

function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  if (typeof id !== "string") {
    return id;
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return new mongoose.Types.ObjectId(id);
}

export function distinctCities(grant: Pick<SubscriptionGrantLean, "consumedJobs">): string[] {
  return [...new Set((grant.consumedJobs ?? []).map((entry) => entry.cityKey ?? ""))];
}

function toPublicGrant(grant: SubscriptionGrantLean) {
  const plan = SUBSCRIPTION_PLANS[grant.planCode as SubscriptionPlanCode];
  const remaining = Math.max(0, grant.jobCredits - grant.jobCreditsUsed);
  return {
    id: grant._id.toString(),
    planCode: grant.planCode,
    planName: plan?.name ?? grant.planCode,
    source: grant.source,
    status: grant.status,
    jobCredits: grant.jobCredits,
    jobCreditsUsed: grant.jobCreditsUsed,
    jobCreditsRemaining: grant.status === "active" ? remaining : 0,
    listingValidityDays: grant.listingValidityDays,
    maxCities: grant.maxCities,
    citiesUsed: distinctCities(grant).filter(Boolean),
    priceInr: grant.priceInr,
    activatedAt: grant.activatedAt?.toISOString() ?? null,
  };
}

export const subscriptionService = {
  listPlans() {
    return SUBSCRIPTION_PLAN_CODES.map((code) => {
      const plan = SUBSCRIPTION_PLANS[code];
      const gst = plan.priceInr && plan.priceInr > 0 ? computeGst(plan.priceInr) : null;
      return {
        code: plan.code,
        name: plan.name,
        priceInr: plan.priceInr,
        /** Null for free / contact-sales plans. */
        gstRatePercent: gst?.gstRatePercent ?? null,
        gstAmountInr: gst?.gstAmount ?? null,
        totalPriceInr: gst?.totalAmount ?? null,
        currency: "INR",
        jobCredits: plan.jobCredits,
        listingValidityDays: plan.listingValidityDays,
        maxCities: plan.maxCities,
        purchasable: plan.purchasable,
        contactSales: plan.contactSales,
        description: plan.description,
      };
    });
  },

  /**
   * Idempotently grants the Free plan. Silent by design: no notification,
   * email, or WhatsApp message is ever sent from here.
   */
  async ensureFreeGrant(employerId: string | Types.ObjectId): Promise<void> {
    const employerObjectId = toObjectId(employerId);
    const plan = SUBSCRIPTION_PLANS.free;
    try {
      await SubscriptionGrantModel.updateOne(
        { employerId: employerObjectId, planCode: "free" },
        {
          $setOnInsert: {
            employerId: employerObjectId,
            planCode: "free",
            source: "auto_free",
            consumePriority: GRANT_CONSUME_PRIORITY.auto_free,
            jobCredits: plan.jobCredits ?? 1,
            jobCreditsUsed: 0,
            listingValidityDays: plan.listingValidityDays ?? 7,
            maxCities: plan.maxCities ?? 1,
            consumedJobs: [],
            status: "active",
            paymentOrderId: null,
            priceInr: 0,
            activatedAt: new Date(),
          },
        },
        { upsert: true },
      );
    } catch (error) {
      // Concurrent upserts race on the unique index; the grant exists either way.
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
    }
  },

  async getMySubscription(employerId: string) {
    await this.ensureFreeGrant(employerId);
    const grants = (await SubscriptionGrantModel.find({
      employerId: toObjectId(employerId),
    })
      .sort({ consumePriority: 1, activatedAt: 1 })
      .lean()) as SubscriptionGrantLean[];

    const publicGrants = grants.map(toPublicGrant);
    const remaining = publicGrants.reduce(
      (sum, grant) => sum + grant.jobCreditsRemaining,
      0,
    );

    return {
      jobCreditsRemaining: remaining,
      canPostJob: remaining > 0,
      activeGrants: publicGrants.filter((grant) => grant.status === "active"),
      history: publicGrants,
      purchasablePlans: PURCHASABLE_PLAN_CODES,
    };
  },

  /** Creates the grant for a PAID order exactly once (unique paymentOrderId). */
  async grantForPaidOrder(input: {
    employerId: Types.ObjectId;
    paymentOrderId: Types.ObjectId;
    planCode: PurchasablePlanCode;
    priceInr: number;
  }): Promise<SubscriptionGrantLean> {
    const plan = SUBSCRIPTION_PLANS[input.planCode];
    try {
      const created = await SubscriptionGrantModel.create({
        employerId: input.employerId,
        planCode: plan.code,
        source: "payment",
        consumePriority: GRANT_CONSUME_PRIORITY.payment,
        jobCredits: plan.jobCredits ?? 0,
        jobCreditsUsed: 0,
        listingValidityDays: plan.listingValidityDays ?? 7,
        maxCities: plan.maxCities ?? 1,
        status: "active",
        paymentOrderId: input.paymentOrderId,
        priceInr: input.priceInr,
        activatedAt: new Date(),
      });
      return created.toObject() as SubscriptionGrantLean;
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
      const existing = (await SubscriptionGrantModel.findOne({
        paymentOrderId: input.paymentOrderId,
      }).lean()) as SubscriptionGrantLean | null;
      if (!existing) {
        throw error;
      }
      return existing;
    }
  },

  async createEnterpriseLead(input: {
    employerId?: string | null;
    contactName: string;
    phone: string;
    email?: string;
    companyName?: string;
    expectedMonthlyHires?: number | null;
    message?: string;
  }) {
    const lead = await EnterpriseLeadModel.create({
      employerId:
        input.employerId && mongoose.Types.ObjectId.isValid(input.employerId)
          ? new mongoose.Types.ObjectId(input.employerId)
          : null,
      contactName: input.contactName,
      phone: input.phone,
      email: input.email ?? "",
      companyName: input.companyName ?? "",
      expectedMonthlyHires: input.expectedMonthlyHires ?? null,
      message: input.message ?? "",
    });
    return { id: lead._id.toString(), status: lead.status };
  },
};
