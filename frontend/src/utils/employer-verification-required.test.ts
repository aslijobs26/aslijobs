import assert from "node:assert/strict";
import { AxiosError } from "axios";
import { describe, it } from "node:test";
import { EMPLOYER_VERIFICATION_REQUIRED_CODE } from "../constants/post-job";
import { readEmployerVerificationRequiredDetails } from "./employer-verification-required";

function verificationAxiosError(details: Record<string, unknown>) {
  return new AxiosError("Forbidden", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 403,
    statusText: "Forbidden",
    headers: {},
    config: { headers: {} } as never,
    data: {
      success: false,
      message: "Employer verification is required before publishing this job.",
      details,
    },
  });
}

describe("readEmployerVerificationRequiredDetails", () => {
  it("detects the structured verification-required code and draft metadata", () => {
    const result = readEmployerVerificationRequiredDetails(
      verificationAxiosError({
        code: EMPLOYER_VERIFICATION_REQUIRED_CODE,
        verificationStatus: "pending",
        draftSaved: true,
        jobId: "507f1f77bcf86cd799439011",
        jobPublicId: "AJ-2026-000001",
        status: "draft",
      }),
    );

    assert.equal(result.isVerificationRequired, true);
    assert.equal(result.draftSaved, true);
    assert.equal(result.draftJobId, "507f1f77bcf86cd799439011");
    assert.equal(result.jobPublicId, "AJ-2026-000001");
    assert.equal(result.verificationStatus, "pending");
    assert.equal(result.jobStatus, "draft");
  });

  it("maps rejected verification without matching arbitrary messages", () => {
    const result = readEmployerVerificationRequiredDetails(
      verificationAxiosError({
        code: EMPLOYER_VERIFICATION_REQUIRED_CODE,
        verificationStatus: "rejected",
      }),
    );

    assert.equal(result.isVerificationRequired, true);
    assert.equal(result.draftSaved, false);
    assert.equal(result.verificationStatus, "rejected");
    assert.equal(result.draftJobId, null);
  });

  it("does not treat unrelated API errors as a verification gate", () => {
    const result = readEmployerVerificationRequiredDetails(
      verificationAxiosError({
        code: "JOB_NOT_FOUND",
        draftSaved: true,
      }),
    );

    assert.equal(result.isVerificationRequired, false);
  });
});
