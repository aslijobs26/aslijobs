import crypto from "node:crypto";
import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { EmployerModel } from "../employers/employer.model.js";
import {
  SUBSCRIPTION_PLANS,
  computeGst,
  isPurchasablePlanCode,
  type PurchasablePlanCode,
} from "../subscriptions/subscription.constants.js";
import { subscriptionService } from "../subscriptions/subscription.service.js";
import {
  cashfreeClient,
  type CashfreeOrder,
  type CashfreePayment,
} from "./cashfree.client.js";
import {
  hashWebhookPayload,
  verifyCashfreeWebhookSignature,
} from "./cashfree-webhook.signature.js";
import {
  PaymentOrderModel,
  type PaymentOrderLean,
  type PaymentOrderStatus,
} from "./payment-order.model.js";
import { PaymentWebhookEventModel } from "./payment-webhook-event.model.js";
import { buildPaymentInvoicePdf } from "./payment-invoice-pdf.js";

const MS_PER_MINUTE = 60_000;
/** Reuse an open checkout session instead of creating duplicate orders. */
const REUSE_SESSION_MIN_REMAINING_MS = 5 * MS_PER_MINUTE;
const RECONCILE_STALE_AFTER_MS = 15 * MS_PER_MINUTE;
const RECONCILE_RECHECK_EVERY_MS = 10 * MS_PER_MINUTE;
const RECONCILE_BATCH_LIMIT = 50;

export const CASHFREE_WEBHOOK_PATH = "/payments/webhooks/cashfree";

export type OrderTransition =
  | { kind: "paid"; payment: CashfreePayment | null }
  | { kind: "expired" }
  | { kind: "failed" | "user_dropped"; reason: string; payment: CashfreePayment }
  | { kind: "amount_mismatch" }
  | { kind: "none" };

function amountsMatch(expected: number, actual: unknown): boolean {
  const value = Number(actual);
  return Number.isFinite(value) && Math.round(value * 100) === Math.round(expected * 100);
}

function latestPayment(payments: CashfreePayment[]): CashfreePayment | null {
  if (payments.length === 0) {
    return null;
  }
  return [...payments].sort((a, b) => {
    const at = Date.parse(a.payment_time ?? "") || 0;
    const bt = Date.parse(b.payment_time ?? "") || 0;
    return bt - at;
  })[0]!;
}

/**
 * Pure decision: what should happen to our stored order given Cashfree's view.
 * A grant is only ever issued for `paid`, which requires order_status PAID and
 * an exact amount + currency match.
 */
export function resolveOrderTransition(input: {
  stored: { status: PaymentOrderStatus; amount: number; currency: string };
  cfOrder: Pick<CashfreeOrder, "order_status" | "order_amount" | "order_currency">;
  payments: CashfreePayment[];
}): OrderTransition {
  const { stored, cfOrder, payments } = input;

  if (cfOrder.order_status === "PAID") {
    if (
      !amountsMatch(stored.amount, cfOrder.order_amount) ||
      String(cfOrder.order_currency).toUpperCase() !== stored.currency.toUpperCase()
    ) {
      return { kind: "amount_mismatch" };
    }
    const success =
      payments.find((payment) => payment.payment_status === "SUCCESS") ?? null;
    return { kind: "paid", payment: success };
  }

  if (stored.status === "paid") {
    return { kind: "none" };
  }

  if (cfOrder.order_status === "EXPIRED" || cfOrder.order_status === "TERMINATED") {
    return stored.status === "expired" ? { kind: "none" } : { kind: "expired" };
  }

  const latest = latestPayment(payments);
  if (latest?.payment_status === "FAILED" && stored.status !== "failed") {
    return { kind: "failed", reason: latest.payment_message ?? "", payment: latest };
  }
  if (latest?.payment_status === "USER_DROPPED" && stored.status !== "user_dropped") {
    return { kind: "user_dropped", reason: latest.payment_message ?? "", payment: latest };
  }
  return { kind: "none" };
}

export function generateMerchantOrderId(now: Date = new Date()): string {
  // Cashfree: 3–45 chars, alphanumeric, "_" and "-".
  return `AJ_${now.getTime().toString(36).toUpperCase()}_${crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;
}

export function resolveCashfreeNotifyUrl(): string | null {
  const base = env.CASHFREE_WEBHOOK_BASE_URL
    ? `${env.CASHFREE_WEBHOOK_BASE_URL}/api/v1`
    : env.PUBLIC_API_URL;
  const url = `${base}${CASHFREE_WEBHOOK_PATH}`;
  // Cashfree only delivers to HTTPS endpoints.
  return url.startsWith("https://") ? url : null;
}

export function resolveCashfreeReturnUrl(): string {
  return (
    env.CASHFREE_RETURN_URL ||
    `${env.FRONTEND_URL}/employer/payments/status?order_id={order_id}`
  );
}

/** Legacy (pre-GST) orders have no baseAmount: the whole amount was the base. */
export function orderTaxBreakdown(order: {
  amount: number;
  baseAmount?: number | null;
  gstRatePercent?: number | null;
  gstAmount?: number | null;
}) {
  const hasGst = typeof order.baseAmount === "number";
  return {
    baseAmount: hasGst ? (order.baseAmount as number) : order.amount,
    gstRatePercent: hasGst ? (order.gstRatePercent ?? 0) : 0,
    gstAmount: hasGst ? (order.gstAmount ?? 0) : 0,
  };
}

function toPublicOrder(order: PaymentOrderLean) {
  const plan = SUBSCRIPTION_PLANS[order.planCode as PurchasablePlanCode];
  return {
    orderId: order.orderId,
    planCode: order.planCode,
    planName: plan?.name ?? order.planCode,
    amount: order.amount,
    ...orderTaxBreakdown(order),
    currency: order.currency,
    status: order.status,
    paidAt: order.paidAt?.toISOString() ?? null,
    failureReason: order.failureReason || null,
    expiresAt: order.expiresAt?.toISOString() ?? null,
    createdAt: (order as { createdAt?: Date }).createdAt?.toISOString() ?? null,
    grantId: order.grantId ? order.grantId.toString() : null,
  };
}

async function findOrderForEmployer(
  employerId: string,
  orderId: string,
): Promise<PaymentOrderLean> {
  const order = (await PaymentOrderModel.findOne({
    orderId,
    employerId: new mongoose.Types.ObjectId(employerId),
  }).lean()) as PaymentOrderLean | null;
  if (!order) {
    throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
  }
  return order;
}

export const paymentService = {
  async createOrder(input: {
    employerId: string;
    teamMemberId?: string | null;
    planCode: string;
  }) {
    if (!env.PAYMENTS_ENABLED) {
      throw new AppError(
        "Online payments are temporarily unavailable.",
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      );
    }
    if (!isPurchasablePlanCode(input.planCode)) {
      throw new AppError("This plan cannot be purchased online.", HTTP_STATUS.BAD_REQUEST);
    }
    const plan = SUBSCRIPTION_PLANS[input.planCode];
    if (!plan.priceInr || plan.priceInr <= 0) {
      throw new AppError("This plan cannot be purchased online.", HTTP_STATUS.BAD_REQUEST);
    }
    const tax = computeGst(plan.priceInr);
    const amount = tax.totalAmount;
    const taxFields = {
      baseAmount: tax.baseAmount,
      gstRatePercent: tax.gstRatePercent,
      gstAmount: tax.gstAmount,
    };

    const employer = await EmployerModel.findById(input.employerId)
      .select("firstName lastName companyName emailAddress whatsappNumber")
      .lean();
    if (!employer) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }
    if (!employer.whatsappNumber) {
      throw new AppError(
        "Add a mobile number to your account before paying.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const now = new Date();
    const employerObjectId = employer._id;

    // Reuse a still-open checkout for the same plan (double clicks, retries).
    // Matching the amount skips sessions opened at an older price / tax rate.
    const reusable = await PaymentOrderModel.findOne({
      employerId: employerObjectId,
      planCode: plan.code,
      amount,
      status: { $in: ["created", "failed", "user_dropped"] },
      expiresAt: { $gt: new Date(now.getTime() + REUSE_SESSION_MIN_REMAINING_MS) },
      paymentSessionId: { $ne: "" },
    })
      .sort({ createdAt: -1 })
      .select("+paymentSessionId")
      .lean();
    if (reusable?.paymentSessionId) {
      return {
        orderId: reusable.orderId,
        paymentSessionId: reusable.paymentSessionId,
        environment: reusable.environment,
        planCode: reusable.planCode,
        amount: reusable.amount,
        ...taxFields,
        currency: reusable.currency,
        expiresAt: reusable.expiresAt.toISOString(),
      };
    }

    const orderId = generateMerchantOrderId(now);
    const expiresAt = new Date(now.getTime() + env.PAYMENT_ORDER_EXPIRY_MINUTES * MS_PER_MINUTE);
    const order = await PaymentOrderModel.create({
      provider: "cashfree",
      orderId,
      employerId: employerObjectId,
      initiatedByTeamMemberId:
        input.teamMemberId && mongoose.Types.ObjectId.isValid(input.teamMemberId)
          ? new mongoose.Types.ObjectId(input.teamMemberId)
          : null,
      planCode: plan.code,
      amount,
      ...taxFields,
      currency: "INR",
      status: "created",
      expiresAt,
      environment: env.CASHFREE_ENV,
    });

    const notifyUrl = resolveCashfreeNotifyUrl();
    if (!notifyUrl) {
      console.warn(
        "[payments] notify_url omitted: set CASHFREE_WEBHOOK_BASE_URL to an https origin (e.g. your ngrok domain). Dashboard webhooks still apply.",
      );
    }

    let cfOrder: CashfreeOrder;
    try {
      cfOrder = await cashfreeClient.createOrder({
        orderId,
        amount,
        currency: "INR",
        customer: {
          id: employerObjectId.toString(),
          phone: employer.whatsappNumber,
          name: [employer.firstName, employer.lastName].filter(Boolean).join(" ").trim(),
          email: employer.emailAddress || undefined,
        },
        returnUrl: resolveCashfreeReturnUrl(),
        notifyUrl,
        expiresAt,
        note: `AsliJobs ${plan.name} plan (incl. ${tax.gstRatePercent}% GST)`,
        tags: { planCode: plan.code, employerId: employerObjectId.toString() },
      });
    } catch (error) {
      await PaymentOrderModel.updateOne(
        { _id: order._id },
        { $set: { status: "cancelled", failureReason: "gateway_create_failed" } },
      );
      throw error;
    }

    if (!cfOrder.payment_session_id) {
      await PaymentOrderModel.updateOne(
        { _id: order._id },
        { $set: { status: "cancelled", failureReason: "missing_payment_session" } },
      );
      throw new AppError("Payment gateway is unavailable. Please try again.", HTTP_STATUS.BAD_GATEWAY);
    }

    await PaymentOrderModel.updateOne(
      { _id: order._id },
      {
        $set: {
          cfOrderId: String(cfOrder.cf_order_id ?? ""),
          paymentSessionId: cfOrder.payment_session_id,
        },
      },
    );

    return {
      orderId,
      paymentSessionId: cfOrder.payment_session_id,
      environment: env.CASHFREE_ENV,
      planCode: plan.code,
      amount,
      ...taxFields,
      currency: "INR",
      expiresAt: expiresAt.toISOString(),
    };
  },

  async listMyOrders(employerId: string) {
    const orders = (await PaymentOrderModel.find({
      employerId: new mongoose.Types.ObjectId(employerId),
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()) as PaymentOrderLean[];
    return orders.map(toPublicOrder);
  },

  async getMyOrder(employerId: string, orderId: string) {
    return toPublicOrder(await findOrderForEmployer(employerId, orderId));
  },

  /** PDF invoice for a paid order. Only the owning employer can fetch it. */
  async getMyOrderInvoice(employerId: string, orderId: string) {
    const order = await findOrderForEmployer(employerId, orderId);
    if (order.status !== "paid" || !order.paidAt) {
      throw new AppError(
        "An invoice is available only for successful payments.",
        HTTP_STATUS.CONFLICT,
      );
    }

    const employer = await EmployerModel.findById(employerId)
      .select(
        "firstName lastName companyName establishmentName emailAddress whatsappNumber companyAddress city state pincode gstNumber",
      )
      .lean();
    if (!employer) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const plan = SUBSCRIPTION_PLANS[order.planCode as PurchasablePlanCode];
    const personName = [employer.firstName, employer.lastName].filter(Boolean).join(" ").trim();
    const companyName =
      employer.companyName?.trim() || employer.establishmentName?.trim() || personName;
    const cityLine = [employer.city, employer.state].filter(Boolean).join(", ");
    const address = [
      employer.companyAddress,
      [cityLine, employer.pincode].filter(Boolean).join(" - "),
    ]
      .filter((part) => part && part.trim())
      .join(", ");
    const invoiceNumber = `INV-${order.orderId.replace(/^AJ_/, "")}`;

    const tax = orderTaxBreakdown(order);
    const planHighlights: string[] = [];
    if (plan?.jobCredits) {
      planHighlights.push(`${plan.jobCredits} job post${plan.jobCredits === 1 ? "" : "s"}`);
    }
    if (plan?.listingValidityDays) planHighlights.push(`Live ${plan.listingValidityDays} days`);
    if (plan?.maxCities) {
      planHighlights.push(
        plan.maxCities === 1 ? "1 city" : `Up to ${plan.maxCities} cities`,
      );
    }

    const buffer = await buildPaymentInvoicePdf({
      invoiceNumber,
      orderId: order.orderId,
      paymentId: order.cfPaymentId,
      paymentMethod: order.paymentGroup,
      bankReference: order.bankReference,
      paidAt: order.paidAt,
      planName: plan?.name ?? order.planCode,
      planDescription: plan?.description ?? "",
      planHighlights,
      sacCode: env.INVOICE_SAC_CODE,
      baseAmount: tax.baseAmount,
      gstRatePercent: tax.gstRatePercent,
      gstAmount: tax.gstAmount,
      amount: order.amount,
      currency: order.currency,
      seller: {
        name: env.INVOICE_SELLER_NAME || "AsliJobs",
        address: env.INVOICE_SELLER_ADDRESS,
        email: env.INVOICE_SELLER_EMAIL,
        phone: env.INVOICE_SELLER_PHONE,
        gstin: env.INVOICE_SELLER_GSTIN,
        pan: env.INVOICE_SELLER_PAN,
        state: env.INVOICE_SELLER_STATE,
      },
      billedTo: {
        name: companyName,
        subtitle: personName && personName !== companyName ? `Attn: ${personName}` : "",
        address,
        email: employer.emailAddress ?? "",
        phone: employer.whatsappNumber ?? "",
        gstin: employer.gstNumber ?? "",
        state: employer.state ?? "",
      },
    });

    return {
      buffer,
      fileName: `AsliJobs-${invoiceNumber}.pdf`,
      mimeType: "application/pdf",
    };
  },

  async verifyMyOrder(employerId: string, orderId: string) {
    await findOrderForEmployer(employerId, orderId);
    return this.reconcileOrder(orderId);
  },

  /**
   * Single source of truth for order state. Always asks Cashfree directly;
   * webhooks, the return-page verify call, and the sweep all land here.
   */
  async reconcileOrder(orderId: string) {
    const order = (await PaymentOrderModel.findOne({ orderId }).lean()) as PaymentOrderLean | null;
    if (!order) {
      throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
    }

    if (order.status === "paid" && order.grantId) {
      return toPublicOrder(order);
    }

    const cfOrder = await cashfreeClient.getOrder(orderId);
    let payments: CashfreePayment[] = [];
    try {
      payments = await cashfreeClient.getOrderPayments(orderId);
    } catch {
      // Payment details are informational; order_status decides.
    }

    const transition = resolveOrderTransition({
      stored: { status: order.status, amount: order.amount, currency: order.currency },
      cfOrder,
      payments,
    });
    const now = new Date();

    switch (transition.kind) {
      case "paid": {
        await PaymentOrderModel.updateOne(
          { _id: order._id, status: { $ne: "paid" } },
          {
            $set: {
              status: "paid",
              paidAt: transition.payment?.payment_completion_time
                ? new Date(transition.payment.payment_completion_time)
                : now,
              cfPaymentId: String(transition.payment?.cf_payment_id ?? ""),
              paymentGroup: transition.payment?.payment_group ?? "",
              bankReference: transition.payment?.bank_reference ?? "",
              failureReason: "",
            },
          },
        );
        const grant = await subscriptionService.grantForPaidOrder({
          employerId: order.employerId,
          paymentOrderId: order._id,
          planCode: order.planCode as PurchasablePlanCode,
          // Grant records the plan price; tax lives on the order/invoice.
          priceInr: orderTaxBreakdown(order).baseAmount,
        });
        await PaymentOrderModel.updateOne(
          { _id: order._id },
          { $set: { grantId: grant._id, lastVerifiedAt: now } },
        );
        console.info("[payments] order paid; grant issued", {
          orderId,
          planCode: order.planCode,
          grantId: grant._id.toString(),
        });
        break;
      }
      case "amount_mismatch":
        console.error("[payments] PAID order amount/currency mismatch; grant withheld", {
          orderId,
          expected: order.amount,
          received: cfOrder.order_amount,
          currency: cfOrder.order_currency,
        });
        await PaymentOrderModel.updateOne(
          { _id: order._id },
          { $set: { failureReason: "amount_mismatch", lastVerifiedAt: now } },
        );
        break;
      case "expired":
        await PaymentOrderModel.updateOne(
          { _id: order._id, status: { $ne: "paid" } },
          { $set: { status: "expired", lastVerifiedAt: now } },
        );
        break;
      case "failed":
      case "user_dropped":
        await PaymentOrderModel.updateOne(
          { _id: order._id, status: { $ne: "paid" } },
          {
            $set: {
              status: transition.kind,
              failedAt: now,
              failureReason: transition.reason,
              cfPaymentId: String(transition.payment.cf_payment_id ?? ""),
              lastVerifiedAt: now,
            },
          },
        );
        break;
      default:
        await PaymentOrderModel.updateOne({ _id: order._id }, { $set: { lastVerifiedAt: now } });
    }

    const updated = (await PaymentOrderModel.findById(order._id).lean()) as PaymentOrderLean;
    return toPublicOrder(updated);
  },

  /**
   * Verifies and processes a Cashfree webhook. Throws 401 on a bad signature.
   * Any other thrown error → 500, so Cashfree retries delivery.
   */
  async handleCashfreeWebhook(input: {
    rawBody: Buffer | undefined;
    signature: string | undefined;
    timestamp: string | undefined;
    body: unknown;
  }): Promise<{ processed: boolean; duplicate?: boolean; ignored?: string }> {
    const valid = verifyCashfreeWebhookSignature({
      signature: input.signature,
      timestamp: input.timestamp,
      rawBody: input.rawBody,
      secretKey: env.CASHFREE_SECRET_KEY,
    });
    if (!valid || !input.rawBody) {
      console.warn("[payments] rejected Cashfree webhook: invalid signature");
      throw new AppError("Invalid signature", HTTP_STATUS.UNAUTHORIZED);
    }

    const body = (input.body ?? {}) as {
      type?: string;
      data?: {
        order?: { order_id?: string };
        payment?: { cf_payment_id?: string | number; payment_message?: string };
      };
    };
    const eventType = String(body.type ?? "");
    const orderId = String(body.data?.order?.order_id ?? "");
    const cfPaymentId = String(body.data?.payment?.cf_payment_id ?? "");
    const payloadHash = hashWebhookPayload(input.rawBody);

    const event = await PaymentWebhookEventModel.findOneAndUpdate(
      { payloadHash },
      {
        $setOnInsert: {
          provider: "cashfree",
          eventType,
          orderId,
          cfPaymentId,
          payloadHash,
          payload: input.body ?? null,
        },
        $inc: { attempts: 1 },
      },
      { upsert: true, new: true },
    );
    if (event.processedAt) {
      return { processed: true, duplicate: true };
    }

    try {
      const order = orderId
        ? await PaymentOrderModel.findOne({ orderId }).select("_id status").lean()
        : null;

      let ignored: string | undefined;
      if (!order) {
        // Dashboard "test webhook" deliveries and other merchants' orders land here.
        ignored = "unknown_order";
      } else if (eventType === "PAYMENT_SUCCESS_WEBHOOK") {
        await this.reconcileOrder(orderId);
      } else if (
        eventType === "PAYMENT_FAILED_WEBHOOK" ||
        eventType === "PAYMENT_USER_DROPPED_WEBHOOK"
      ) {
        const now = new Date();
        await PaymentOrderModel.updateOne(
          { orderId, status: { $in: ["created", "failed", "user_dropped"] } },
          {
            $set: {
              status: eventType === "PAYMENT_FAILED_WEBHOOK" ? "failed" : "user_dropped",
              failedAt: now,
              failureReason: String(body.data?.payment?.payment_message ?? ""),
              cfPaymentId,
            },
          },
        );
      } else {
        ignored = "unhandled_event_type";
      }

      await PaymentWebhookEventModel.updateOne(
        { _id: event._id },
        { $set: { processedAt: new Date(), processingError: ignored ?? "" } },
      );
      return { processed: true, ...(ignored ? { ignored } : {}) };
    } catch (error) {
      await PaymentWebhookEventModel.updateOne(
        { _id: event._id },
        {
          $set: {
            processingError: error instanceof Error ? error.message.slice(0, 500) : "unknown",
          },
        },
      );
      throw error;
    }
  },

  /** Catches missed webhooks and half-finished grants. Run by the sweep. */
  async reconcileStaleOrders(now: Date = new Date()): Promise<number> {
    const candidates = await PaymentOrderModel.find({
      $or: [
        {
          status: { $in: ["created", "failed", "user_dropped"] },
          createdAt: { $lt: new Date(now.getTime() - RECONCILE_STALE_AFTER_MS) },
          $and: [
            {
              $or: [
                { lastVerifiedAt: null },
                { lastVerifiedAt: { $lt: new Date(now.getTime() - RECONCILE_RECHECK_EVERY_MS) } },
              ],
            },
          ],
        },
        { status: "paid", grantId: null },
      ],
    })
      .select("orderId")
      .limit(RECONCILE_BATCH_LIMIT)
      .lean();

    let reconciled = 0;
    for (const candidate of candidates) {
      try {
        await this.reconcileOrder(candidate.orderId);
        reconciled += 1;
      } catch (error) {
        console.error("[payments] stale order reconcile failed", {
          orderId: candidate.orderId,
          errorCategory: error instanceof Error ? error.name : "unknown",
        });
      }
    }
    return reconciled;
  },
};
