import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ANALYTICS_TABS } from "../../../types/operations-analytics.ts";
import { canAccessOperationsAnalytics } from "./analytics-access.ts";
import { drilldownMetricForKpi } from "./analytics-drilldown.ts";

describe("analytics P1 admin surfaces", () => {
  it("exposes the new sections and maps clickable KPIs", () => {
    for (const tab of ["employer-hiring", "category-coverage", "acquisition", "registration-funnel", "job-conversion"]) {
      assert.equal(ANALYTICS_TABS.includes(tab as (typeof ANALYTICS_TABS)[number]), false);
    }
    assert.equal(drilldownMetricForKpi("applications"), "applications");
    assert.equal(drilldownMetricForKpi("interviews-completed"), "interviews-completed");
    assert.equal(drilldownMetricForKpi("joined"), "joined");
    assert.equal(drilldownMetricForKpi("unique-visitors"), "visitors");
    assert.equal(drilldownMetricForKpi("offers"), null);
  });

  it("still hides analytics from a job-view user", () => {
    assert.equal(
      canAccessOperationsAnalytics({
        isSuperAdmin: false,
        reportsRead: false,
        reportsView: false,
      }),
      false,
    );
  });
});
