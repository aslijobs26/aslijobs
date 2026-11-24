import { apiClient } from "./api-client";

export type OperationsSubscriptionPlan = {
  code: "free" | "starter_299" | "growth_999" | "enterprise";
  name: string;
  priceInr: number | null;
  jobCredits: number | null;
  listingValidityDays: number | null;
  maxCities: number | null;
  purchasable: boolean;
  contactSales: boolean;
  packageLabel: string;
  description: string;
};

export type OperationsSubscriptionGrant = {
  id: string;
  employerId: string;
  employerName: string;
  companyName: string;
  email: string;
  phone: string;
  planCode: OperationsSubscriptionPlan["code"];
  planName: string;
  source: string;
  status: string;
  jobCredits: number;
  jobCreditsUsed: number;
  listingValidityDays: number;
  maxCities: number;
  priceInr: number;
  activatedAt: string | null;
};

export type OperationsSubscriptionsData = {
  plans: OperationsSubscriptionPlan[];
  grants: OperationsSubscriptionGrant[];
};

export type OperationsSubscriptionsPeriod = "30d" | "90d" | "ytd" | "all";
export type OperationsSubscriptionsAnalytics = {
  period: OperationsSubscriptionsPeriod;
  paidRevenueInr: number;
  successfulPayments: number;
  activeEmployerPlans: number;
  mostUsedPlanCode: OperationsSubscriptionPlan["code"] | null;
  mostUsedPlanPayments: number;
};

export async function fetchOperationsSubscriptions(): Promise<OperationsSubscriptionsData> {
  const response = await apiClient.get<{ data: OperationsSubscriptionsData }>("/operations/subscriptions");
  return response.data.data;
}

export async function fetchOperationsSubscriptionsAnalytics(
  period: OperationsSubscriptionsPeriod,
): Promise<OperationsSubscriptionsAnalytics> {
  const response = await apiClient.get<{ data: OperationsSubscriptionsAnalytics }>(
    "/operations/subscriptions/analytics",
    { params: { period } },
  );
  return response.data.data;
}

export async function updateOperationsSubscriptionPlan(
  plan: OperationsSubscriptionPlan,
): Promise<void> {
  await apiClient.patch(`/operations/subscriptions/plans/${plan.code}`, {
    name: plan.name,
    priceInr: plan.priceInr,
    jobCredits: plan.jobCredits,
    listingValidityDays: plan.listingValidityDays,
    maxCities: plan.maxCities,
    purchasable: plan.purchasable,
    contactSales: plan.contactSales,
    packageLabel: plan.packageLabel,
    description: plan.description,
  });
}

export async function updateOperationsSubscriptionGrant(input: {
  id: string;
  jobCredits: number;
  listingValidityDays: number;
  maxCities: number;
}): Promise<void> {
  await apiClient.patch(`/operations/subscriptions/grants/${input.id}`, {
    jobCredits: input.jobCredits,
    listingValidityDays: input.listingValidityDays,
    maxCities: input.maxCities,
  });
}

export type CreatedOperationsPaymentLink = {
  url: string;
  orderId: string;
  employerEmail: string;
  employerPhone: string;
  planName: string;
  planPrice: number;
  discountPercent: number;
  discountAmount: number;
  baseAmount: number;
  gstRatePercent: number;
  gstAmount: number;
  amount: number;
  expiresAt: string;
  jobCredits: number;
  listingValidityDays: number;
  maxCities: number;
};

export async function createOperationsPaymentLink(input: {
  employerId: string;
  planCode: OperationsSubscriptionPlan["code"];
  discountPercent: number;
  expiryHours: 1 | 6 | 24;
  customPlan?: { name: string; priceInr: number; jobCredits: number; listingValidityDays: number; maxCities: number };
}): Promise<CreatedOperationsPaymentLink> {
  const response = await apiClient.post<{ data: CreatedOperationsPaymentLink }>(
    "/operations/subscriptions/payment-links",
    input,
  );
  return response.data.data;
}
