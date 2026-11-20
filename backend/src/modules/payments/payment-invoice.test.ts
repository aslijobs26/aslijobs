import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeGst } from "../subscriptions/subscription.constants.js";
import {
  amountInWords,
  buildPaymentInvoicePdf,
  resolveTaxLines,
} from "./payment-invoice-pdf.js";
import { orderTaxBreakdown } from "./payment.service.js";

describe("computeGst", () => {
  it("adds 18% GST on top of plan prices, paise-exact", () => {
    assert.deepEqual(computeGst(299), {
      baseAmount: 299,
      gstRatePercent: 18,
      gstAmount: 53.82,
      totalAmount: 352.82,
    });
    assert.deepEqual(computeGst(999), {
      baseAmount: 999,
      gstRatePercent: 18,
      gstAmount: 179.82,
      totalAmount: 1178.82,
    });
  });
});

describe("orderTaxBreakdown", () => {
  it("treats pre-GST orders as untaxed", () => {
    assert.deepEqual(orderTaxBreakdown({ amount: 299, baseAmount: null }), {
      baseAmount: 299,
      gstRatePercent: 0,
      gstAmount: 0,
    });
  });

  it("returns stored GST fields for new orders", () => {
    assert.deepEqual(
      orderTaxBreakdown({ amount: 352.82, baseAmount: 299, gstRatePercent: 18, gstAmount: 53.82 }),
      { baseAmount: 299, gstRatePercent: 18, gstAmount: 53.82 },
    );
  });
});

describe("resolveTaxLines", () => {
  const base = { gstRatePercent: 18, gstAmount: 53.82 };

  it("splits CGST + SGST for intra-state supply, summing to the total", () => {
    const lines = resolveTaxLines({ ...base, sellerState: "Telangana", buyerState: " telangana " });
    assert.deepEqual(lines.map((l) => l.label), ["CGST @ 9%", "SGST @ 9%"]);
    assert.equal(Math.round((lines[0]!.amount + lines[1]!.amount) * 100), 5382);
  });

  it("uses IGST for inter-state supply", () => {
    assert.deepEqual(
      resolveTaxLines({ ...base, sellerState: "Telangana", buyerState: "Karnataka" }),
      [{ label: "IGST @ 18%", amount: 53.82 }],
    );
  });

  it("falls back to a single GST line when a state is unknown", () => {
    assert.deepEqual(resolveTaxLines({ ...base, sellerState: "", buyerState: "Karnataka" }), [
      { label: "GST @ 18%", amount: 53.82 },
    ]);
  });

  it("returns no tax lines for untaxed orders", () => {
    assert.deepEqual(
      resolveTaxLines({ gstRatePercent: 0, gstAmount: 0, sellerState: "A", buyerState: "A" }),
      [],
    );
  });
});

describe("amountInWords", () => {
  it("uses Indian numbering with paise", () => {
    assert.equal(amountInWords(352.82), "Rupees Three Hundred Fifty-Two and Eighty-Two Paise Only");
    assert.equal(amountInWords(125000), "Rupees One Lakh Twenty-Five Thousand Only");
  });
});

describe("buildPaymentInvoicePdf", () => {
  it("renders a PDF buffer", async () => {
    const tax = computeGst(299);
    const party = { name: "X", address: "", email: "", phone: "", gstin: "", state: "" };
    const buffer = await buildPaymentInvoicePdf({
      invoiceNumber: "INV-1",
      orderId: "AJ_1",
      paymentId: "1",
      paymentMethod: "upi",
      bankReference: "",
      paidAt: new Date("2026-11-16T10:00:00Z"),
      planName: "Starter",
      planDescription: "",
      planHighlights: ["1 job post"],
      sacCode: "",
      baseAmount: tax.baseAmount,
      gstRatePercent: tax.gstRatePercent,
      gstAmount: tax.gstAmount,
      amount: tax.totalAmount,
      currency: "INR",
      seller: party,
      billedTo: party,
    });
    assert.equal(buffer.subarray(0, 5).toString(), "%PDF-");
  });
});
