import { z } from "zod";
import { SUBSCRIPTION_PLAN_CODES } from "../../subscriptions/subscription.constants.js";

export const subscriptionPlanCodeParamsSchema = z.object({
  code: z.enum(SUBSCRIPTION_PLAN_CODES),
});

export const updateSubscriptionPlanBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  priceInr: z.number().min(0).nullable(),
  jobCredits: z.number().int().min(1).nullable(),
  listingValidityDays: z.number().int().min(1).nullable(),
  maxCities: z.number().int().min(1).nullable(),
  purchasable: z.boolean(),
  contactSales: z.boolean(),
  packageLabel: z.string().trim().max(80),
  description: z.string().trim().max(500),
});

export const operationsSubscriptionGrantParamsSchema = z.object({
  grantId: z.string().regex(/^[a-f\d]{24}$/i),
});

export const operationsSubscriptionsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
});

export const operationsSubscriptionsAnalyticsQuerySchema = z.object({
  period: z.enum(["30d", "90d", "ytd", "all"]).default("30d"),
});

export const updateSubscriptionGrantBodySchema = z.object({
  jobCredits: z.number().int().min(1),
  listingValidityDays: z.number().int().min(1),
  maxCities: z.number().int().min(1),
});

export const createSubscriptionPaymentLinkSchema = z.object({
  employerId: z.string().regex(/^[a-f\d]{24}$/i),
  planCode: z.enum(SUBSCRIPTION_PLAN_CODES),
  discountPercent: z.number().min(0).max(100),
  expiryHours: z.union([z.literal(1), z.literal(6), z.literal(24)]),
  customPlan: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    priceInr: z.number().min(1).max(10_000_000),
    jobCredits: z.number().int().min(1).max(100_000),
    listingValidityDays: z.number().int().min(1).max(3650),
    maxCities: z.number().int().min(1).max(10_000),
  }).optional(),
}).superRefine((value, context) => {
  if (value.planCode === "enterprise" && !value.customPlan) {
    context.addIssue({ code: "custom", path: ["customPlan"], message: "Enter the custom Business Hiring terms." });
  }
  if (value.planCode !== "enterprise" && value.customPlan) {
    context.addIssue({ code: "custom", path: ["customPlan"], message: "Custom terms are only allowed for Business Hiring." });
  }
});
