import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEmployerOverviewKpiFilter,
  resolveEmployerOverviewKpiWindow,
  resolveEmployersAnalyticsDateRange,
} from "./operations-employers-analytics.js";
import { listOperationsEmployersQuerySchema } from "./operations-employers.validation.js";

const NOW = new Date(2026, 9, 3, 15, 30, 0);

function windowFor(preset: "all" | "last_7_days") {
  return resolveEmployerOverviewKpiWindow(
    resolveEmployersAnalyticsDateRange({
      preset,
      dateFrom: "",
      dateTo: "",
      now: NOW,
    }),
    NOW,
  );
}

describe("employer overview KPI drill-down filters", () => {
  it("overall total employers has no constraint", async () => {
    assert.deepEqual(
      await buildEmployerOverviewKpiFilter("total", windowFor("all")),
      {},
    );
  });

  it("overall new registrations covers the last 30 local days", async () => {
    const window = windowFor("all");
    const filter = await buildEmployerOverviewKpiFilter("new", window);
    assert.deepEqual(filter, {
      createdAt: { $gte: window.last30From, $lte: window.last30To },
    });
    assert.equal(window.last30From.getDate(), 4);
    assert.equal(window.last30From.getMonth(), 8);
  });

  it("period total employers counts the network as of the period end", async () => {
    const window = windowFor("last_7_days");
    assert.deepEqual(
      await buildEmployerOverviewKpiFilter("total", window),
      { createdAt: { $lte: window.to } },
    );
  });

  it("period verified employers combines the cohort range and verified statuses", async () => {
    const window = windowFor("last_7_days");
    assert.deepEqual(
      await buildEmployerOverviewKpiFilter("verified", window),
      {
        createdAt: { $gte: window.from, $lte: window.to },
        verificationStatus: { $in: ["verified", "approved"] },
      },
    );
  });

  it("list query accepts KPI drill-down params and rejects unknown cards", () => {
    const parsed = listOperationsEmployersQuerySchema.parse({
      kpi: "hiring",
      kpiPreset: "last_30_days",
    });
    assert.equal(parsed.kpi, "hiring");
    assert.equal(parsed.kpiPreset, "last_30_days");
    assert.equal(listOperationsEmployersQuerySchema.parse({}).kpi, "");
    assert.equal(
      listOperationsEmployersQuerySchema.safeParse({ kpi: "everything" })
        .success,
      false,
    );
  });
});
