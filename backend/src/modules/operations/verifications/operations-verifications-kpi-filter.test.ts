import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PENDING_VERIFICATION_FILTER,
  VERIFIED_EMPLOYER_FILTER,
  buildVerificationOverviewKpiFilter,
  resolveVerificationsAnalyticsDateRange,
} from "./operations-verifications-analytics.js";
import { listOperationsVerificationsQuerySchema } from "./operations-verifications.validation.js";

const NOW = new Date(2026, 9, 3, 15, 30, 0);

function rangeFor(preset: "all" | "last_7_days") {
  return resolveVerificationsAnalyticsDateRange({
    preset,
    dateFrom: "",
    dateTo: "",
    now: NOW,
  });
}

describe("verification overview KPI drill-down filters", () => {
  it("overall cards use the status filter without a cohort", async () => {
    const range = rangeFor("all");
    assert.deepEqual(
      await buildVerificationOverviewKpiFilter("total", range, NOW),
      {},
    );
    assert.deepEqual(
      await buildVerificationOverviewKpiFilter("pending", range, NOW),
      PENDING_VERIFICATION_FILTER,
    );
    assert.deepEqual(
      await buildVerificationOverviewKpiFilter("verified", range, NOW),
      VERIFIED_EMPLOYER_FILTER,
    );
  });

  it("period cards AND the activity cohort with the status filter", async () => {
    const range = rangeFor("last_7_days");
    const total = await buildVerificationOverviewKpiFilter("total", range, NOW);
    assert.ok("$or" in total);
    assert.deepEqual(
      await buildVerificationOverviewKpiFilter("verified", range, NOW),
      { $and: [total, VERIFIED_EMPLOYER_FILTER] },
    );
  });

  it("list query accepts KPI drill-down params and rejects unknown cards", () => {
    const parsed = listOperationsVerificationsQuerySchema.parse({
      kpi: "needs_attention",
      kpiPreset: "last_30_days",
    });
    assert.equal(parsed.kpi, "needs_attention");
    assert.equal(parsed.kpiPreset, "last_30_days");
    assert.equal(listOperationsVerificationsQuerySchema.parse({}).kpi, "");
    assert.equal(
      listOperationsVerificationsQuerySchema.safeParse({ kpi: "everything" })
        .success,
      false,
    );
  });
});
