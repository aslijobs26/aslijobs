import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  completionRate,
  mapWorkStatusToTaskBucket,
  percentChange,
  resolveDashboardDateRange,
} from "./operations-dashboard-domain.js";

describe("operations dashboard domain", () => {
  it("computes percent change safely", () => {
    assert.equal(percentChange(120, 100), 20);
    assert.equal(percentChange(80, 100), -20);
    assert.equal(percentChange(10, 0), null);
  });

  it("computes completion rate", () => {
    assert.equal(completionRate(1, 2), 50);
    assert.equal(completionRate(0, 0), null);
  });

  it("resolves last 30 days with equal previous window", () => {
    const now = new Date("2026-09-12T10:00:00.000Z");
    const range = resolveDashboardDateRange({
      datePreset: "last_30_days",
      now,
    });
    const duration =
      range.toExclusive.getTime() - range.from.getTime();
    const previousDuration =
      range.previousToExclusive.getTime() - range.previousFrom.getTime();
    assert.equal(duration, previousDuration);
    assert.equal(range.previousToExclusive.getTime(), range.from.getTime());
    assert.equal(range.label, "Last 30 days");
  });

  it("maps work statuses into task buckets", () => {
    const now = new Date("2026-09-12T12:00:00.000Z");
    assert.equal(mapWorkStatusToTaskBucket("completed", null, now), "completed");
    assert.equal(mapWorkStatusToTaskBucket("cancelled", null, now), null);
    assert.equal(
      mapWorkStatusToTaskBucket("queued", null, now),
      "pending",
    );
    assert.equal(
      mapWorkStatusToTaskBucket("in_progress", null, now),
      "in_progress",
    );
    assert.equal(
      mapWorkStatusToTaskBucket(
        "assigned",
        new Date("2026-09-01T00:00:00.000Z"),
        now,
      ),
      "overdue",
    );
  });
});
