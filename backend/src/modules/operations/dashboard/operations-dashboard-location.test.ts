import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveIndiaStateFromLocationFields } from "../employers/india-state-normalize.js";
import {
  resolveDashboardDateRange,
  resolveLocationComparisonRange,
} from "./operations-dashboard-domain.js";
import {
  LOCATION_OTHERS,
  LOCATION_UNSPECIFIED,
  rankOperationsLocationActivity,
} from "./operations-dashboard-location.js";

describe("operations dashboard location analytics", () => {
  it("resolves city-only and preferred-location records to a state", () => {
    assert.equal(
      resolveIndiaStateFromLocationFields({
        state: "",
        city: "Hyderabad",
      }),
      "Telangana",
    );
    assert.equal(
      resolveIndiaStateFromLocationFields({
        state: "",
        city: "",
        preferredJobLocation: "Vijayawada, Andhra Pradesh",
      }),
      "Andhra Pradesh",
    );
    assert.equal(
      resolveIndiaStateFromLocationFields({
        state: "Telangana",
        city: "Hyderabad",
      }),
      "Telangana",
    );
  });

  it("ranks mapped states first and keeps unspecified last", () => {
    const rows = rankOperationsLocationActivity({
      totals: new Map([
        [LOCATION_UNSPECIFIED, 29],
        ["Telangana", 25],
        ["Andhra Pradesh", 11],
        ["Tamil Nadu", 1],
      ]),
      trendCurrent: new Map([
        [LOCATION_UNSPECIFIED, 4],
        ["Telangana", 10],
        ["Andhra Pradesh", 6],
        ["Tamil Nadu", 1],
      ]),
      trendPrevious: new Map([
        ["Telangana", 5],
        ["Andhra Pradesh", 8],
      ]),
    });

    assert.equal(rows[0]?.state, "Telangana");
    assert.equal(rows[0]?.trendPercent, 100);
    assert.equal(rows[0]?.trendDirection, "up");
    assert.equal(rows[1]?.state, "Andhra Pradesh");
    assert.equal(rows[1]?.trendDirection, "down");
    assert.equal(rows.at(-1)?.state, LOCATION_UNSPECIFIED);
    assert.equal(rows.at(-1)?.trendDirection, "new");
    assert.equal(rows[0]?.sharePercent, 37.9);
  });

  it("rolls lower states into Others without swallowing unspecified", () => {
    const totals = new Map<string, number>([
      ["Telangana", 20],
      ["Andhra Pradesh", 18],
      ["Karnataka", 16],
      ["Tamil Nadu", 14],
      ["Maharashtra", 12],
      ["Delhi", 10],
      ["Kerala", 8],
      ["Gujarat", 6],
      ["Odisha", 4],
      [LOCATION_UNSPECIFIED, 9],
    ]);
    const rows = rankOperationsLocationActivity({
      totals,
      trendCurrent: totals,
      trendPrevious: new Map([["Telangana", 10]]),
      topStates: 8,
    });

    assert.equal(rows.length, 9);
    assert.equal(rows[7]?.state, LOCATION_OTHERS);
    assert.equal(rows[7]?.totalActivity, 10);
    assert.equal(rows[8]?.state, LOCATION_UNSPECIFIED);
    assert.equal(rows[8]?.totalActivity, 9);
  });

  it("uses a prior-12-month trend window for Overall", () => {
    const range = resolveDashboardDateRange({
      datePreset: "all",
      now: new Date("2026-09-17T06:00:00.000Z"),
    });
    const windows = resolveLocationComparisonRange(range);
    assert.equal(windows.usesDistinctTrendWindow, true);
    assert.equal(windows.trendCaption, "vs prior 12 months");
    assert.equal(
      windows.trendPreviousToExclusive.getTime(),
      windows.trendCurrentFrom.getTime(),
    );
    assert.ok(
      windows.totalsFrom.getTime() < windows.trendCurrentFrom.getTime(),
    );
  });
});
