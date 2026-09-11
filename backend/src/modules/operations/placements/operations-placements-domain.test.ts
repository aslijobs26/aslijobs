import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  percentChange,
  percentOf,
  resolvePlacementsAnalyticsDateRange,
} from "./operations-placements-analytics.js";
import {
  daysBetweenOfferAndJoin,
  extractPlacementSearchObjectId,
  joiningStatusToApplicationStatus,
  parseOfferDate,
  placementStatusLabel,
  resolveActualJoinedAt,
  resolveOfferMadeAt,
  resolvePlacementCohortDate,
  resolvePlacementJoiningStatus,
} from "./operations-placements-domain.js";

describe("operations placements domain", () => {
  it("maps application statuses to joining statuses", () => {
    assert.equal(resolvePlacementJoiningStatus("selected"), "joining_pending");
    assert.equal(resolvePlacementJoiningStatus("joined"), "joined");
    assert.equal(resolvePlacementJoiningStatus("did_not_join"), "did_not_join");
    assert.equal(resolvePlacementJoiningStatus("offer_sent"), null);
    assert.equal(resolvePlacementJoiningStatus("rejected"), null);
  });

  it("labels joining statuses for UI", () => {
    assert.equal(placementStatusLabel("joining_pending"), "Joining Pending");
    assert.equal(placementStatusLabel("joined"), "Joined");
    assert.equal(placementStatusLabel("did_not_join"), "Did Not Join");
  });

  it("converts joining status back to application status", () => {
    assert.equal(
      joiningStatusToApplicationStatus("joining_pending"),
      "selected",
    );
    assert.equal(joiningStatusToApplicationStatus("joined"), "joined");
    assert.equal(
      joiningStatusToApplicationStatus("did_not_join"),
      "did_not_join",
    );
  });

  it("computes non-negative day spans and excludes invalid/negative", () => {
    assert.equal(
      daysBetweenOfferAndJoin(
        parseOfferDate("2026-09-01"),
        parseOfferDate("2026-09-11"),
      ),
      10,
    );
    assert.equal(
      daysBetweenOfferAndJoin(
        parseOfferDate("2026-09-11"),
        parseOfferDate("2026-09-01"),
      ),
      null,
    );
    assert.equal(daysBetweenOfferAndJoin(null, "2026-09-01"), null);
    assert.equal(daysBetweenOfferAndJoin("bad", "2026-09-01"), null);
  });

  it("prefers actual joined history over planned joiningDate for time-to-join", () => {
    const row = {
      offer: {
        offerDate: "2026-08-01T00:00:00.000Z",
        // Planned join same day as offer — previously produced false "0 days"
        joiningDate: "2026-08-01",
      },
      statusHistory: [
        { status: "offer_sent", at: "2026-08-01T10:00:00.000Z" },
        { status: "selected", at: "2026-08-05T10:00:00.000Z" },
        { status: "joined", at: "2026-08-29T00:00:00.000Z" },
      ],
      updatedAt: "2026-08-29T00:00:00.000Z",
    };
    assert.equal(
      resolveOfferMadeAt(row)?.toISOString(),
      "2026-08-01T00:00:00.000Z",
    );
    assert.equal(
      resolveActualJoinedAt(row)?.toISOString(),
      "2026-08-29T00:00:00.000Z",
    );
    assert.equal(
      daysBetweenOfferAndJoin(resolveOfferMadeAt(row), resolveActualJoinedAt(row)),
      28,
    );
  });

  it("falls back to offer_sent history when offer.offerDate is missing", () => {
    const row = {
      offer: { offerDate: "", joiningDate: "2026-09-01" },
      statusHistory: [
        { status: "offer_sent", at: "2026-08-10T00:00:00.000Z" },
        { status: "joined", at: "2026-08-20T00:00:00.000Z" },
      ],
    };
    assert.equal(
      resolveOfferMadeAt(row)?.toISOString(),
      "2026-08-10T00:00:00.000Z",
    );
    assert.equal(
      daysBetweenOfferAndJoin(resolveOfferMadeAt(row), resolveActualJoinedAt(row)),
      10,
    );
  });

  it("resolves placement cohort date from status history", () => {
    const moment = resolvePlacementCohortDate({
      statusHistory: [
        { status: "offer_sent", at: "2026-08-01T00:00:00.000Z" },
        { status: "selected", at: "2026-08-05T00:00:00.000Z" },
        { status: "joined", at: "2026-08-20T00:00:00.000Z" },
      ],
    });
    assert.equal(moment?.toISOString(), "2026-08-05T00:00:00.000Z");
  });

  it("extracts ObjectIds and display-id suffixes for search", () => {
    assert.equal(
      extractPlacementSearchObjectId("68c1a2b3c4d5e6f708091011"),
      "68c1a2b3c4d5e6f708091011",
    );
    assert.equal(
      extractPlacementSearchObjectId("AJ-PLC-ABCD1234"),
      "abcd1234",
    );
    assert.equal(extractPlacementSearchObjectId("Ramesh"), null);
  });

  it("returns null percent change when previous is zero", () => {
    assert.equal(percentChange(10, 0), null);
    assert.equal(percentOf(5, 0), null);
    assert.equal(percentOf(5, 10), 50);
  });
});

describe("placements analytics date range", () => {
  it("defaults last 30 days with previous comparison window", () => {
    const range = resolvePlacementsAnalyticsDateRange({
      preset: "last_30_days",
      dateFrom: "",
      dateTo: "",
      now: new Date("2026-09-10T12:00:00.000Z"),
    });
    assert.equal(range.preset, "last_30_days");
    assert.equal(range.granularity, "day");
    assert.ok(range.from);
    assert.ok(range.previousFrom);
  });

  it("swaps inverted custom ranges", () => {
    const range = resolvePlacementsAnalyticsDateRange({
      preset: "custom",
      dateFrom: "2026-09-20",
      dateTo: "2026-09-01",
      now: new Date(2026, 8, 25),
    });
    assert.ok(new Date(range.from).getTime() <= new Date(range.to).getTime());
  });

  it("supports all / last_7 / this_year presets", () => {
    const now = new Date(2026, 8, 10, 12, 0, 0);
    assert.equal(
      resolvePlacementsAnalyticsDateRange({
        preset: "all",
        dateFrom: "",
        dateTo: "",
        now,
      }).preset,
      "all",
    );
    assert.equal(
      resolvePlacementsAnalyticsDateRange({
        preset: "last_7_days",
        dateFrom: "",
        dateTo: "",
        now,
      }).preset,
      "last_7_days",
    );
    const year = resolvePlacementsAnalyticsDateRange({
      preset: "this_year",
      dateFrom: "",
      dateTo: "",
      now,
    });
    assert.equal(year.preset, "this_year");
    assert.equal(new Date(year.from).getMonth(), 0);
  });
});
