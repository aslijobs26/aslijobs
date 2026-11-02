import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { projectGrantedKeysToMatrix } from "../rbac/operations-permission-projection.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import {
  canExportOperationsAnalytics,
  canViewOperationsAnalytics,
} from "./operations-analytics-access.js";
import { kolkataDateKey } from "./operations-analytics-domain.js";
import {
  addCalendarDays,
  buildCalendarForecast,
  fillCalendarDays,
} from "./operations-analytics-forecast.js";
import { ANALYTICS_KPI_DEFINITIONS } from "./operations-analytics-kpi.js";
import { analyticsExportRows, spreadsheetSafe } from "./operations-analytics-export.js";
import { reachFromHistory, summarizeStageFixture } from "./operations-analytics-stages.js";
import type { OperationsAnalyticsOverview } from "./operations-analytics.types.js";

const FROM = new Date("2026-11-01T00:00:00.000Z");
const TO = new Date("2026-11-30T23:59:59.000Z");

function access(grantedKeys: string[], isSuperAdmin = false): OperationsResolvedAccess {
  return {
    userId: "u1",
    role: "CUSTOM",
    roleId: "r1",
    roleName: "Custom",
    isSuperAdmin,
    departmentId: null,
    departmentName: null,
    departmentSlug: null,
    orgUnitId: null,
    canCreateRoles: false,
    canManageUsers: false,
    canAssignRoles: false,
    permissions: projectGrantedKeysToMatrix(grantedKeys, isSuperAdmin),
    grantedKeys,
    delegatableKeys: [],
    parentRoleId: null,
  };
}

describe("historical hiring stages", () => {
  it("keeps shortlisted, interviewed, and offered after a later rejection", () => {
    const totals = summarizeStageFixture(
      [
        {
          events: [
            { status: "shortlisted", at: "2026-11-02T04:00:00.000Z" },
            { status: "interview_scheduled", at: "2026-11-03T04:00:00.000Z" },
            { status: "interview_completed", at: "2026-11-04T04:00:00.000Z" },
            { status: "offer_sent", at: "2026-11-05T04:00:00.000Z" },
            { status: "rejected", at: "2026-11-06T04:00:00.000Z" },
          ],
        },
      ],
      FROM,
      TO,
    );
    assert.equal(totals.shortlisted, 1);
    assert.equal(totals.interviewScheduled, 1);
    assert.equal(totals.interviewCompleted, 1);
    assert.equal(totals.offerSent, 1);
    assert.equal(totals.selected, 0);
    assert.equal(totals.joined, 0);
  });

  it("does not count selected as joined and does not infer a completed interview from an offer", () => {
    const reach = reachFromHistory(
      [
        { status: "selected", at: "2026-11-08T04:00:00.000Z" },
        { status: "offer_sent", at: "2026-11-07T04:00:00.000Z" },
      ],
      FROM,
      TO,
    );
    assert.equal(reach.selected, true);
    assert.equal(reach.joined, false);
    assert.equal(reach.interviewCompleted, false);
    assert.equal(reach.offerSent, true);
  });

  it("counts one scheduled person when the interview is rescheduled, and ignores a cancellation outside the range", () => {
    const inside = reachFromHistory(
      [
        { status: "interview_scheduled", at: "2026-11-03T04:00:00.000Z" },
        {
          status: "interview_scheduled",
          at: "2026-11-04T04:00:00.000Z",
          remark: "Interview Rescheduled by recruiter",
        },
      ],
      FROM,
      TO,
      "2026-12-02T04:00:00.000Z",
    );
    assert.equal(inside.interviewScheduled, true);
    assert.equal(inside.rescheduled, true);
    assert.equal(inside.cancelled, false);
    const people = summarizeStageFixture(
      [
        {
          events: [
            { status: "interview_scheduled", at: "2026-11-03T04:00:00.000Z" },
            {
              status: "interview_scheduled",
              at: "2026-11-04T04:00:00.000Z",
              remark: "Interview Rescheduled by recruiter",
            },
          ],
        },
      ],
      FROM,
      TO,
    );
    assert.equal(people.interviewScheduled, 1);
    assert.equal(people.rescheduled, 1);
  });

  it("counts a large synthetic history without collapsing stages", () => {
    const applications = Array.from({ length: 100_000 }, (_, index) => ({
      events: [
        { status: "shortlisted", at: "2026-11-02T04:00:00.000Z" },
        { status: "interview_completed", at: "2026-11-03T04:00:00.000Z" },
        { status: "offer_sent", at: "2026-11-04T04:00:00.000Z" },
        { status: index % 2 === 0 ? "joined" : "selected", at: "2026-11-05T04:00:00.000Z" },
      ],
    }));
    const started = Date.now();
    const totals = summarizeStageFixture(applications, FROM, TO);
    assert.ok(Date.now() - started < 5_000);
    assert.equal(totals.shortlisted, 100_000);
    assert.equal(totals.interviewCompleted, 100_000);
    assert.equal(totals.offerSent, 100_000);
    assert.equal(totals.selected, 50_000);
    assert.equal(totals.joined, 50_000);
    assert.equal(totals.interviewScheduled, 0);
  });
});

describe("forecast calendar dates", () => {
  it("keeps source dates, fills a missing day, and projects the requested horizon", () => {
    const points = [
      { date: "2026-11-01", count: 2 },
      { date: "2026-11-03", count: 4 },
    ];
    for (let day = 4; day <= 20; day += 1) {
      points.push({ date: `2026-11-${String(day).padStart(2, "0")}`, count: day });
    }
    const forecast = buildCalendarForecast(points, 7);
    assert.equal(forecast.history[0]?.date, "2026-11-01");
    assert.equal(forecast.history[1]?.date, "2026-11-02");
    assert.equal(forecast.history[1]?.actual, 0);
    assert.equal(forecast.history[2]?.date, "2026-11-03");
    assert.equal(forecast.history[2]?.actual, 4);
    assert.equal(forecast.history.at(-1)?.date, "2026-11-20");
    assert.equal(forecast.projection.length, 7);
    assert.equal(forecast.projection[0]?.date, "2026-11-21");
    assert.equal(forecast.projection[6]?.date, "2026-11-27");
    assert.equal(forecast.backtest?.to, "2026-11-20");
    assert.notEqual(forecast.history.some((point) => point.date === forecast.projection[0]?.date), true);
  });

  it("does not move a Kolkata date key across the UTC boundary", () => {
    const key = kolkataDateKey(new Date("2026-11-01T18:30:00.000Z"));
    assert.equal(key, "2026-11-02");
    const filled = fillCalendarDays([
      { date: key, count: 3 },
      { date: addCalendarDays(key, 2), count: 1 },
    ]);
    assert.deepEqual(
      filled.map((point) => point.date),
      ["2026-11-02", "2026-11-03", "2026-11-04"],
    );
    assert.equal(filled[1]?.count, 0);
    assert.equal(addCalendarDays("2026-11-30", 1), "2026-12-01");
  });
});

describe("export safety and analytics access", () => {
  it("neutralizes formula prefixes and keeps ordinary values", () => {
    assert.equal(spreadsheetSafe("=cmd|'/c calc'!A0"), "'=cmd|'/c calc'!A0");
    assert.equal(spreadsheetSafe("+1"), "'+1");
    assert.equal(spreadsheetSafe("-10"), "'-10");
    assert.equal(spreadsheetSafe("@SUM(A1)"), "'@SUM(A1)");
    assert.equal(spreadsheetSafe("Acme Construction"), "Acme Construction");
    assert.equal(spreadsheetSafe("100"), "100");
  });

  it("exports the company label instead of an employer id", () => {
    const overview = {
      range: {
        preset: "custom",
        from: "2026-11-01T00:00:00.000Z",
        to: "2026-11-02T00:00:00.000Z",
        previousFrom: "2026-10-01T00:00:00.000Z",
        previousTo: "2026-10-02T00:00:00.000Z",
        label: "Custom",
        comparisonBasis: "equivalent_length",
        timezone: "Asia/Kolkata",
      },
      state: "",
      filters: {
        country: "",
        state: "",
        city: "",
        category: "",
        employer: "=HYPERLINK(\"http://evil\")",
        jobType: "",
        applicationStatus: "",
        horizonDays: 30,
      },
      platformKpis: [],
      websiteTraffic: {
        pageViews: 0,
        uniqueVisitors: 0,
        sessions: 0,
        newVisitors: 0,
        returningVisitors: 0,
        topPages: [],
        byDevice: [],
        bySourceHost: [],
        daily: [],
        trackingActive: true,
      },
      keyInsights: [],
      funnel: [],
      supplyDemand: [],
      topLocations: [],
      placementMetrics: [],
      marketIntelligence: [],
      interviewMetrics: {
        scheduled: 1,
        completed: 1,
        rescheduled: 0,
        cancelled: 0,
        missingHistory: 2,
        noShows: null,
        completionRate: 100,
        interviewToOfferRate: 0,
        avgDaysApplicationToInterview: null,
        avgDaysInterviewToOffer: null,
        byCategory: [],
        byEmployer: [{ employerId: "Northwind Hiring", scheduled: 1, completed: 1, offers: 0 }],
        statusDistribution: [],
        note: "Completed interviews count only interview_completed history events.",
      },
      employerHiring: undefined,
      forecasts: [],
      trends: [],
      limitations: [],
    } as OperationsAnalyticsOverview;
    const rows = analyticsExportRows(overview, "interviews");
    const csv = rows.map((row) => spreadsheetSafe(row.value)).join("\n");
    assert.equal(csv.includes("507f1f77bcf86cd799439011"), false);
    assert.equal(rows.some((row) => row.metric.includes("Northwind Hiring")), true);
    assert.equal(spreadsheetSafe(String(overview.filters?.employer)).startsWith("'="), true);
  });

  it("restricts analytics view and export to reports access", () => {
    const jobsOnly = access(["jobs.view", "jobs.list.view", "jobs.list.export"]);
    assert.equal(canViewOperationsAnalytics(jobsOnly), false);
    assert.equal(canExportOperationsAnalytics(jobsOnly), false);
    const reports = access(["reports.view"]);
    assert.equal(canViewOperationsAnalytics(reports), true);
    assert.equal(canExportOperationsAnalytics(reports), true);
    assert.equal(canViewOperationsAnalytics(access([], true)), true);
  });

  it("publishes a definition for selected, joined, interviews, and job views", () => {
    for (const id of ["selected", "joined", "interviews-completed", "job-views"]) {
      const definition = ANALYTICS_KPI_DEFINITIONS[id];
      assert.ok(definition);
      assert.ok(definition.definition.length > 0);
      assert.ok(definition.method.length > 0);
      assert.ok(definition.source.length > 0);
      assert.ok(definition.dateField.length > 0);
      assert.ok(definition.filters.length > 0);
      assert.ok(definition.limitation.length > 0);
    }
    assert.match(ANALYTICS_KPI_DEFINITIONS["job-views"].definition, /not a count of every view event/i);
    assert.match(ANALYTICS_KPI_DEFINITIONS.joined.definition, /joined history event/i);
    assert.match(ANALYTICS_KPI_DEFINITIONS.selected.limitation, /not joined/i);
    assert.match(ANALYTICS_KPI_DEFINITIONS["interviews-completed"].limitation, /does not count as a completed interview/i);
  });
});
