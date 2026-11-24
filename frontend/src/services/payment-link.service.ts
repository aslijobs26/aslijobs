import { apiClient } from "@/services/api-client";

export type PublicPaymentLink = {
  orderId: string;
  planName: string;
  amount: number;
  baseAmount: number;
  gstAmount: number;
  discountPercent: number;
  discountAmount: number;
  currency: string;
  paymentSessionId: string;
  environment: "sandbox" | "production";
  expiresAt: string;
  status: "created" | "paid" | "failed" | "user_dropped" | "expired" | "cancelled";
  jobCredits: number | null;
  listingValidityDays: number | null;
  maxCities: number | null;
};

export type PublicPaymentLinkStatus = {
  orderId: string;
  planName: string;
  amount: number;
  status: "created" | "paid" | "failed" | "user_dropped" | "expired" | "cancelled";
};

export async function fetchPublicPaymentLink(token: string): Promise<PublicPaymentLink> {
  const response = await apiClient.get<{ data: PublicPaymentLink }>(`/payments/links/${encodeURIComponent(token)}`);
  return response.data.data;
}

export async function verifyPublicPaymentLink(token: string): Promise<PublicPaymentLinkStatus> {
  const response = await apiClient.post<{ data: PublicPaymentLinkStatus }>(`/payments/links/${encodeURIComponent(token)}/verify`);
  return response.data.data;
}
