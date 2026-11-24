import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { SubscriptionGrantModel } from "../../subscriptions/subscription-grant.model.js";
import { resolveSubscriptionPlans, saveSubscriptionPlan } from "../../subscriptions/subscription-plan.service.js";
import type { SubscriptionPlanCode } from "../../subscriptions/subscription.constants.js";
import { PaymentOrderModel } from "../../payments/payment-order.model.js";

export const operationsSubscriptionsService = {
  async analytics(period: "30d" | "90d" | "ytd" | "all") {
    const now = new Date();
    let dateFrom: Date | null = null;
    if (period === "30d") dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (period === "90d") dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    if (period === "ytd") dateFrom = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const paidMatch = { status: "paid", ...(dateFrom ? { paidAt: { $gte: dateFrom, $lte: now } } : {}) };
    const [paid, topPlan, activePlans] = await Promise.all([
      PaymentOrderModel.aggregate([
        { $match: paidMatch },
        { $group: { _id: null, revenue: { $sum: "$amount" }, successfulPayments: { $sum: 1 } } },
      ]),
      PaymentOrderModel.aggregate([
        { $match: paidMatch },
        { $group: { _id: "$planCode", payments: { $sum: 1 } } },
        { $sort: { payments: -1, _id: 1 } },
        { $limit: 1 },
      ]),
      SubscriptionGrantModel.countDocuments({ status: "active" }),
    ]);
    return {
      period,
      paidRevenueInr: paid[0]?.revenue ?? 0,
      successfulPayments: paid[0]?.successfulPayments ?? 0,
      activeEmployerPlans: activePlans,
      mostUsedPlanCode: topPlan[0]?._id ?? null,
      mostUsedPlanPayments: topPlan[0]?.payments ?? 0,
    };
  },

  async list() {
    const [plans, grants] = await Promise.all([
      resolveSubscriptionPlans(),
      SubscriptionGrantModel.find().sort({ updatedAt: -1 }).limit(250).lean(),
    ]);
    const employerIds = [...new Set(grants.map((grant) => grant.employerId.toString()))];
    const employers = await EmployerModel.find({ _id: { $in: employerIds } })
      .select("firstName lastName companyName establishmentName emailAddress whatsappNumber")
      .lean();
    const employerById = new Map(employers.map((employer) => [employer._id.toString(), employer]));
    return {
      plans: Object.values(plans),
      grants: grants.map((grant) => {
        const employer = employerById.get(grant.employerId.toString());
        return {
          id: grant._id.toString(),
          employerId: grant.employerId.toString(),
          employerName: employer ? [employer.firstName, employer.lastName].filter(Boolean).join(" ") : "Unknown employer",
          companyName: employer?.companyName || employer?.establishmentName || "",
          email: employer?.emailAddress ?? "",
          phone: employer?.whatsappNumber ?? "",
          planCode: grant.planCode,
          planName: grant.planName || plans[grant.planCode as SubscriptionPlanCode]?.name || grant.planCode,
          source: grant.source,
          status: grant.status,
          jobCredits: grant.jobCredits,
          jobCreditsUsed: grant.jobCreditsUsed,
          listingValidityDays: grant.listingValidityDays,
          maxCities: grant.maxCities,
          priceInr: grant.priceInr,
          activatedAt: grant.activatedAt?.toISOString() ?? null,
        };
      }),
    };
  },

  async updatePlan(code: SubscriptionPlanCode, body: Parameters<typeof saveSubscriptionPlan>[1], operationsUserId: string) {
    if (code !== "enterprise" && (body.jobCredits === null || body.listingValidityDays === null || body.maxCities === null)) {
      throw new AppError("Job credits, validity, and city limit are required for this plan.", HTTP_STATUS.BAD_REQUEST);
    }
    if (body.purchasable && (!body.priceInr || body.priceInr <= 0 || code === "free" || code === "enterprise")) {
      throw new AppError("Only paid plans with a price can be enabled for online purchase.", HTTP_STATUS.BAD_REQUEST);
    }
    return saveSubscriptionPlan(code, body, operationsUserId);
  },

  async updateGrant(grantId: string, body: { jobCredits: number; listingValidityDays: number; maxCities: number }) {
    const grant = await SubscriptionGrantModel.findById(grantId).lean();
    if (!grant) throw new AppError("Subscription grant not found.", HTTP_STATUS.NOT_FOUND);
    if (body.jobCredits < grant.jobCreditsUsed) {
      throw new AppError("Total job posts cannot be lower than the number already used.", HTTP_STATUS.BAD_REQUEST);
    }
    const updated = await SubscriptionGrantModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(grantId), status: "active" },
      { $set: body },
      { new: true, runValidators: true },
    ).lean();
    if (!updated) throw new AppError("Only active subscriptions can be edited.", HTTP_STATUS.CONFLICT);
    return { id: updated._id.toString(), jobCredits: updated.jobCredits, jobCreditsUsed: updated.jobCreditsUsed, listingValidityDays: updated.listingValidityDays, maxCities: updated.maxCities };
  },
};
