import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatEmployerDisplayDate,
  formatEmployerDisplayTime,
  resolveEmployerDateRange,
} from "./operations-employers-datetime.js";

describe("employer registration display datetime", () => {
  it("formats UTC instants in Asia/Kolkata regardless of host timezone", () => {
    const registeredAt = "2026-09-25T12:43:00.000Z";

    assert.equal(formatEmployerDisplayDate(registeredAt), "25 Sept 2026");
    assert.match(formatEmployerDisplayTime(registeredAt), /06:13\s*pm/i);
  });

  it("converts early-morning IST across the UTC date boundary", () => {
    const registeredAt = "2026-09-24T18:40:00.000Z";

    assert.equal(formatEmployerDisplayDate(registeredAt), "25 Sept 2026");
    assert.match(formatEmployerDisplayTime(registeredAt), /12:10\s*am/i);
  });

  it("returns placeholders for missing or invalid values", () => {
    assert.equal(formatEmployerDisplayDate(null), "—");
    assert.equal(formatEmployerDisplayTime(undefined), "");
    assert.equal(formatEmployerDisplayDate("not-a-date"), "—");
    assert.equal(formatEmployerDisplayTime("not-a-date"), "");
  });
});

describe("employer date range windows", () => {
  it("uses Asia/Kolkata calendar days for today", () => {
    const now = new Date("2026-09-25T20:00:00.000Z");
    const range = resolveEmployerDateRange({
      datePreset: "today",
      dateFrom: "",
      dateTo: "",
      now,
    });

    assert.equal(range.from?.toISOString(), "2026-09-25T18:30:00.000Z");
    assert.equal(range.to?.toISOString(), "2026-09-26T18:29:59.999Z");
  });
});
