import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EMPLOYER_TOURS } from "./employer-tours";
import { JOB_SEARCH_TOURS, JOB_SEEKER_TOURS } from "./job-seeker-tours";
import {
  readTourStatuses,
  selectTourForPath,
  writeTourStatus,
  type TourStateStore,
} from "./tour-state";

function memoryStore(): TourStateStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe("product tour state", () => {
  it("stores only completed or skipped for one account", () => {
    const store = memoryStore();
    writeTourStatus(store, "seeker:abc123", "seeker-workspace", "completed");
    writeTourStatus(store, "seeker:abc123", "seeker-applications", "skipped");
    writeTourStatus(store, "employer:abc123", "employer-overview", "completed");

    assert.deepEqual(readTourStatuses(store, "seeker:abc123"), {
      "seeker-workspace": "completed",
      "seeker-applications": "skipped",
    });
    assert.deepEqual(readTourStatuses(store, "employer:abc123"), {
      "employer-overview": "completed",
    });
  });

  it("rejects account keys and tour ids that are not tour state", () => {
    const store = memoryStore();
    writeTourStatus(store, "seeker:user@example.com", "seeker-workspace", "completed");
    writeTourStatus(store, "seeker:abc", "not a tour", "completed");
    assert.equal(store.data.size, 0);
  });

  it("ignores malformed stored values", () => {
    const store = memoryStore();
    store.setItem(
      "aslijobs.product-tours.v1.seeker:abc",
      JSON.stringify({ "seeker-workspace": "completed", phone: "999", "bad id": "skipped" }),
    );
    assert.deepEqual(readTourStatuses(store, "seeker:abc"), {
      "seeker-workspace": "completed",
    });
  });
});

describe("product tour route selection", () => {
  it("gives every job seeker page its own tour", () => {
    const expected: Record<string, string> = {
      "/job-seeker/profile": "seeker-workspace-v2",
      "/job-seeker/applied-jobs": "seeker-applications-v2",
      "/job-seeker/applied-jobs/app-1": "seeker-application-detail",
      "/job-seeker/my-resume": "seeker-resume-v2",
      "/job-seeker/saved-jobs": "seeker-saved-jobs-v2",
      "/job-seeker/notifications": "seeker-notifications-v2",
      "/job-seeker/settings": "seeker-settings-v2",
      "/job-seeker/help-support": "seeker-help-support",
    };
    for (const [path, tourId] of Object.entries(expected)) {
      assert.equal(
        selectTourForPath(JOB_SEEKER_TOURS, path, { autoStartOnly: true })?.id,
        tourId,
        path,
      );
    }
    assert.equal(selectTourForPath(JOB_SEEKER_TOURS, "/job-seeker/applied-jobs/app-1/x"), null);
  });

  it("does not run the job search tour on a job detail page", () => {
    assert.equal(selectTourForPath(JOB_SEARCH_TOURS, "/jobs")?.id, "seeker-job-search-v2");
    assert.equal(selectTourForPath(JOB_SEARCH_TOURS, "/jobs/AJ-2026-000054"), null);
  });

  it("gives every employer page its own tour", () => {
    const expected: Record<string, string> = {
      "/employer/dashboard": "employer-overview-v2",
      "/employer/jobs": "employer-jobs-v2",
      "/employer/jobs/job-1/under-review": "employer-job-under-review",
      "/employer/candidates": "employer-candidates-v2",
      "/employer/candidates/app-1": "employer-candidate-detail",
      "/employer/saved-candidates": "employer-shortlist-v2",
      "/employer/interviews": "employer-interviews-v2",
      "/employer/messages": "employer-messages-v2",
      "/employer/notifications": "employer-notifications",
      "/employer/company-profile": "employer-company-profile-v2",
      "/employer/settings": "employer-settings-v2",
      "/employer/team-management": "employer-team-v2",
      "/employer/team-management/members/m-1": "employer-team-member-detail",
      "/employer/team-management/roles/r-1": "employer-team-role-detail",
      "/employer/team-management/departments/d-1": "employer-team-department-detail",
      "/employer/team-member/profile": "employer-my-profile",
    };
    for (const [path, tourId] of Object.entries(expected)) {
      assert.equal(
        selectTourForPath(EMPLOYER_TOURS, path, { autoStartOnly: true })?.id,
        tourId,
        path,
      );
    }
  });

  it("skips the posting form and the placeholder pages", () => {
    assert.equal(selectTourForPath(EMPLOYER_TOURS, "/employer/jobs/job-1"), null);
    assert.equal(selectTourForPath(EMPLOYER_TOURS, "/post-job"), null);
    assert.equal(selectTourForPath(EMPLOYER_TOURS, "/employer/campaigns"), null);
    assert.equal(selectTourForPath(EMPLOYER_TOURS, "/employer/subscription"), null);
    assert.equal(selectTourForPath(EMPLOYER_TOURS, "/employer/help-center"), null);
  });
});

describe("product tour definitions", () => {
  const all = [...EMPLOYER_TOURS, ...JOB_SEEKER_TOURS, ...JOB_SEARCH_TOURS];

  it("uses unique, storable tour ids", () => {
    const ids = all.map((tour) => tour.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) {
      assert.match(id, /^[a-z0-9-]{3,80}$/);
    }
  });

  it("ends every tour with the replay step and never repeats a target", () => {
    for (const tour of all) {
      const targets = tour.steps.map((step) => step.target);
      assert.equal(targets.at(-1), "take-tour", tour.id);
      assert.equal(new Set(targets).size, targets.length, tour.id);
    }
  });
});
