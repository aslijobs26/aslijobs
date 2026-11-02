import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compareMetric,
  kolkataDateKey,
  parseCalendarDate,
  resolveAnalyticsDateRange,
} from "./operations-analytics-domain.js";
import { forecastDailySeries } from "./operations-analytics-forecast.js";
import { canonicalCategory } from "./operations-analytics-taxonomy.js";
import { analyticsExportRows } from "./operations-analytics-export.js";
import type { OperationsAnalyticsOverview } from "./operations-analytics.types.js";

describe("operations analytics upgrade", () => {
  it("keeps a custom range inclusive in Asia/Kolkata and rejects nothing for a past range", () => {
    const range = resolveAnalyticsDateRange({
      preset: "custom",
      dateFrom: "2026-11-01",
      dateTo: "2026-11-02",
    });
    assert.equal(kolkataDateKey(new Date(range.from)), "2026-11-01");
    assert.equal(kolkataDateKey(new Date(range.to)), "2026-11-02");
    assert.equal(kolkataDateKey(new Date(range.previousTo)), "2026-10-31");
    assert.equal(parseCalendarDate("2026-02-31"), null);
  });

  it("compares this month with the previous calendar month", () => {
    const range = resolveAnalyticsDateRange(
      { preset: "this_month" },
      new Date("2026-11-02T08:00:00.000Z"),
    );
    assert.equal(range.label, "This month");
    assert.equal(kolkataDateKey(new Date(range.from)), "2026-11-01");
    assert.equal(kolkataDateKey(new Date(range.previousFrom)), "2026-10-01");
    assert.equal(kolkataDateKey(new Date(range.previousTo)), "2026-10-31");
    assert.equal(range.comparisonBasis, "previous_calendar_period");
  });

  it("does not invent a percentage when the previous value is zero", () => {
    const created = compareMetric(8, 0);
    assert.equal(created.changeLabel, "new");
    assert.equal(created.changePercent, null);
    assert.equal(created.absoluteDifference, 8);
    const empty = compareMetric(0, 0);
    assert.equal(empty.changeLabel, "no_baseline");
    const overall = compareMetric(4, null);
    assert.equal(overall.changeLabel, "unavailable");
    const change = compareMetric(80, 100);
    assert.equal(change.changePercent, -20);
    assert.equal(change.absoluteDifference, -20);
  });

  it("maps equivalent categories and leaves ambiguous text unclassified", () => {
    assert.equal(canonicalCategory("manufacturing").id, "manufacturing");
    assert.equal(canonicalCategory("Delivery Boy").id, "logistics-transportation");
    assert.equal(canonicalCategory("Security Guard").confidence, "alias");
    assert.equal(canonicalCategory("basket weaver").id, "unclassified");
    assert.equal(canonicalCategory("basket weaver").raw, "basket weaver");
  });

  it("forecasts only from the supplied history and reports backtest error", () => {
    const history = Array.from({ length: 40 }, (_, index) => index + 1);
    const result = forecastDailySeries(history, 7);
    assert.equal(result.sufficient, true);
    assert.equal(result.forecast.length, 7);
    assert.ok(result.backtest);
    assert.ok((result.backtest?.mae ?? 0) >= 0);
    const sparse = forecastDailySeries([1, 0, 1], 7);
    assert.equal(sparse.sufficient, false);
    assert.match(sparse.message, /Insufficient historical data/);
  });

  it("builds export rows from the same overview values", () => {
    const overview = {
      range: {
        preset: "today",
        from: "2026-11-02T00:00:00.000Z",
        to: "2026-11-02T00:00:00.000Z",
        previousFrom: "2026-11-01T00:00:00.000Z",
        previousTo: "2026-11-01T00:00:00.000Z",
        label: "Today",
      },
      state: "Telangana",
      generatedAt: "2026-11-02T06:00:00.000Z",
      filters: {
        country: "India",
        state: "Telangana",
        city: "",
        category: "",
        employer: "",
        jobType: "",
        applicationStatus: "",
        horizonDays: 30,
      },
      platformKpis: [
        {
          id: "applications",
          label: "Job Applications",
          value: 4,
          previousValue: 2,
          changePercent: 100,
          trendDirection: "up",
          changeLabel: "percent",
          format: "number",
        },
      ],
      websiteTraffic: {
        pageViews: 10,
        uniqueVisitors: 3,
        sessions: 4,
        newVisitors: 1,
        returningVisitors: 2,
        topPages: [],
        byDevice: [],
        bySourceHost: [],
        daily: [],
        trackingActive: true,
      },
      keyInsights: [],
      funnel: [{ key: "applications", label: "Applications", count: 4, conversionPercent: 100, widthPercent: 100 }],
      supplyDemand: [],
      topLocations: [],
      placementMetrics: [],
      marketIntelligence: [],
      forecasts: [],
      trends: [],
      limitations: ["Website events do not store city."],
    } as OperationsAnalyticsOverview;
    const rows = analyticsExportRows(overview, "applications");
    assert.equal(rows.find((row) => row.metric === "Job Applications")?.value.includes("4"), true);
    assert.equal(rows.some((row) => row.section === "Website"), false);
    assert.equal(rows.some((row) => row.value.includes("Website events")), true);
  });
});
