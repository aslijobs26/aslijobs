import axios, { AxiosError, type AxiosInstance } from "axios";
import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";

/** Cashfree PG order statuses (GET /orders/{order_id}). */
export type CashfreeOrderStatus =
  | "ACTIVE"
  | "PAID"
  | "EXPIRED"
  | "TERMINATED"
  | "TERMINATION_REQUESTED";

export type CashfreeOrder = {
  cf_order_id: string | number;
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: CashfreeOrderStatus;
  payment_session_id?: string;
  order_expiry_time?: string;
  order_tags?: Record<string, string> | null;
};

export type CashfreePayment = {
  cf_payment_id: string | number;
  order_id: string;
  payment_status:
    | "SUCCESS"
    | "NOT_ATTEMPTED"
    | "FAILED"
    | "USER_DROPPED"
    | "VOID"
    | "CANCELLED"
    | "PENDING";
  payment_amount: number;
  payment_currency: string;
  payment_message?: string | null;
  payment_time?: string | null;
  payment_completion_time?: string | null;
  payment_group?: string | null;
  bank_reference?: string | null;
};

export type CreateCashfreeOrderInput = {
  orderId: string;
  amount: number;
  currency: "INR";
  customer: {
    id: string;
    phone: string;
    name?: string;
    email?: string;
  };
  returnUrl: string;
  expiresAt: Date;
  note?: string;
  tags?: Record<string, string>;
};

let client: AxiosInstance | null = null;

export function cashfreeBaseUrl(): string {
  return env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

export function isCashfreeConfigured(): boolean {
  return Boolean(env.CASHFREE_APP_ID.trim() && env.CASHFREE_SECRET_KEY.trim());
}

function getClient(): AxiosInstance {
  if (!isCashfreeConfigured()) {
    throw new AppError(
      "Online payments are not configured yet. Please try again later.",
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
  }
  if (!client) {
    client = axios.create({
      baseURL: cashfreeBaseUrl(),
      timeout: env.CASHFREE_REQUEST_TIMEOUT_MS,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-version": env.CASHFREE_API_VERSION,
        "x-client-id": env.CASHFREE_APP_ID,
        "x-client-secret": env.CASHFREE_SECRET_KEY,
      },
    });
  }
  return client;
}

/** Never log request config — it carries the client secret header. */
function toGatewayError(error: unknown, operation: string): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data as { message?: string; code?: string; type?: string } | undefined;
    console.error("[cashfree] request failed", {
      operation,
      status: status ?? null,
      code: data?.code ?? error.code ?? null,
      type: data?.type ?? null,
      message: data?.message ?? null,
    });
    if (error.code === "ECONNABORTED") {
      return new AppError("Payment gateway timed out. Please try again.", HTTP_STATUS.GATEWAY_TIMEOUT);
    }
  } else {
    console.error("[cashfree] request failed", {
      operation,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  }
  return new AppError(
    "Payment gateway is unavailable. Please try again.",
    HTTP_STATUS.BAD_GATEWAY,
  );
}

/**
 * Cashfree rejects customer_name / customer_email outside 3–100 chars (400),
 * so drop out-of-range values instead of failing the checkout.
 */
export function toCashfreeOptionalText(raw: string | undefined | null): string | undefined {
  const value = String(raw ?? "").trim();
  return value.length >= 3 && value.length <= 100 ? value : undefined;
}

/** Cashfree expects a 10-digit Indian mobile number. */
export function toCashfreePhone(raw: string): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export const cashfreeClient = {
  async createOrder(input: CreateCashfreeOrderInput): Promise<CashfreeOrder> {
    const customerName = toCashfreeOptionalText(input.customer.name);
    const customerEmail = toCashfreeOptionalText(input.customer.email);
    try {
      const response = await getClient().post<CashfreeOrder>("/orders", {
        order_id: input.orderId,
        order_amount: input.amount,
        order_currency: input.currency,
        customer_details: {
          customer_id: input.customer.id,
          customer_phone: toCashfreePhone(input.customer.phone),
          ...(customerName ? { customer_name: customerName } : {}),
          ...(customerEmail ? { customer_email: customerEmail } : {}),
        },
        order_meta: {
          return_url: input.returnUrl,
        },
        order_expiry_time: input.expiresAt.toISOString(),
        ...(input.note ? { order_note: input.note } : {}),
        ...(input.tags ? { order_tags: input.tags } : {}),
      });
      return response.data;
    } catch (error) {
      throw toGatewayError(error, "createOrder");
    }
  },

  async getOrder(orderId: string): Promise<CashfreeOrder> {
    try {
      const response = await getClient().get<CashfreeOrder>(
        `/orders/${encodeURIComponent(orderId)}`,
      );
      return response.data;
    } catch (error) {
      throw toGatewayError(error, "getOrder");
    }
  },

  async getOrderPayments(orderId: string): Promise<CashfreePayment[]> {
    try {
      const response = await getClient().get<CashfreePayment[]>(
        `/orders/${encodeURIComponent(orderId)}/payments`,
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw toGatewayError(error, "getOrderPayments");
    }
  },
};
