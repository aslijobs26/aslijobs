import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCandidateOverviewKpiFilter,
  resolveCandidateOverviewKpiWindow,
  resolveCandidatesAnalyticsDateRange,
} from "./operations-candidates-analytics.js";
import { listOperationsCandidatesQuerySchema } from "./operations-candidates.validation.js";

const NOW = new Date(2026, 9, 3, 15, 30, 0);

function windowFor(preset: "all" | "last_7_days") {
  return resolveCandidateOverviewKpiWindow(
    resolveCandidatesAnalyticsDateRange({
      preset,
      dateFrom: "",
      dateTo: "",
      now: NOW,
    }),
    NOW,
  );
}

describe("candidate overview KPI drill-down filters", () => {
  it("overall total jobseekers has no constraint", async () => {
    assert.deepEqual(
      await buildCandidateOverviewKpiFilter("total", windowFor("all")),
      {},
    );
  });

  it("overall new registrations covers the last 30 local days", async () => {
    const window = windowFor("all");
    const filter = await buildCandidateOverviewKpiFilter("new", window);
    const createdAt = (filter as { createdAt: { $gte: Date; $lte: Date } })
      .createdAt;
    assert.equal(createdAt.$gte.getTime(), window.last30From.getTime());
    assert.equal(window.last30From.getDate(), 4);
    assert.equal(window.last30From.getMonth(), 8);
    assert.equal(createdAt.$lte.getDate(), 3);
  });

  it("period total jobseekers counts the network as of the period end", async () => {
    const window = windowFor("last_7_days");
    assert.deepEqual(await buildCandidateOverviewKpiFilter("total", window), {
      createdAt: { $lte: window.to },
    });
  });

  it("period complete and verified cards combine the cohort with their status", async () => {
    const window = windowFor("last_7_days");
    const cohort = { createdAt: { $gte: window.from, $lte: window.to } };
    assert.deepEqual(
      await buildCandidateOverviewKpiFilter("complete", window),
      { ...cohort, registrationStatus: "COMPLETED" },
    );
    assert.deepEqual(
      await buildCandidateOverviewKpiFilter("verified", window),
      { ...cohort, isWhatsappVerified: true },
    );
  });

  it("list query accepts KPI drill-down params and rejects unknown cards", () => {
    const parsed = listOperationsCandidatesQuerySchema.parse({
      kpi: "active",
      kpiPreset: "last_30_days",
    });
    assert.equal(parsed.kpi, "active");
    assert.equal(parsed.kpiPreset, "last_30_days");
    assert.equal(listOperationsCandidatesQuerySchema.parse({}).kpi, "");
    assert.equal(
      listOperationsCandidatesQuerySchema.safeParse({ kpi: "everything" })
        .success,
      false,
    );
  });
});
