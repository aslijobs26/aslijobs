import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  percentChange,
  percentOf,
  resolvePlacementsAnalyticsDateRange,
} from "./operations-placements-analytics.js";

describe("operations placements analytics helpers", () => {
  it("defaults to last 30 days with a matching previous period", () => {
    const now = new Date(2026, 8, 10, 15, 30, 0);
    const range = resolvePlacementsAnalyticsDateRange({
      preset: "last_30_days",
      dateFrom: "",
      dateTo: "",
      now,
    });

    assert.equal(range.preset, "last_30_days");
    assert.equal(range.granularity, "day");
    assert.equal(range.label, "In last 30 days");
    assert.equal(new Date(range.from).getDate(), 12);
    assert.equal(new Date(range.from).getMonth(), 7);
  });

  it("resolves last 90 days and this year presets", () => {
    const now = new Date(2026, 8, 10, 12, 0, 0);
    const ninety = resolvePlacementsAnalyticsDateRange({
      preset: "last_90_days",
      dateFrom: "",
      dateTo: "",
      now,
    });
    assert.equal(ninety.preset, "last_90_days");
    assert.equal(ninety.granularity, "week");

    const year = resolvePlacementsAnalyticsDateRange({
      preset: "this_year",
      dateFrom: "",
      dateTo: "",
      now,
    });
    assert.equal(year.preset, "this_year");
    assert.equal(new Date(year.from).getMonth(), 0);
    assert.equal(new Date(year.from).getDate(), 1);
  });

  it("resolves last 7 days as day granularity", () => {
    const range = resolvePlacementsAnalyticsDateRange({
      preset: "last_7_days",
      dateFrom: "",
      dateTo: "",
      now: new Date(2026, 8, 10, 12, 0, 0),
    });
    assert.equal(range.preset, "last_7_days");
    assert.equal(range.granularity, "day");
  });

  it("uses month granularity for overall", () => {
    const range = resolvePlacementsAnalyticsDateRange({
      preset: "all",
      dateFrom: "",
      dateTo: "",
      now: new Date(2026, 8, 10, 12, 0, 0),
    });
    assert.equal(range.preset, "all");
    assert.equal(range.granularity, "month");
  });

  it("does not invent a percentage when the previous period is zero", () => {
    assert.equal(percentChange(12, 0), null);
    assert.equal(percentChange(18, 100), -82);
    assert.equal(percentChange(118, 100), 18);
  });

  it("computes percent of total with one decimal place", () => {
    assert.equal(percentOf(1, 3), 33.3);
    assert.equal(percentOf(0, 0), null);
    assert.equal(percentOf(5, 10), 50);
  });
});
