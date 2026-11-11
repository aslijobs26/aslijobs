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
      "ops-employers-v3",
    );
    assert.equal(
      selectTourForPath(OPERATIONS_TOURS, "/operations/employers/emp-1")?.id,
      "ops-employer-profile-v2",
    );
    assert.equal(
      selectTourForPath(OPERATIONS_TOURS, "/operations/candidates/cand-1")?.id,
      "ops-job-seeker-profile-v2",
    );
    assert.equal(selectTourForPath(OPERATIONS_TOURS, "/operations/inbox")?.id, "ops-inbox-v3");
    assert.equal(
      selectTourForPath(OPERATIONS_TOURS, "/operations/whatsapp-inbox")?.id,
      "ops-inbox-v3",
    );
    assert.equal(selectTourForPath(OPERATIONS_TOURS, "/operations/support-tickets"), null);
    assert.equal(
      selectTourForPath(OPERATIONS_TOURS, "/operations/employers/emp-1/extra"),
      null,
    );
  });

  it("routes every detail and sub-page to its own tour", () => {
    const idFor = (path: string) => selectTourForPath(OPERATIONS_TOURS, path)?.id;

    assert.equal(idFor("/operations/jobs/job-1"), "ops-job-detail-v2");
    assert.equal(idFor("/operations/jobs/post"), "ops-post-job-v2");
    assert.equal(idFor("/operations/placements/list"), "ops-placements-list-v2");
    assert.equal(idFor("/operations/placements/plc-1"), "ops-placement-detail-v2");
    assert.equal(idFor("/operations/team"), "ops-people-v2");
    assert.equal(idFor("/operations/teams"), "ops-teams-v2");
    assert.equal(idFor("/operations/teams/team-1"), "ops-team-detail-v2");
    assert.equal(idFor("/operations/roles"), "ops-roles-v2");
    assert.equal(idFor("/operations/roles/new"), "ops-role-editor-v2");
    assert.equal(idFor("/operations/roles/role-1/edit"), "ops-role-editor-v2");
    assert.equal(idFor("/operations/roles/role-1/preview"), undefined);
    assert.equal(idFor("/operations/departments"), "ops-departments-v2");
    assert.equal(idFor("/operations/settings"), "ops-settings-v2");
  });

  it("does not auto-start a broader tour on a form page", () => {
    const autoStart = (path: string) =>
      selectTourForPath(OPERATIONS_TOURS, path, { autoStartOnly: true })?.id ?? null;

    assert.equal(autoStart("/operations/jobs/post"), null);
    assert.equal(autoStart("/operations/roles/new"), null);
    assert.equal(autoStart("/operations/roles/role-1/edit"), null);
    assert.equal(autoStart("/operations/jobs/job-1"), "ops-job-detail-v2");
    assert.equal(autoStart("/operations/placements/list"), "ops-placements-list-v2");
  });

  it("walks the detail pages in page order", () => {
    const targetsFor = (path: string) =>
      selectTourForPath(OPERATIONS_TOURS, path)?.steps.map((step) => step.target);

    assert.deepEqual(targetsFor("/operations/candidates/cand-1"), [
      "ops-candidate-resume",
      "ops-candidate-tabs",
      "ops-candidate-application-actions",
      "ops-candidate-document-actions",
      "ops-activity-filters",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/employers/emp-1"), [
      "ops-employer-actions",
      "ops-employer-tabs",
      "ops-employer-jobs-toolbar",
      "ops-employer-document-actions",
      "ops-activity-filters",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/placements/plc-1"), [
      "ops-placement-joining",
      "ops-take-tour",
    ]);
  });

  it("walks only the Home controls people use", () => {
    const home = selectTourForPath(OPERATIONS_TOURS, "/operations/home");
    assert.equal(home?.id, "ops-home-v3");
    const targets = home?.steps.map((step) => step.target) ?? [];
    assert.deepEqual(targets, [
      "ops-home-ask-asli",
      "ops-home-attention",
      "ops-home-attention-tabs",
      "ops-home-quick-actions",
      "ops-take-tour",
    ]);
    assert.equal(selectTourForPath(OPERATIONS_TOURS, "/operations/home/extra"), null);
  });

  it("walks only the My Work controls people use", () => {
    const myWork = selectTourForPath(OPERATIONS_TOURS, "/operations/my-work");
    assert.equal(myWork?.id, "ops-my-work-v3");
    assert.deepEqual(
      myWork?.steps.map((step) => step.target),
      [
        "ops-my-work-actions",
        "ops-my-work-tabs",
        "ops-my-work-filters",
        "ops-my-work-row-actions",
        "ops-take-tour",
      ],
    );
    assert.equal(selectTourForPath(OPERATIONS_TOURS, "/operations/my-work/performance"), null);
  });

  it("walks each module list page in page order", () => {
    const targetsFor = (path: string) =>
      selectTourForPath(OPERATIONS_TOURS, path)?.steps.map((step) => step.target);

    assert.deepEqual(targetsFor("/operations/candidates"), [
      "ops-job-seekers-actions",
      "ops-job-seekers-tabs",
      "ops-job-seekers-filters",
      "ops-job-seekers-row-actions",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/employers"), [
      "ops-employers-actions",
      "ops-employers-tabs",
      "ops-employers-filters",
      "ops-employers-row-actions",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/verifications"), [
      "ops-verifications-actions",
      "ops-verifications-tabs",
      "ops-verifications-filters",
      "ops-verifications-row-actions",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/jobs"), [
      "ops-jobs-actions",
      "ops-jobs-tabs",
      "ops-jobs-filters",
      "ops-jobs-row-actions",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/placements"), [
      "ops-placements-actions",
      "ops-placements-tabs",
      "ops-placements-search",
      "ops-placements-row-actions",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/inbox"), [
      "ops-inbox-mode",
      "ops-inbox-search",
      "ops-inbox-filters",
      "ops-inbox-translate",
      "ops-inbox-bot",
      "ops-inbox-composer",
      "ops-take-tour",
    ]);
  });

  it("walks the management pages in page order", () => {
    const targetsFor = (path: string) =>
      selectTourForPath(OPERATIONS_TOURS, path)?.steps.map((step) => step.target);

    assert.deepEqual(targetsFor("/operations"), [
      "ops-dashboard-modules",
      "ops-dashboard-filters",
      "ops-dashboard-task-filters",
      "ops-dashboard-task-actions",
      "ops-dashboard-quick-actions",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/analytics"), [
      "ops-analytics-filters",
      "ops-analytics-tabs",
      "ops-analytics-report",
      "ops-take-tour",
    ]);
    assert.deepEqual(targetsFor("/operations/organization"), [
      "ops-org-actions",
      "ops-org-tabs",
      "ops-org-hierarchy",
      "ops-org-unit-actions",
      "ops-org-unit-tabs",
      "ops-take-tour",
    ]);
  });

  it("keeps Organization sub-page tours on the section tabs and the actions", () => {
    const targetsFor = (path: string) =>
      selectTourForPath(OPERATIONS_TOURS, path)?.steps.map((step) => step.target) ?? [];

    for (const path of [
      "/operations/team",
      "/operations/teams",
      "/operations/teams/team-1",
      "/operations/roles",
      "/operations/departments",
      "/operations/settings",
    ]) {
      const targets = targetsFor(path);
      assert.ok(targets.includes("ops-org-tabs"), path);
      assert.equal(targets.at(-1), "ops-take-tour", path);
      assert.ok(!targets.some((target) => target.startsWith("ops-nav-")), path);
    }
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
