import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OPERATIONS_TOURS } from "./operations-tours.ts";
import {
  readTourStatuses,
  selectTourForPath,
  writeTourStatus,
  type TourStateStore,
} from "./tour-state.ts";

function memoryStore(): TourStateStore {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe("operations product tours", () => {
  it("keeps list tours off detail pages and detail tours off lists", () => {
    assert.equal(
      selectTourForPath(OPERATIONS_TOURS, "/operations/employers")?.id,
      "ops-employers-v2",
    );
    assert.equal(
      selectTourForPath(OPERATIONS_TOURS, "/operations/employers/emp-1")?.id,
      "ops-employer-profile",
    );
    assert.equal(
      selectTourForPath(OPERATIONS_TOURS, "/operations/candidates/cand-1")?.id,
      "ops-job-seeker-profile",
    );
    assert.equal(selectTourForPath(OPERATIONS_TOURS, "/operations/inbox")?.id, "ops-inbox-v2");
    assert.equal(
      selectTourForPath(OPERATIONS_TOURS, "/operations/whatsapp-inbox")?.id,
      "ops-inbox-v2",
    );
    assert.equal(selectTourForPath(OPERATIONS_TOURS, "/operations/support-tickets"), null);
    assert.equal(
      selectTourForPath(OPERATIONS_TOURS, "/operations/employers/emp-1/extra"),
      null,
    );
  });

  it("routes every detail and sub-page to its own tour", () => {
    const idFor = (path: string) => selectTourForPath(OPERATIONS_TOURS, path)?.id;

    assert.equal(idFor("/operations/jobs/job-1"), "ops-job-detail");
    assert.equal(idFor("/operations/jobs/post"), "ops-post-job");
    assert.equal(idFor("/operations/placements/list"), "ops-placements-list");
    assert.equal(idFor("/operations/placements/plc-1"), "ops-placement-detail");
    assert.equal(idFor("/operations/team"), "ops-people");
    assert.equal(idFor("/operations/teams"), "ops-teams");
    assert.equal(idFor("/operations/teams/team-1"), "ops-team-detail");
    assert.equal(idFor("/operations/roles"), "ops-roles");
    assert.equal(idFor("/operations/roles/new"), "ops-role-editor");
    assert.equal(idFor("/operations/roles/role-1/edit"), "ops-role-editor");
    assert.equal(idFor("/operations/roles/role-1/preview"), undefined);
    assert.equal(idFor("/operations/departments"), "ops-departments");
    assert.equal(idFor("/operations/settings"), "ops-settings");
  });

  it("does not auto-start a broader tour on a form page", () => {
    const autoStart = (path: string) =>
      selectTourForPath(OPERATIONS_TOURS, path, { autoStartOnly: true })?.id ?? null;

    assert.equal(autoStart("/operations/jobs/post"), null);
    assert.equal(autoStart("/operations/roles/new"), null);
    assert.equal(autoStart("/operations/roles/role-1/edit"), null);
    assert.equal(autoStart("/operations/jobs/job-1"), "ops-job-detail");
    assert.equal(autoStart("/operations/placements/list"), "ops-placements-list");
  });

  it("walks the detail pages in page order", () => {
    const targetsFor = (path: string) =>
      selectTourForPath(OPERATIONS_TOURS, path)?.steps.map((step) => step.target);

    assert.deepEqual(targetsFor("/operations/candidates/cand-1"), [
      "ops-candidate-back",
      "ops-candidate-identity",
      "ops-candidate-contact",
      "ops-candidate-stats",
      "ops-candidate-resume",
      "ops-candidate-tabs",
      "ops-candidate-kpis",
      "ops-candidate-about",
      "ops-candidate-skills",
      "ops-candidate-education",
      "ops-candidate-interests",
      "ops-candidate-expected",
      "ops-candidate-applications",
      "ops-candidate-application-actions",
      "ops-candidate-applications-pagination",
      "ops-candidate-pref-interests",
      "ops-candidate-pref-skills",
      "ops-candidate-personal",
      "ops-candidate-experience",
      "ops-candidate-about-details",
      "ops-candidate-documents",
      "ops-candidate-document-actions",
      "ops-candidate-journey",
      "ops-candidate-activity-summary",
      "ops-activity-filters",
      "ops-activity-timeline",
      "ops-candidate-activity-pagination",
      "ops-nav-jobseekers",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/employers/emp-1"), [
      "ops-employer-back",
      "ops-employer-identity",
      "ops-employer-meta",
      "ops-employer-actions",
      "ops-employer-tabs",
      "ops-employer-kpis",
      "ops-employer-details",
      "ops-employer-about",
      "ops-employer-jobs-toolbar",
      "ops-employer-jobs-list",
      "ops-employer-jobs-pagination",
      "ops-employer-documents",
      "ops-employer-document-actions",
      "ops-employer-journey",
      "ops-employer-activity-summary",
      "ops-activity-filters",
      "ops-activity-timeline",
      "ops-employer-activity-pagination",
      "ops-nav-employers",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/placements/plc-1"), [
      "ops-placement-back",
      "ops-placement-header",
      "ops-placement-joining",
      "ops-placement-candidate",
      "ops-placement-job",
      "ops-placement-employer",
      "ops-placement-offer",
      "ops-placement-timeline",
      "ops-nav-placements",
      "ops-take-tour",
    ]);
  });

  it("walks every Home section in page order, once each", () => {
    const home = selectTourForPath(OPERATIONS_TOURS, "/operations/home");
    assert.equal(home?.id, "ops-home-v2");
    const targets = home?.steps.map((step) => step.target) ?? [];
    assert.deepEqual(targets, [
      "ops-home-greeting",
      "ops-home-ask-asli",
      "ops-home-pulse",
      "ops-home-attention",
      "ops-home-attention-tabs",
      "ops-home-attention-view-all",
      "ops-home-registrations",
      "ops-home-activity",
      "ops-home-insights",
      "ops-home-health",
      "ops-home-team",
      "ops-home-quick-actions",
      "ops-global-search",
      "ops-nav-home",
      "ops-take-tour",
    ]);
    assert.equal(selectTourForPath(OPERATIONS_TOURS, "/operations/home/extra"), null);
  });

  it("walks every My Work section in page order", () => {
    const myWork = selectTourForPath(OPERATIONS_TOURS, "/operations/my-work");
    assert.equal(myWork?.id, "ops-my-work-v2");
    assert.deepEqual(
      myWork?.steps.map((step) => step.target),
      [
        "ops-my-work-header",
        "ops-my-work-actions",
        "ops-my-work-kpis",
        "ops-my-work-tabs",
        "ops-my-work-filters",
        "ops-my-work-list",
        "ops-my-work-row-actions",
        "ops-my-work-pagination",
        "ops-my-work-focus",
        "ops-my-work-assistant",
        "ops-my-work-tip",
        "ops-nav-my-work",
        "ops-nav-inbox",
        "ops-take-tour",
      ],
    );
    assert.equal(selectTourForPath(OPERATIONS_TOURS, "/operations/my-work/performance"), null);
  });

  it("walks each module list page in page order", () => {
    const targetsFor = (path: string) =>
      selectTourForPath(OPERATIONS_TOURS, path)?.steps.map((step) => step.target);

    assert.deepEqual(targetsFor("/operations/candidates"), [
      "ops-job-seekers-header",
      "ops-job-seekers-actions",
      "ops-job-seekers-kpis",
      "ops-job-seekers-trend",
      "ops-job-seekers-funnel",
      "ops-job-seekers-language",
      "ops-job-seekers-location",
      "ops-job-seekers-experience",
      "ops-job-seekers-categories",
      "ops-job-seekers-tabs",
      "ops-job-seekers-filters",
      "ops-job-seekers-list",
      "ops-job-seekers-row-actions",
      "ops-job-seekers-pagination",
      "ops-job-seekers-quick-actions",
      "ops-job-seekers-assistant",
      "ops-nav-jobseekers",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/employers"), [
      "ops-employers-header",
      "ops-employers-actions",
      "ops-employers-kpis",
      "ops-employers-trend",
      "ops-employers-funnel",
      "ops-employers-hiring-locations",
      "ops-employers-location",
      "ops-employers-type",
      "ops-employers-account-types",
      "ops-employers-tabs",
      "ops-employers-filters",
      "ops-employers-list",
      "ops-employers-row-actions",
      "ops-employers-pagination",
      "ops-employers-quick-actions",
      "ops-employers-assistant",
      "ops-nav-employers",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/verifications"), [
      "ops-verifications-header",
      "ops-verifications-actions",
      "ops-verifications-kpis",
      "ops-verifications-tabs",
      "ops-verifications-trend",
      "ops-verifications-status",
      "ops-verifications-documents",
      "ops-verifications-industry",
      "ops-verifications-location",
      "ops-verifications-sla",
      "ops-verifications-filters",
      "ops-verifications-list",
      "ops-verifications-row-actions",
      "ops-verifications-pagination",
      "ops-verifications-quick-actions",
      "ops-verifications-assistant",
      "ops-nav-verifications",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/jobs"), [
      "ops-jobs-header",
      "ops-jobs-actions",
      "ops-jobs-kpis",
      "ops-jobs-trend",
      "ops-jobs-status",
      "ops-jobs-industry",
      "ops-jobs-location",
      "ops-jobs-roles",
      "ops-jobs-employment-type",
      "ops-jobs-tabs",
      "ops-jobs-filters",
      "ops-jobs-list",
      "ops-jobs-row-actions",
      "ops-jobs-quick-actions",
      "ops-jobs-assistant",
      "ops-nav-jobs",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/placements"), [
      "ops-placements-header",
      "ops-placements-actions",
      "ops-placements-kpis",
      "ops-placements-trend",
      "ops-placements-funnel",
      "ops-placements-category",
      "ops-placements-location",
      "ops-placements-joining",
      "ops-placements-time-to-join",
      "ops-placements-tabs",
      "ops-placements-search",
      "ops-placements-list",
      "ops-placements-row-actions",
      "ops-placements-pagination",
      "ops-placements-insights",
      "ops-placements-quick-actions",
      "ops-placements-assistant",
      "ops-nav-placements",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/inbox"), [
      "ops-inbox-list",
      "ops-inbox-mode",
      "ops-inbox-search",
      "ops-inbox-filters",
      "ops-inbox-conversations",
      "ops-inbox-thread",
      "ops-inbox-status",
      "ops-inbox-translate",
      "ops-inbox-bot",
      "ops-inbox-composer",
      "ops-inbox-contact",
      "ops-nav-inbox",
      "ops-take-tour",
    ]);
  });

  it("walks the management pages in page order", () => {
    const targetsFor = (path: string) =>
      selectTourForPath(OPERATIONS_TOURS, path)?.steps.map((step) => step.target);

    assert.deepEqual(targetsFor("/operations"), [
      "ops-dashboard-modules",
      "ops-dashboard-filters",
      "ops-dashboard-kpis",
      "ops-dashboard-trend",
      "ops-dashboard-location",
      "ops-dashboard-task-status",
      "ops-dashboard-team-performance",
      "ops-dashboard-tasks",
      "ops-dashboard-task-filters",
      "ops-dashboard-task-actions",
      "ops-dashboard-quick-actions",
      "ops-dashboard-teams",
      "ops-dashboard-alerts",
      "ops-dashboard-assistant",
      "ops-nav-operations-dashboard",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/analytics"), [
      "ops-analytics-header",
      "ops-analytics-filters",
      "ops-analytics-tabs",
      "ops-analytics-interviews",
      "ops-analytics-kpis",
      "ops-analytics-traffic",
      "ops-analytics-trends",
      "ops-analytics-insights",
      "ops-analytics-funnel",
      "ops-analytics-supply-demand",
      "ops-analytics-locations",
      "ops-analytics-placement",
      "ops-analytics-market",
      "ops-analytics-forecasts",
      "ops-analytics-report",
      "ops-nav-analytics",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/organization"), [
      "ops-org-header",
      "ops-org-actions",
      "ops-org-tabs",
      "ops-org-hierarchy",
      "ops-org-unit",
      "ops-org-unit-actions",
      "ops-org-unit-tabs",
      "ops-org-kpis",
      "ops-org-map",
      "ops-org-key-info",
      "ops-org-quick-actions",
      "ops-org-teams",
      "ops-org-people",
      "ops-nav-organization",
      "ops-take-tour",
    ]);
  });

  it("opens every Organization sub-page with its own header, then the section tabs", () => {
    const targetsFor = (path: string) =>
      selectTourForPath(OPERATIONS_TOURS, path)?.steps.map((step) => step.target) ?? [];

    for (const [path, first] of [
      ["/operations/team", "ops-people-header"],
      ["/operations/teams", "ops-teams-header"],
      ["/operations/teams/team-1", "ops-team-header"],
      ["/operations/roles", "ops-roles-header"],
      ["/operations/departments", "ops-departments-breadcrumb"],
    ] as const) {
      const targets = targetsFor(path);
      assert.equal(targets[0], first, path);
      assert.ok(targets.includes("ops-org-tabs"), path);
      assert.deepEqual(targets.slice(-2), ["ops-nav-organization", "ops-take-tour"], path);
    }
    assert.deepEqual(targetsFor("/operations/settings").slice(-2), [
      "ops-nav-settings",
      "ops-take-tour",
    ]);
  });

  it("uses a unique id for every tour", () => {
    const ids = OPERATIONS_TOURS.map((tour) => tour.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("stores tour status per operations user and nothing else", () => {
    const store = memoryStore();
    writeTourStatus(store, "ops:user-1", "ops-home", "skipped");
    assert.deepEqual(readTourStatuses(store, "ops:user-1"), { "ops-home": "skipped" });
    assert.deepEqual(readTourStatuses(store, "ops:user-2"), {});
  });
});
