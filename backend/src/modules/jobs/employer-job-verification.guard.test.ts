import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppError } from "../../middleware/error.middleware.js";
import {
  assertEmployerVerifiedForJobAction,
  EMPLOYER_VERIFICATION_REQUIRED_CODE,
  isEmployerCreatedJobSource,
  isEmployerVerifiedForJobs,
  resolveEmployerVerificationStatus,
} from "./employer-job-verification.guard.js";
import { isJobPubliclyEligible } from "./public-job-eligibility.js";

describe("employer job verification guard", () => {
  it("treats null/empty verification as pending", () => {
    assert.equal(resolveEmployerVerificationStatus(null), "pending");
    assert.equal(resolveEmployerVerificationStatus({}), "pending");
    assert.equal(
      resolveEmployerVerificationStatus({ verificationStatus: "" }),
      "pending",
    );
  });

  it("accepts verified and approved synonyms", () => {
    assert.equal(
      resolveEmployerVerificationStatus({ verificationStatus: "verified" }),
      "verified",
    );
    assert.equal(
      resolveEmployerVerificationStatus({ verificationStatus: "approved" }),
      "verified",
    );
    assert.equal(
      isEmployerVerifiedForJobs({ verificationStatus: "verified" }),
      true,
    );
  });

  it("blocks pending and rejected employers for submit", () => {
    for (const status of ["pending", "rejected"] as const) {
      assert.throws(
        () =>
          assertEmployerVerifiedForJobAction(
            { verificationStatus: status },
            "submit",
          ),
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.statusCode, 403);
          assert.equal(
            (error.details as { code?: string } | undefined)?.code,
            EMPLOYER_VERIFICATION_REQUIRED_CODE,
          );
          return true;
        },
      );
    }
  });

  it("allows verified employers for submit/publish/approve actions", () => {
    assert.doesNotThrow(() =>
      assertEmployerVerifiedForJobAction(
        { verificationStatus: "verified" },
        "submit",
      ),
    );
    assert.doesNotThrow(() =>
      assertEmployerVerifiedForJobAction(
        { verificationStatus: "verified" },
        "operations_approve",
      ),
    );
  });

  it("does not treat client spoofed operations source as trusted for employer jobs", () => {
    assert.equal(isEmployerCreatedJobSource("employer"), true);
    assert.equal(isEmployerCreatedJobSource(undefined), true);
    assert.equal(isEmployerCreatedJobSource("operations"), false);
  });
});

describe("public job eligibility", () => {
  it("hides employer-created active jobs when employer is unverified", () => {
    assert.equal(
      isJobPubliclyEligible({
        creationSource: "employer",
        employer: { verificationStatus: "pending" },
      }),
      false,
    );
    assert.equal(
      isJobPubliclyEligible({
        creationSource: "employer",
        employer: { verificationStatus: "rejected" },
      }),
      false,
    );
  });

  it("shows employer-created jobs when employer is verified", () => {
    assert.equal(
      isJobPubliclyEligible({
        creationSource: "employer",
        employer: { verificationStatus: "verified" },
      }),
      true,
    );
  });

  it("keeps operations-created jobs publicly eligible without employer verification", () => {
    assert.equal(
      isJobPubliclyEligible({
        creationSource: "operations",
        employer: { verificationStatus: "pending" },
      }),
      true,
    );
  });
});

describe("unverified employer → submit → ops approve chain (unit gates)", () => {
  it("blocks the audited unsafe chain at both submit and approve gates", () => {
    const unverified = { verificationStatus: "pending" as const };

    assert.throws(() =>
      assertEmployerVerifiedForJobAction(unverified, "submit"),
    );

    assert.throws(() =>
      assertEmployerVerifiedForJobAction(unverified, "operations_approve"),
    );

    assert.equal(
      isJobPubliclyEligible({
        creationSource: "employer",
        employer: unverified,
      }),
      false,
    );
  });
});
