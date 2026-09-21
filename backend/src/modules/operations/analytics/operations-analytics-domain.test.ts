import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifySupplyDemand,
  consecutiveConversionPercent,
  marketStatusForLevels,
  resolveAnalyticsDateRange,
} from "./operations-analytics-domain.js";

describe("operations-analytics-domain", () => {
  it("classifies supply/demand statuses from ratio", () => {
    assert.equal(classifySupplyDemand(100, 150), "shortage");
    assert.equal(classifySupplyDemand(150, 100), "surplus");
    assert.equal(classifySupplyDemand(100, 100), "balanced");
  });

  it("computes consecutive conversion percent", () => {
    assert.equal(consecutiveConversionPercent(29, 100), 29);
    assert.equal(consecutiveConversionPercent(0, 0), 0);
    assert.equal(consecutiveConversionPercent(10, 0), 100);
  });

  it("resolves last_6_months label", () => {
    const range = resolveAnalyticsDateRange({ preset: "last_6_months" });
    assert.equal(range.label, "Last 6 months");
    assert.ok(new Date(range.to) > new Date(range.from));
  });

  it("resolves today and last_7_days presets", () => {
    const today = resolveAnalyticsDateRange({ preset: "today" });
    assert.equal(today.label, "Today");
    const week = resolveAnalyticsDateRange({ preset: "last_7_days" });
    assert.equal(week.label, "Last 7 days");
    assert.ok(new Date(week.to) > new Date(week.from));
  });

  it("resolves yesterday as a single calendar day", () => {
    const range = resolveAnalyticsDateRange({ preset: "yesterday" });
    assert.equal(range.label, "Yesterday");
    const from = new Date(range.from);
    const to = new Date(range.to);
    assert.equal(from.toDateString(), to.toDateString());
  });

  it("maps market status from levels", () => {
    const underserved = marketStatusForLevels("high", "low", "low");
    assert.equal(underserved.status, "Underserved");
    const growth = marketStatusForLevels("high", "high", "medium");
    assert.equal(growth.status, "Growth market");
  });
});
