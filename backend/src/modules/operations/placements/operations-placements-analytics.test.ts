import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { kolkataDateKey } from "../analytics/operations-analytics-domain.js";
import {
  classifyPlacementOutcome,
  percentChange,
  percentOf,
  resolvePlacementsAnalyticsDateRange,
} from "./operations-placements-analytics.js";

describe("operations placements analytics helpers", () => {
  it("defaults to last 30 days with a matching previous period", () => {
    const now = new Date("2026-09-10T08:00:00.000Z");
    const range = resolvePlacementsAnalyticsDateRange({
      preset: "last_30_days",
      dateFrom: "",
      dateTo: "",
      now,
    });

    assert.equal(range.preset, "last_30_days");
    assert.equal(range.granularity, "day");
    assert.equal(range.label, "In last 30 days");
    assert.equal(kolkataDateKey(new Date(range.from)), "2026-08-12");
    assert.equal(kolkataDateKey(new Date(range.to)), "2026-09-10");
  });

  it("resolves last 90 days and this year presets", () => {
    const now = new Date("2026-09-10T08:00:00.000Z");
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
    assert.equal(kolkataDateKey(new Date(year.from)), "2026-01-01");
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

  it("keeps a selected candidate who was later rejected out of joined and pending", () => {
    const from = new Date("2026-08-01T00:00:00.000Z");
    const to = new Date("2026-08-31T00:00:00.000Z");
    assert.equal(
      classifyPlacementOutcome({
        selectedAt: new Date("2026-08-05T00:00:00.000Z"),
        joinedAt: null,
        didNotJoinAt: null,
        rejectedAt: new Date("2026-08-20T00:00:00.000Z"),
        from,
        to,
      }),
      null,
    );
    assert.equal(
      classifyPlacementOutcome({
        selectedAt: new Date("2026-08-05T00:00:00.000Z"),
        joinedAt: new Date("2026-08-18T00:00:00.000Z"),
        didNotJoinAt: null,
        rejectedAt: null,
        from,
        to,
      }),
      "joined",
    );
    assert.equal(
      classifyPlacementOutcome({
        selectedAt: new Date("2026-08-05T00:00:00.000Z"),
        joinedAt: null,
        didNotJoinAt: null,
        rejectedAt: null,
        from,
        to,
      }),
      "joining_pending",
    );
  });

  it("computes percent of total with one decimal place", () => {
    assert.equal(percentOf(1, 3), 33.3);
    assert.equal(percentOf(0, 0), null);
    assert.equal(percentOf(5, 10), 50);
  });
});
