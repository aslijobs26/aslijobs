import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertEmployerStatusChangeAllowed,
  getAllowedEmployerStatusTransitions,
  isEmployerTerminalStatus,
  isStatusBeforeInterviewScheduled,
  isValidEmployerStatusTransition,
  resolveStatusBeforeInterview,
} from "./employer-status-transition.js";

describe("employer status transition — did_not_join", () => {
  it("treats did_not_join as a terminal status", () => {
    assert.equal(isEmployerTerminalStatus("did_not_join"), true);
    assert.deepEqual(getAllowedEmployerStatusTransitions("did_not_join"), []);
  });

  it("allows selected → did_not_join", () => {
    assert.equal(
      isValidEmployerStatusTransition("selected", "did_not_join"),
      true,
    );
    assert.doesNotThrow(() =>
      assertEmployerStatusChangeAllowed("selected", "did_not_join"),
    );
  });

  it("blocks did_not_join from non-selected statuses", () => {
    assert.equal(
      isValidEmployerStatusTransition("offer_sent", "did_not_join"),
      false,
    );
    assert.throws(
      () => assertEmployerStatusChangeAllowed("offer_sent", "did_not_join"),
      /Invalid status transition/i,
    );
    assert.throws(
      () => assertEmployerStatusChangeAllowed("joined", "did_not_join"),
      /final status|cannot be updated/i,
    );
  });

  it("allows selected → joined alongside did_not_join", () => {
    const allowed = getAllowedEmployerStatusTransitions("selected");
    assert.ok(allowed.includes("joined"));
    assert.ok(allowed.includes("did_not_join"));
  });
});

describe("employer status transition — interview scheduling", () => {
  it("treats pre-interview stages as eligible to advance to interview_scheduled", () => {
    assert.equal(isStatusBeforeInterviewScheduled("submitted"), true);
    assert.equal(isStatusBeforeInterviewScheduled("shortlisted"), true);
    assert.equal(isStatusBeforeInterviewScheduled("interview_scheduled"), false);
    assert.equal(isStatusBeforeInterviewScheduled("offer_sent"), false);
    assert.equal(isStatusBeforeInterviewScheduled("rejected"), false);
  });

  it("still blocks direct status updates to interview_scheduled", () => {
    assert.throws(
      () => assertEmployerStatusChangeAllowed("shortlisted", "interview_scheduled"),
      /Schedule an interview/i,
    );
  });

  it("restores the latest pre-interview stage on cancellation", () => {
    assert.equal(
      resolveStatusBeforeInterview([
        { status: "submitted" },
        { status: "under_review" },
        { status: "shortlisted" },
        { status: "interview_scheduled" },
      ]),
      "shortlisted",
    );
    assert.equal(
      resolveStatusBeforeInterview([
        { status: "submitted" },
        { status: "interview_scheduled" },
      ]),
      "submitted",
    );
  });

  it("falls back to shortlisted when history has no pre-interview stage", () => {
    assert.equal(
      resolveStatusBeforeInterview([{ status: "interview_scheduled" }]),
      "shortlisted",
    );
    assert.equal(resolveStatusBeforeInterview([]), "shortlisted");
  });
});
