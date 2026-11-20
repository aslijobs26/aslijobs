import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import {
  buildJobCityKey,
  computeListingValidUntil,
  grantAcceptsCity,
  grantHasFreeCredit,
  isCreditRefundable,
} from "./subscription-entitlement.service.js";
import { SUBSCRIPTION_PLANS, isPurchasablePlanCode } from "./subscription.constants.js";

const jobA = new mongoose.Types.ObjectId();
const jobB = new mongoose.Types.ObjectId();

function grant(overrides: Partial<Parameters<typeof grantAcceptsCity>[0]> = {}) {
  return {
    status: "active",
    jobCredits: 5,
    jobCreditsUsed: 0,
    maxCities: 2,
    consumedJobs: [] as Array<{ jobId: mongoose.Types.ObjectId; cityKey: string }>,
    ...overrides,
  };
}

describe("plan catalog", () => {
  it("matches the agreed plans", () => {
    assert.deepEqual(
      [SUBSCRIPTION_PLANS.free.priceInr, SUBSCRIPTION_PLANS.free.jobCredits, SUBSCRIPTION_PLANS.free.listingValidityDays, SUBSCRIPTION_PLANS.free.maxCities],
      [0, 1, 7, 1],
    );
    assert.deepEqual(
      [SUBSCRIPTION_PLANS.starter_299.priceInr, SUBSCRIPTION_PLANS.starter_299.jobCredits, SUBSCRIPTION_PLANS.starter_299.listingValidityDays, SUBSCRIPTION_PLANS.starter_299.maxCities],
      [299, 1, 7, 1],
    );
    assert.deepEqual(
      [SUBSCRIPTION_PLANS.growth_999.priceInr, SUBSCRIPTION_PLANS.growth_999.jobCredits, SUBSCRIPTION_PLANS.growth_999.listingValidityDays, SUBSCRIPTION_PLANS.growth_999.maxCities],
      [999, 5, 15, 2],
    );
    assert.equal(SUBSCRIPTION_PLANS.enterprise.contactSales, true);
  });

  it("only allows online purchase of 299 and 999", () => {
    assert.equal(isPurchasablePlanCode("starter_299"), true);
    assert.equal(isPurchasablePlanCode("growth_999"), true);
    assert.equal(isPurchasablePlanCode("free"), false);
    assert.equal(isPurchasablePlanCode("enterprise"), false);
  });
});

describe("buildJobCityKey", () => {
  it("normalizes case and whitespace", () => {
    assert.equal(
      buildJobCityKey({ state: " Telangana ", city: "Hyderabad" }),
      buildJobCityKey({ state: "telangana", city: "  hyderabad" }),
    );
  });

  it("falls back to display names and returns empty without a city", () => {
    assert.equal(buildJobCityKey({ stateName: "Karnataka", cityName: "Bengaluru" }), "karnataka::bengaluru");
    assert.equal(buildJobCityKey({ state: "karnataka", city: "" }), "");
  });
});

describe("grantAcceptsCity", () => {
  const hyd = "telangana::hyderabad";
  const blr = "karnataka::bengaluru";
  const chn = "tamil nadu::chennai";

  it("999 plan: accepts up to 2 distinct cities", () => {
    const g = grant({ consumedJobs: [{ jobId: jobA, cityKey: hyd }] });
    assert.equal(grantAcceptsCity(g, hyd), true);
    assert.equal(grantAcceptsCity(g, blr), true);
    const full = grant({
      consumedJobs: [
        { jobId: jobA, cityKey: hyd },
        { jobId: jobB, cityKey: blr },
      ],
    });
    assert.equal(grantAcceptsCity(full, chn), false);
    assert.equal(grantAcceptsCity(full, blr), true);
  });

  it("1-city plan: rejects a second city", () => {
    const g = grant({ maxCities: 1, consumedJobs: [{ jobId: jobA, cityKey: hyd }] });
    assert.equal(grantAcceptsCity(g, blr), false);
  });

  it("lets a job move city when its own entry is the only one using the old city", () => {
    const full = grant({
      consumedJobs: [
        { jobId: jobA, cityKey: hyd },
        { jobId: jobB, cityKey: blr },
      ],
    });
    assert.equal(grantAcceptsCity(full, chn, jobB.toString()), true);
  });
});

describe("grantHasFreeCredit", () => {
  it("requires an active grant with remaining credits", () => {
    assert.equal(grantHasFreeCredit(grant({ jobCreditsUsed: 4 })), true);
    assert.equal(grantHasFreeCredit(grant({ jobCreditsUsed: 5 })), false);
    assert.equal(grantHasFreeCredit(grant({ status: "exhausted", jobCreditsUsed: 1 })), false);
  });
});

describe("computeListingValidUntil", () => {
  it("adds whole days", () => {
    const from = new Date("2026-11-16T00:00:00.000Z");
    assert.equal(computeListingValidUntil(from, 7).toISOString(), "2026-11-23T00:00:00.000Z");
    assert.equal(computeListingValidUntil(from, 15).toISOString(), "2026-12-01T00:00:00.000Z");
  });
});

describe("isCreditRefundable", () => {
  const grantId = new mongoose.Types.ObjectId();

  it("refunds jobs that never went live", () => {
    for (const status of ["draft", "pending_approval", "rejected"]) {
      assert.equal(
        isCreditRefundable({ status, publishedAt: null, reviewDecision: "", subscriptionGrantId: grantId }),
        true,
        status,
      );
    }
  });

  it("does not refund listings that were live or have no credit", () => {
    assert.equal(
      isCreditRefundable({ status: "active", publishedAt: new Date(), reviewDecision: "approved", subscriptionGrantId: grantId }),
      false,
    );
    assert.equal(
      isCreditRefundable({ status: "expired", publishedAt: new Date(), subscriptionGrantId: grantId }),
      false,
    );
    assert.equal(
      isCreditRefundable({ status: "draft", publishedAt: null, subscriptionGrantId: null }),
      false,
    );
  });
});
