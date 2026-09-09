import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isBeyondSla,
  mapDocumentTypeToCategory,
  msToDays,
  percentChange,
  resolveOperationalVerificationStatus,
  resolveVerificationsAnalyticsDateRange,
  SLA_TARGET_DAYS,
  titleCaseIndustry,
} from "./operations-verifications-analytics.js";

describe("operations verifications analytics helpers", () => {
  it("uses a 3-day SLA target constant", () => {
    assert.equal(SLA_TARGET_DAYS, 3);
  });

  it("resolves last 30 days with a matching previous period", () => {
    const now = new Date(2026, 8, 5, 15, 30, 0);
    const range = resolveVerificationsAnalyticsDateRange({
      preset: "last_30_days",
      dateFrom: "",
      dateTo: "",
      now,
    });

    assert.equal(range.preset, "last_30_days");
    assert.equal(range.granularity, "day");
    assert.equal(range.label, "In last 30 days");
    assert.equal(new Date(range.from).getDate(), 7);
    assert.equal(new Date(range.from).getMonth(), 7);
  });

  it("does not invent a percentage when the previous period is zero", () => {
    assert.equal(percentChange(12, 0), null);
    assert.equal(percentChange(18, 100), -82);
    assert.equal(percentChange(118, 100), 18);
  });

  it("converts milliseconds to days with one decimal place", () => {
    assert.equal(msToDays(3 * 24 * 60 * 60 * 1000), 3);
    assert.equal(msToDays(1.5 * 24 * 60 * 60 * 1000), 1.5);
  });

  it("flags cases beyond the SLA target", () => {
    const start = new Date("2026-09-01T00:00:00.000Z");
    const within = new Date("2026-09-03T12:00:00.000Z");
    const beyond = new Date("2026-09-05T00:00:01.000Z");

    assert.equal(isBeyondSla(start, within), false);
    assert.equal(isBeyondSla(start, beyond), true);
  });

  it("maps document types into readable category buckets", () => {
    assert.deepEqual(mapDocumentTypeToCategory("gst-certificate"), {
      key: "gst_certificate",
      label: "GST Certificate",
    });
    assert.deepEqual(mapDocumentTypeToCategory("pan-card-business"), {
      key: "pan_card",
      label: "PAN Card",
    });
    assert.deepEqual(mapDocumentTypeToCategory("certificate-of-incorporation"), {
      key: "business_registration",
      label: "Business Registration",
    });
    assert.deepEqual(mapDocumentTypeToCategory("unknown-doc"), {
      key: "other_documents",
      label: "Other Documents",
    });
  });

  it("maps industry slugs to canonical catalog labels", () => {
    assert.equal(titleCaseIndustry("it-software"), "IT & Software");
    assert.equal(titleCaseIndustry("retail-ecommerce"), "Retail & Sales");
    assert.equal(titleCaseIndustry(""), "Unspecified");
  });

  it("maps pending vs under_review from submission + documents", () => {
    const pending = resolveOperationalVerificationStatus({
      verificationStatus: "pending",
      documentsCount: 0,
      createdAt: "2026-09-05T00:00:00.000Z",
      now: new Date("2026-09-05T12:00:00.000Z"),
    });
    assert.equal(pending.status, "pending");
    assert.equal(pending.needsAttention, false);

    const underReview = resolveOperationalVerificationStatus({
      verificationStatus: "pending",
      verificationSubmittedAt: "2026-09-04T00:00:00.000Z",
      documentsCount: 2,
      now: new Date("2026-09-05T12:00:00.000Z"),
    });
    assert.equal(underReview.status, "under_review");
    assert.equal(underReview.needsAttention, false);
  });

  it("marks aged pending and completed-without-docs as needs attention", () => {
    const aged = resolveOperationalVerificationStatus({
      verificationStatus: "pending",
      verificationSubmittedAt: "2026-08-01T00:00:00.000Z",
      documentsCount: 1,
      now: new Date("2026-09-05T12:00:00.000Z"),
    });
    assert.equal(aged.status, "under_review");
    assert.equal(aged.needsAttention, true);
    assert.equal(aged.slaBreach, true);

    const noDocs = resolveOperationalVerificationStatus({
      verificationStatus: "pending",
      registrationStatus: "completed",
      documentsCount: 0,
      createdAt: "2026-09-05T00:00:00.000Z",
      now: new Date("2026-09-05T12:00:00.000Z"),
    });
    assert.equal(noDocs.status, "pending");
    assert.equal(noDocs.needsAttention, true);
    assert.equal(noDocs.slaBreach, false);
  });

  it("does not treat WhatsApp OTP + completed registration as ops-verified", () => {
    const open = resolveOperationalVerificationStatus({
      verificationStatus: "",
      registrationStatus: "completed",
      documentsCount: 0,
      createdAt: "2026-09-05T00:00:00.000Z",
      now: new Date("2026-09-05T12:00:00.000Z"),
    });
    assert.equal(open.status, "pending");
    assert.equal(open.needsAttention, true);

    const explicit = resolveOperationalVerificationStatus({
      verificationStatus: "verified",
      registrationStatus: "completed",
      documentsCount: 0,
    });
    assert.equal(explicit.status, "verified");
  });
});
