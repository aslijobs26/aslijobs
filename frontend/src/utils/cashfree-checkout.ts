import type { CreatedPaymentOrder } from "@/types/subscription";

export type CashfreeCheckoutOutcome =
  /** Popup finished (paid, failed, or pending): go check the order. */
  | { kind: "completed" }
  /** Cashfree is navigating away (some UPI/netbanking flows); do nothing. */
  | { kind: "redirecting" }
  /** User closed the popup or the SDK reported an error. */
  | { kind: "closed"; message: string };

/**
 * Opens Cashfree checkout as an in-page popup. The SDK is loaded lazily so
 * it never ships in the main bundle. The result here is only a UI hint:
 * whether the payment succeeded is always decided by the backend.
 */
export async function openCashfreeCheckout(
  order: Pick<CreatedPaymentOrder, "paymentSessionId" | "environment">,
): Promise<CashfreeCheckoutOutcome> {
  const { load } = await import("@cashfreepayments/cashfree-js");
  const cashfree = await load({ mode: order.environment });
  if (!cashfree) {
    throw new Error("Payment checkout could not be loaded.");
  }

  const result = await cashfree.checkout({
    paymentSessionId: order.paymentSessionId,
    redirectTarget: "_modal",
  });

  if (result.error) {
    return { kind: "closed", message: result.error.message ?? "" };
  }
  if (result.redirect) {
    return { kind: "redirecting" };
  }
  return { kind: "completed" };
}
