import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildJobsAnalyticsInsight,
  fillTimeSeries,
  percentChange,
  resolveJobsAnalyticsDateRange,
} from "./operations-jobs-analytics.js";

describe("operations jobs analytics helpers", () => {
  it("resolves last 30 days and a matching previous period", () => {
    const now = new Date(2026, 8, 5, 15, 30, 0);
    const range = resolveJobsAnalyticsDateRange({
      preset: "last_30_days",
      dateFrom: "",
      dateTo: "",
      now,
    });

    assert.equal(range.preset, "last_30_days");
    assert.equal(range.granularity, "day");
    assert.equal(new Date(range.from).getDate(), 7);
    assert.equal(new Date(range.from).getMonth(), 7);
    assert.equal(new Date(range.to).getDate(), 5);
    assert.equal(new Date(range.to).getMonth(), 8);
  });

  it("uses weekly buckets for last 3 months", () => {
    const range = resolveJobsAnalyticsDateRange({
      preset: "last_3_months",
      dateFrom: "",
      dateTo: "",
      now: new Date(2026, 8, 5),
    });

    assert.equal(range.granularity, "week");
  });

  it("does not invent a percentage when the previous period is zero", () => {
    assert.equal(percentChange(12, 0), null);
    assert.equal(percentChange(18, 100), -82);
    assert.equal(percentChange(118, 100), 18);
  });

  it("fills missing days with zero counts", () => {
    const range = resolveJobsAnalyticsDateRange({
      preset: "custom",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-03",
      now: new Date(2026, 8, 5),
    });
    const points = fillTimeSeries(
      [{ key: "2026-09-02", count: 4 }],
      range,
    );

    assert.equal(points.length, 3);
    assert.deepEqual(
      points.map((point) => point.count),
      [0, 4, 0],
    );
  });

  it("builds insights only from calculable period changes", () => {
    const withPercent = buildJobsAnalyticsInsight({
      preset: "last_30_days",
      jobsCreated: 118,
      previousJobsCreated: 100,
      applications: 40,
      previousApplications: 50,
      pendingApprovalJobs: 1,
      expiringSoonJobs: 0,
    });

    assert.match(withPercent.headline, /up by 18%/);
    assert.equal(withPercent.jobsCreatedChangePercent, 18);
    assert.equal(withPercent.trendDirection, "up");
    assert.match(withPercent.detail, /down by 20%/);
    assert.match(withPercent.detail, /pending approval/);

    const withoutPercent = buildJobsAnalyticsInsight({
      preset: "last_7_days",
      jobsCreated: 5,
      previousJobsCreated: 0,
      applications: 0,
      previousApplications: 0,
      pendingApprovalJobs: 0,
      expiringSoonJobs: 2,
    });

    assert.equal(withoutPercent.jobsCreatedChangePercent, null);
    assert.match(withoutPercent.headline, /cannot be calculated/);
    assert.match(withoutPercent.detail, /expire within 7 days/);
  });
});
