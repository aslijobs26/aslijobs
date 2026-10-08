import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PENDING_VERIFICATION_FILTER } from "../operations/verifications/operations-verifications-analytics.js";
import {
  documentUploadLeavesEmployerRejected,
  employerResubmitFieldErrors,
  type EmployerResubmitSnapshot,
} from "./employer-verification-resubmit.policy.js";

const readyCompany: EmployerResubmitSnapshot = {
  accountType: "company",
  isProfileComplete: true,
  registrationStatus: "completed",
  isWhatsappVerified: true,
  companyName: "Acme Pvt Ltd",
  industry: "it",
  businessCategory: "software",
  companyAddress: "1 Road",
  pincode: "500001",
  city: "Hyderabad",
  state: "Telangana",
};

describe("employer resubmission rules", () => {
  it("accepts a completed rejected company profile with a document", () => {
    assert.deepEqual(employerResubmitFieldErrors(readyCompany, 1), {});
  });

  it("keeps the employer rejected when required profile details or documents are missing", () => {
    const errors = employerResubmitFieldErrors(
      { ...readyCompany, companyName: "", isProfileComplete: false },
      0,
    );
    assert.ok(errors.companyName);
    assert.ok(errors.profile);
    assert.ok(errors.document);
  });

  it("does not move a rejected employer to review just because a document was replaced", () => {
    assert.equal(documentUploadLeavesEmployerRejected("rejected"), true);
    assert.equal(documentUploadLeavesEmployerRejected("pending"), false);
    assert.equal(documentUploadLeavesEmployerRejected("verified"), false);
  });

  it("matches resubmitted pending employers to the existing verification queue", () => {
    const filter = PENDING_VERIFICATION_FILTER.$or as Array<Record<string, unknown>>;
    assert.ok(
      filter.some(
        (clause) => clause.verificationStatus === "pending",
      ),
    );
    assert.equal(
      filter.some((clause) => clause.verificationStatus === "rejected"),
      false,
    );
  });
});
