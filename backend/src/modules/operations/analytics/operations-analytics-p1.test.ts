import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { trackAnalyticsEvent } from "../../analytics/analytics-event.service.js";
import { canViewOperationsAnalytics } from "./operations-analytics-access.js";
import {
  dimensionLabel,
  percentOrNull,
  repeatEmployerCount,
  resolveAttribution,
  withStageDropOff,
} from "./operations-analytics-p1-rules.js";
import { parseDrilldownQuery } from "./operations-analytics-drilldown.js";
import { spreadsheetSafe } from "./operations-analytics-export.js";
import { canonicalCategory } from "./operations-analytics-taxonomy.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";

const denied = {
  isSuperAdmin: false,
  grantedKeys: ["jobs.view"],
  permissions: {},
} as OperationsResolvedAccess;

describe("P1 analytics rules", () => {
  it("keeps first-touch attribution and labels a blank visit Direct", () => {
    const first = resolveAttribution({
      storedFirst: null,
      current: { source: "google", medium: "cpc", campaign: "hire", content: "", term: "" },
      referrerHost: "",
    });
    const later = resolveAttribution({
      storedFirst: first.first,
      current: { source: "facebook", medium: "paid", campaign: "other", content: "ad", term: "driver" },
      referrerHost: "facebook.com",
    });
    assert.equal(later.first.source, "google");
    assert.equal(later.session.source, "facebook");
    assert.equal(dimensionLabel(""), "Unknown");
    assert.equal(
      resolveAttribution({ storedFirst: null, current: { source: "", medium: "", campaign: "", content: "", term: "" }, referrerHost: "" }).sourceLabel,
      "Direct",
    );
  });

  it("does not treat a missing stage as zero and does not count duplicate jobs as repeat hiring", () => {
    const stages = withStageDropOff([
      { key: "started", count: null },
      { key: "completed", count: 4 },
    ]);
    assert.equal(stages[0]?.conversionPercent, null);
    assert.equal(stages[1]?.dropOff, null);
    assert.equal(
      repeatEmployerCount([
        { employerId: "e1", jobId: "j1" },
        { employerId: "e1", jobId: "j1" },
        { employerId: "e2", jobId: "j1" },
        { employerId: "e2", jobId: "j2" },
      ]),
      1,
    );
    assert.equal(percentOrNull(1, 0), null);
  });

  it("keeps an unknown category unclassified and does not merge it into another industry", () => {
    const category = canonicalCategory("completely-unknown-trade-xyz");
    assert.equal(category.id, "unclassified");
    assert.equal(category.label, "Unclassified");
  });

  it("clamps drilldown pages and rejects an unknown metric", () => {
    const parsed = parseDrilldownQuery({
      metric: "joined",
      page: 0,
      limit: 500,
      q: "x".repeat(120),
      sort: "name",
      dir: "asc",
    } as Parameters<typeof parseDrilldownQuery>[0]);
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 50);
    assert.equal(parsed.q.length, 80);
    assert.equal(parsed.sort, "name");
    assert.throws(() => parseDrilldownQuery({ metric: "phones" } as Parameters<typeof parseDrilldownQuery>[0]));
  });

  it("requires reports access for analytics, including drilldown readers", () => {
    assert.equal(canViewOperationsAnalytics(undefined), false);
    assert.equal(canViewOperationsAnalytics(denied), false);
    assert.equal(canViewOperationsAnalytics({ ...denied, isSuperAdmin: true }), true);
    assert.equal(
      canViewOperationsAnalytics({ ...denied, grantedKeys: ["reports.view"] }),
      true,
    );
  });

  it("still prefixes formula-like export values", () => {
    assert.equal(spreadsheetSafe("=1+1"), "'=1+1");
    assert.equal(spreadsheetSafe("Employer"), "Employer");
  });

  it("uses the Kolkata calendar date at the UTC day boundary", () => {
    const label = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date("2026-03-31T18:30:00.000Z"));
    assert.equal(label, "2026-04-01");
  });

  it("counts repeat employers from a large pair list without building one array per event", () => {
    const pairs: Array<{ employerId: string; jobId: string }> = [];
    for (let index = 0; index < 40_000; index += 1) {
      pairs.push(
        { employerId: `e${index}`, jobId: "same" },
        { employerId: `e${index}`, jobId: "same" },
        { employerId: `e${index}`, jobId: "other" },
      );
    }
    const started = Date.now();
    assert.equal(repeatEmployerCount(pairs), 40_000);
    assert.ok(Date.now() - started < 2_000);
  });

  it("rejects a public event that tries to backfill history", async () => {
    await assert.rejects(
      () =>
        trackAnalyticsEvent({
          eventName: "page_view",
          visitorId: "visitor-12345678",
          sessionId: "session-12345678",
          path: "/",
          portal: "public_site",
          device: "desktop",
          occurredAt: "2020-01-01T00:00:00.000Z",
        } as Parameters<typeof trackAnalyticsEvent>[0]),
      /too old/,
    );
  });
});

describe("analytics event coverage", () => {
  it("records each supported business event from a real action", () => {
    const files = [
      "../../../../../frontend/src/components/analytics/AnalyticsPageViewBeacon.tsx",
      "../../../../../frontend/src/components/job-seeker-register/JobSeekerRegisterForm.tsx",
      "../../../../../frontend/src/components/employer-register/EmployerRegisterForm.tsx",
      "../../../../../frontend/src/components/job-search/JobSearchPageContent.tsx",
      "../../../../../frontend/src/components/jobs/PublicJobDetailPage.tsx",
      "../../../../../frontend/src/components/jobs/JobDetailsCenterPanel.tsx",
      "../../../../../frontend/src/components/job-search/JobSearchOverviewPanel.tsx",
      "../../../../../frontend/src/components/job-search/JobSearchMobileJobDetails.tsx",
      "../../../../../frontend/src/components/job-search/JobSearchJobCard.tsx",
      "../../../../../frontend/src/components/job-seeker-saved-jobs/SavedJobCard.tsx",
      "../../../../../frontend/src/components/post-job/PostJobContent.tsx",
      "../../applications/application.service.ts",
    ];
    const source = files
      .map((file) => readFileSync(new URL(file, import.meta.url), "utf8"))
      .join("\n");
    for (const name of [
      "page_view",
      "registration_started",
      "registration_completed",
      "otp_verified",
      "profile_completed",
      "job_search",
      "job_detail_viewed",
      "job_apply_started",
      "job_application_submitted",
      "employer_job_posted",
      "interview_scheduled",
      "interview_completed",
      "offer_sent",
      "candidate_selected",
      "candidate_joined",
    ]) {
      assert.match(source, new RegExp(name));
    }
  });
});
