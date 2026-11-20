/** Mirrors backend `subscriptions` + `payments` public shapes. */

export type SubscriptionPlanCode =
  | "free"
  | "starter_299"
  | "growth_999"
  | "enterprise";

export type PurchasablePlanCode = "starter_299" | "growth_999";

export type SubscriptionPlan = {
  code: SubscriptionPlanCode;
  name: string;
  /** Rupees, before GST. null → contact sales. */
  priceInr: number | null;
  /** GST charged on top of priceInr. null for free / contact-sales plans. */
  gstRatePercent: number | null;
  gstAmountInr: number | null;
  /** priceInr + GST: what checkout charges. */
  totalPriceInr: number | null;
  currency: "INR";
  jobCredits: number | null;
  listingValidityDays: number | null;
  maxCities: number | null;
  purchasable: boolean;
  contactSales: boolean;
  description: string;
};

export type SubscriptionGrantSource = "auto_free" | "payment" | "operations_grant";
export type SubscriptionGrantStatus = "active" | "exhausted" | "cancelled";

export type SubscriptionGrant = {
  id: string;
  planCode: SubscriptionPlanCode;
  planName: string;
  source: SubscriptionGrantSource;
  status: SubscriptionGrantStatus;
  jobCredits: number;
  jobCreditsUsed: number;
  jobCreditsRemaining: number;
  listingValidityDays: number;
  maxCities: number;
  citiesUsed: string[];
  priceInr: number;
  activatedAt: string | null;
};

export type MySubscription = {
  jobCreditsRemaining: number;
  canPostJob: boolean;
  activeGrants: SubscriptionGrant[];
  history: SubscriptionGrant[];
  purchasablePlans: PurchasablePlanCode[];
};

export type PaymentOrderStatus =
  | "created"
  | "paid"
  | "failed"
  | "user_dropped"
  | "expired"
  | "cancelled";

export type PaymentOrder = {
  orderId: string;
  planCode: PurchasablePlanCode;
  planName: string;
  /** Total charged (base + GST). */
  amount: number;
  /** Plan price before tax (equals amount on pre-GST orders). */
  baseAmount: number;
  gstRatePercent: number;
  gstAmount: number;
  currency: string;
  status: PaymentOrderStatus;
  paidAt: string | null;
  failureReason: string | null;
  expiresAt: string | null;
  createdAt: string | null;
  grantId: string | null;
};

export type CreatedPaymentOrder = {
  orderId: string;
  paymentSessionId: string;
  environment: "sandbox" | "production";
  planCode: PurchasablePlanCode;
  amount: number;
  baseAmount: number;
  gstRatePercent: number;
  gstAmount: number;
  currency: string;
  expiresAt: string;
};

export type EnterpriseEnquiryInput = {
  contactName: string;
  phone: string;
  email?: string;
  companyName?: string;
  expectedMonthlyHires?: number;
  message?: string;
};
