/**
 * Employer job-posting plan catalog.
 *
 * Server-authoritative: prices and limits are never read from the client.
 * Each grant snapshots these values at grant time, so editing the catalog
 * never changes what an employer already bought.
 */

export const SUBSCRIPTION_PLAN_CODES = [
  "free",
  "starter_299",
  "growth_999",
  "enterprise",
] as const;

export const PURCHASABLE_PLAN_CODES = ["starter_299", "growth_999"] as const;

export const SUBSCRIPTION_GRANT_SOURCES = [
  "auto_free",
  "payment",
  "operations_grant",
] as const;

export const SUBSCRIPTION_GRANT_STATUSES = [
  "active",
  "exhausted",
  "cancelled",
] as const;

export type SubscriptionPlanCode = (typeof SUBSCRIPTION_PLAN_CODES)[number];
export type PurchasablePlanCode = (typeof PURCHASABLE_PLAN_CODES)[number];
export type SubscriptionGrantSource = (typeof SUBSCRIPTION_GRANT_SOURCES)[number];
export type SubscriptionGrantStatus = (typeof SUBSCRIPTION_GRANT_STATUSES)[number];

export type SubscriptionPlan = {
  code: SubscriptionPlanCode;
  name: string;
  /** Rupees. null → contact sales. */
  priceInr: number | null;
  /** Job posts included. null → custom (enterprise). */
  jobCredits: number | null;
  /** Days each job stays live after Operations approval. */
  listingValidityDays: number | null;
  /** Max distinct job cities across this grant's jobs. */
  maxCities: number | null;
  purchasable: boolean;
  contactSales: boolean;
  /** Stored on Job.listingPackageLabel. */
  packageLabel: string;
  description: string;
};

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanCode, SubscriptionPlan> = {
  free: {
    code: "free",
    name: "Free",
    priceInr: 0,
    jobCredits: 1,
    listingValidityDays: 7,
    maxCities: 1,
    purchasable: false,
    contactSales: false,
    packageLabel: "Free",
    description: "Your first job post, live for 7 days in 1 city.",
  },
  starter_299: {
    code: "starter_299",
    name: "Starter",
    priceInr: 299,
    jobCredits: 1,
    listingValidityDays: 7,
    maxCities: 1,
    purchasable: true,
    contactSales: false,
    packageLabel: "₹299",
    description: "One more job post, live for 7 days in 1 city.",
  },
  growth_999: {
    code: "growth_999",
    name: "Growth",
    priceInr: 999,
    jobCredits: 5,
    listingValidityDays: 15,
    maxCities: 2,
    purchasable: true,
    contactSales: false,
    packageLabel: "₹999",
    description: "5 job posts, each live for 15 days, across up to 2 cities.",
  },
  enterprise: {
    code: "enterprise",
    name: "Enterprise",
    priceInr: null,
    jobCredits: null,
    listingValidityDays: null,
    maxCities: null,
    purchasable: false,
    contactSales: true,
    packageLabel: "Enterprise",
    description: "High-volume hiring. Contact our sales team for a custom plan.",
  },
};

/** Free is always consumed before paid grants. */
export const GRANT_CONSUME_PRIORITY: Record<SubscriptionGrantSource, number> = {
  auto_free: 0,
  payment: 1,
  operations_grant: 1,
};

export const COMPLIMENTARY_PACKAGE_LABEL = "Complimentary";

export const NO_JOB_CREDITS_CODE = "NO_JOB_CREDITS";
export const PLAN_CITY_LIMIT_CODE = "PLAN_CITY_LIMIT_REACHED";

export function isPurchasablePlanCode(value: string): value is PurchasablePlanCode {
  return (PURCHASABLE_PLAN_CODES as readonly string[]).includes(value);
}

/** GST charged on top of every paid plan price (India, SAC 9983xx services). */
export const GST_RATE_PERCENT = 18;

export type GstBreakdown = {
  /** Plan price before tax, rupees. */
  baseAmount: number;
  gstRatePercent: number;
  gstAmount: number;
  /** What the employer pays, rupees (2-decimal precision). */
  totalAmount: number;
};

/** Paise-exact GST so the total always equals base + tax to the paisa. */
export function computeGst(
  baseAmount: number,
  ratePercent: number = GST_RATE_PERCENT,
): GstBreakdown {
  const basePaise = Math.round(baseAmount * 100);
  const gstPaise = Math.round((basePaise * ratePercent) / 100);
  return {
    baseAmount: basePaise / 100,
    gstRatePercent: ratePercent,
    gstAmount: gstPaise / 100,
    totalAmount: (basePaise + gstPaise) / 100,
  };
}
