import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptyFilters,
  filtersFromSearch,
  todayKey,
  validateCustomRange,
  writeFiltersToSearch,
} from "./analytics-filters.ts";

describe("analytics filters", () => {
  it("rejects an end date before the start date and future dates", () => {
    assert.match(validateCustomRange("2026-11-02", "2026-11-01", new Date("2026-11-02T08:00:00.000Z")) ?? "", /earlier/);
    assert.match(validateCustomRange("2026-11-03", "2026-11-03", new Date("2026-11-02T08:00:00.000Z")) ?? "", /Future/);
    assert.equal(validateCustomRange("2026-11-01", "2026-11-02", new Date("2026-11-02T08:00:00.000Z")), null);
    assert.equal(todayKey(new Date("2026-11-02T20:00:00.000Z")), "2026-11-03");
  });

  it("keeps filters in the URL and clears them together", () => {
    const params = new URLSearchParams("tab=trends");
    const next = writeFiltersToSearch(params, {
      ...emptyFilters(),
      preset: "custom",
      dateFrom: "2026-10-01",
      dateTo: "2026-10-10",
      state: "Telangana",
      city: "Hyderabad",
      horizonDays: 14,
    });
    assert.equal(next.get("tab"), "trends");
    assert.equal(next.get("preset"), "custom");
    assert.equal(next.get("city"), "Hyderabad");
    const read = filtersFromSearch(next);
    assert.equal(read.city, "Hyderabad");
    assert.equal(read.horizonDays, 14);
    const cleared = writeFiltersToSearch(next, emptyFilters());
    assert.equal(cleared.get("tab"), "trends");
    assert.equal(cleared.get("state"), null);
  });
});
