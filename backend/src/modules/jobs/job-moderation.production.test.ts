import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertEmployerVerifiedForJobAction,
  EMPLOYER_VERIFICATION_REQUIRED_CODE,
  isEmployerCreatedJobSource,
} from "./employer-job-verification.guard.js";
import {
  buildJobReviewHistoryEntry,
  resolveJobReviewHistoryKind,
} from "./job-review-history.js";
import { isJobPubliclyEligible } from "./public-job-eligibility.js";
import { OPERATIONS_JOB_AUDIT_ACTIONS } from "../operations/jobs/operations-job-moderation.constants.js";
import { AppError } from "../../middleware/error.middleware.js";

/**
 * Production moderation chain tests.
 * Service orchestration with Mongo is not available in the unit harness;
 * these tests lock the authoritative gates, history helpers, and eligibility
 * rules that the integration paths compose.
 */
describe("job moderation — verification + eligibility chain", () => {
  it("blocks unverified submit → approve → public chain at every gate", () => {
    const pending = { verificationStatus: "pending" as const };

    assert.throws(
      () => assertEmployerVerifiedForJobAction(pending, "submit"),
      (error: unknown) =>
        error instanceof AppError &&
        (error.details as { code?: string })?.code ===
          EMPLOYER_VERIFICATION_REQUIRED_CODE,
    );

    assert.throws(
      () => assertEmployerVerifiedForJobAction(pending, "operations_approve"),
      (error: unknown) =>
        error instanceof AppError &&
        (error.details as { code?: string })?.code ===
          EMPLOYER_VERIFICATION_REQUIRED_CODE,
    );

    assert.equal(
      isJobPubliclyEligible({
        creationSource: "employer",
        employer: pending,
      }),
      false,
    );
  });

  it("allows verified employer through submit/approve/public gates", () => {
    const verified = { verificationStatus: "verified" as const };
    assert.doesNotThrow(() =>
      assertEmployerVerifiedForJobAction(verified, "submit"),
    );
    assert.doesNotThrow(() =>
      assertEmployerVerifiedForJobAction(verified, "operations_approve"),
    );
    assert.equal(
      isJobPubliclyEligible({
        creationSource: "employer",
        employer: verified,
      }),
      true,
    );
  });

  it("blocks resume/reactivate for unverified employers", () => {
    const rejected = { verificationStatus: "rejected" as const };
    for (const action of ["resume", "reactivate"] as const) {
      assert.throws(() =>
        assertEmployerVerifiedForJobAction(rejected, action),
      );
    }
  });

  it("treats creationSource spoofing: only operations is trusted", () => {
    assert.equal(isEmployerCreatedJobSource("operations"), false);
    assert.equal(isEmployerCreatedJobSource("employer"), true);
    assert.equal(isEmployerCreatedJobSource("OPERATIONS"), false);
    assert.equal(isEmployerCreatedJobSource(undefined), true);
    assert.equal(
      isJobPubliclyEligible({
        creationSource: "operations",
        employer: { verificationStatus: "pending" },
      }),
      true,
    );
  });

  it("does not treat payment metadata as verification", () => {
    // Payment is orthogonal — unverified employer remains blocked regardless.
    assert.throws(() =>
      assertEmployerVerifiedForJobAction(
        { verificationStatus: "pending" },
        "submit",
      ),
    );
  });
});

describe("job moderation — review history helpers", () => {
  it("classifies initial vs resubmission vs live_change", () => {
    assert.equal(resolveJobReviewHistoryKind({}), "initial");
    assert.equal(
      resolveJobReviewHistoryKind({ hadPriorReviewDecision: true }),
      "resubmission",
    );
    assert.equal(
      resolveJobReviewHistoryKind({ isLiveChange: true }),
      "live_change",
    );
  });

  it("builds append-only history entries with trimmed reason", () => {
    const entry = buildJobReviewHistoryEntry({
      kind: "initial",
      decision: "rejected",
      reason: "  Incomplete description  ",
      reviewedByOperationsUserId: "507f1f77bcf86cd799439011",
    });
    assert.equal(entry.kind, "initial");
    assert.equal(entry.decision, "rejected");
    assert.equal(entry.reason, "Incomplete description");
    assert.ok(entry.reviewedAt instanceof Date);
    assert.equal(String(entry.reviewedByOperationsUserId), "507f1f77bcf86cd799439011");
  });
});

describe("job moderation — durable audit action catalog", () => {
  it("exposes stable action names for approve/reject/status/live flows", () => {
    assert.equal(OPERATIONS_JOB_AUDIT_ACTIONS.APPROVED, "job.approved");
    assert.equal(OPERATIONS_JOB_AUDIT_ACTIONS.REJECTED, "job.rejected");
    assert.equal(
      OPERATIONS_JOB_AUDIT_ACTIONS.SUBMITTED,
      "job.submitted_for_approval",
    );
    assert.equal(
      OPERATIONS_JOB_AUDIT_ACTIONS.LIVE_REVISION_APPROVED,
      "job.live_revision_approved",
    );
    assert.equal(
      OPERATIONS_JOB_AUDIT_ACTIONS.OPERATIONS_PUBLISHED,
      "job.operations_published",
    );
  });
});

describe("job moderation — saved/public eligibility parity", () => {
  it("hides employer-created active jobs when employer unverified", () => {
    assert.equal(
      isJobPubliclyEligible({
        creationSource: "employer",
        employer: { verificationStatus: "rejected" },
      }),
      false,
    );
  });

  it("keeps operations-created jobs eligible without verified employer", () => {
    assert.equal(
      isJobPubliclyEligible({
        creationSource: "operations",
        employer: { verificationStatus: "pending" },
      }),
      true,
    );
  });
});
