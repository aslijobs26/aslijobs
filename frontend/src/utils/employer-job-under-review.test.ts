import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getEmployerFacingJobStatusLabel,
  resolveEmployerJobUiPhase,
} from "./employer-job-under-review";

describe("employer-job-under-review status mapping", () => {
  it("maps pending_approval to under_review / Under Review", () => {
    const job = {
      status: "pending_approval" as const,
      liveChangeReviewStatus: "",
    };
    assert.equal(resolveEmployerJobUiPhase(job), "under_review");
    assert.equal(getEmployerFacingJobStatusLabel(job), "Under Review");
  });

  it("maps active to live", () => {
    const job = { status: "active" as const, liveChangeReviewStatus: "" };
    assert.equal(resolveEmployerJobUiPhase(job), "live");
    assert.equal(getEmployerFacingJobStatusLabel(job), "Live");
  });

  it("maps rejected to rejected", () => {
    const job = { status: "rejected" as const, liveChangeReviewStatus: "" };
    assert.equal(resolveEmployerJobUiPhase(job), "rejected");
    assert.equal(getEmployerFacingJobStatusLabel(job), "Rejected");
  });

  it("maps live change pending_approval separately", () => {
    const job = {
      status: "active" as const,
      liveChangeReviewStatus: "pending_approval",
    };
    assert.equal(resolveEmployerJobUiPhase(job), "live_change_review");
  });

  it("never labels pending_approval as Live", () => {
    const job = {
      status: "pending_approval" as const,
      liveChangeReviewStatus: "",
    };
    assert.notEqual(getEmployerFacingJobStatusLabel(job), "Live");
  });
});
