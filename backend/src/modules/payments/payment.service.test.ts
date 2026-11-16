import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CashfreePayment } from "./cashfree.client.js";
import { generateMerchantOrderId, resolveOrderTransition } from "./payment.service.js";

const created = { status: "created" as const, amount: 999, currency: "INR" };

function payment(overrides: Partial<CashfreePayment>): CashfreePayment {
  return {
    cf_payment_id: "1",
    order_id: "AJ_X",
    payment_status: "SUCCESS",
    payment_amount: 999,
    payment_currency: "INR",
    payment_time: "2026-11-16T10:00:00+05:30",
    ...overrides,
  };
}

describe("resolveOrderTransition", () => {
  it("marks PAID with exact amount and currency as paid", () => {
    const result = resolveOrderTransition({
      stored: created,
      cfOrder: { order_status: "PAID", order_amount: 999, order_currency: "INR" },
      payments: [payment({ payment_status: "FAILED", cf_payment_id: "0" }), payment({})],
    });
    assert.equal(result.kind, "paid");
    assert.equal(result.kind === "paid" ? String(result.payment?.cf_payment_id) : "", "1");
  });

  it("withholds the grant on amount or currency mismatch", () => {
    assert.equal(
      resolveOrderTransition({
        stored: created,
        cfOrder: { order_status: "PAID", order_amount: 1, order_currency: "INR" },
        payments: [],
      }).kind,
      "amount_mismatch",
    );
    assert.equal(
      resolveOrderTransition({
        stored: created,
        cfOrder: { order_status: "PAID", order_amount: 999, order_currency: "USD" },
        payments: [],
      }).kind,
      "amount_mismatch",
    );
  });

  it("treats decimal-equal amounts as matching", () => {
    assert.equal(
      resolveOrderTransition({
        stored: { ...created, amount: 299 },
        cfOrder: { order_status: "PAID", order_amount: 299.0, order_currency: "inr" },
        payments: [],
      }).kind,
      "paid",
    );
  });

  it("re-confirms an already paid order so a missing grant can be issued", () => {
    assert.equal(
      resolveOrderTransition({
        stored: { ...created, status: "paid" },
        cfOrder: { order_status: "PAID", order_amount: 999, order_currency: "INR" },
        payments: [],
      }).kind,
      "paid",
    );
  });

  it("never downgrades a paid order", () => {
    assert.equal(
      resolveOrderTransition({
        stored: { ...created, status: "paid" },
        cfOrder: { order_status: "EXPIRED", order_amount: 999, order_currency: "INR" },
        payments: [],
      }).kind,
      "none",
    );
  });

  it("expires EXPIRED / TERMINATED orders once", () => {
    assert.equal(
      resolveOrderTransition({
        stored: created,
        cfOrder: { order_status: "EXPIRED", order_amount: 999, order_currency: "INR" },
        payments: [],
      }).kind,
      "expired",
    );
    assert.equal(
      resolveOrderTransition({
        stored: { ...created, status: "expired" },
        cfOrder: { order_status: "TERMINATED", order_amount: 999, order_currency: "INR" },
        payments: [],
      }).kind,
      "none",
    );
  });

  it("uses the latest attempt for ACTIVE orders", () => {
    const result = resolveOrderTransition({
      stored: created,
      cfOrder: { order_status: "ACTIVE", order_amount: 999, order_currency: "INR" },
      payments: [
        payment({ payment_status: "FAILED", payment_time: "2026-11-16T10:00:00+05:30" }),
        payment({ payment_status: "USER_DROPPED", payment_time: "2026-11-16T10:05:00+05:30" }),
      ],
    });
    assert.equal(result.kind, "user_dropped");
    assert.equal(
      resolveOrderTransition({
        stored: created,
        cfOrder: { order_status: "ACTIVE", order_amount: 999, order_currency: "INR" },
        payments: [],
      }).kind,
      "none",
    );
  });
});

describe("generateMerchantOrderId", () => {
  it("produces unique Cashfree-safe ids", () => {
    const a = generateMerchantOrderId();
    const b = generateMerchantOrderId();
    assert.match(a, /^[A-Za-z0-9_-]{3,45}$/);
    assert.notEqual(a, b);
  });
});
