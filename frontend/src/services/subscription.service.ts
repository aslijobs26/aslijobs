import { apiClient } from "@/services/api-client";
import type {
  CreatedPaymentOrder,
  EnterpriseEnquiryInput,
  MySubscription,
  PaymentOrder,
  PurchasablePlanCode,
  SubscriptionPlan,
} from "@/types/subscription";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export const subscriptionQueryKeys = {
  all: ["employer", "subscription"] as const,
  plans: ["subscription", "plans"] as const,
  mine: ["employer", "subscription", "me"] as const,
  orders: ["employer", "subscription", "orders"] as const,
  order: (orderId: string) =>
    ["employer", "subscription", "orders", orderId] as const,
};

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await apiClient.get<ApiSuccess<SubscriptionPlan[]>>(
    "/subscriptions/plans",
  );
  return response.data.data;
}

export async function fetchMySubscription(): Promise<MySubscription> {
  const response = await apiClient.get<ApiSuccess<MySubscription>>(
    "/subscriptions/me",
  );
  return response.data.data;
}

export async function fetchMyPaymentOrders(): Promise<PaymentOrder[]> {
  const response = await apiClient.get<ApiSuccess<PaymentOrder[]>>(
    "/payments/orders",
  );
  return response.data.data;
}

export async function createPaymentOrder(
  planCode: PurchasablePlanCode,
): Promise<CreatedPaymentOrder> {
  const response = await apiClient.post<ApiSuccess<CreatedPaymentOrder>>(
    "/payments/orders",
    { planCode },
  );
  return response.data.data;
}

/** Server re-checks the order with Cashfree; never trusts the redirect. */
export async function verifyPaymentOrder(orderId: string): Promise<PaymentOrder> {
  const response = await apiClient.post<ApiSuccess<PaymentOrder>>(
    `/payments/orders/${encodeURIComponent(orderId)}/verify`,
  );
  return response.data.data;
}

/** PDF invoice for a paid order. */
export async function downloadPaymentInvoice(
  orderId: string,
): Promise<{ blob: Blob; fileName: string }> {
  try {
    const response = await apiClient.get<Blob>(
      `/payments/orders/${encodeURIComponent(orderId)}/invoice`,
      { responseType: "blob" },
    );
    const disposition = response.headers["content-disposition"];
    let fileName = `AsliJobs-Invoice-${orderId}.pdf`;
    if (typeof disposition === "string") {
      const matched = /filename="?([^"]+)"?/i.exec(disposition);
      if (matched?.[1]) fileName = matched[1];
    }
    return { blob: response.data, fileName };
  } catch (error) {
    // Blob responses hide the JSON error body; surface its message.
    const data = (error as { response?: { data?: unknown } })?.response?.data;
    if (data instanceof Blob) {
      let message = "";
      try {
        const parsed = JSON.parse(await data.text()) as { message?: unknown };
        if (typeof parsed.message === "string") message = parsed.message.trim();
      } catch {
        // Not JSON; fall through to the original error.
      }
      if (message) throw new Error(message);
    }
    throw error;
  }
}

export async function submitEnterpriseEnquiry(
  input: EnterpriseEnquiryInput,
): Promise<{ message: string }> {
  const response = await apiClient.post<ApiSuccess<{ id: string }>>(
    "/subscriptions/enterprise-enquiry",
    input,
  );
  return { message: response.data.message ?? "" };
}
