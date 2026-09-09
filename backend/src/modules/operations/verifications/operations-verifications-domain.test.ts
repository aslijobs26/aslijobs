import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatSlaAgeLabel,
  resolveEmployerIndustryLabel,
  resolveVerificationAllowedActions,
  resolveVerificationListStatus,
} from "./operations-verifications-domain.js";

describe("operations verifications domain", () => {
  it("resolves canonical industry labels from the employer catalog", () => {
    assert.equal(resolveEmployerIndustryLabel("it-software"), "IT & Software");
    assert.equal(
      resolveEmployerIndustryLabel("facility-management"),
      "Facilities Management",
    );
    assert.equal(resolveEmployerIndustryLabel(""), "Unspecified");
  });

  it("formats SLA age labels", () => {
    assert.equal(formatSlaAgeLabel(null), "—");
    assert.equal(
      formatSlaAgeLabel(
        "2026-09-01T00:00:00.000Z",
        "2026-09-02T00:00:00.000Z",
      ),
      "1 day",
    );
  });

  it("maps list operational status and allowed actions", () => {
    const underReview = resolveVerificationListStatus({
      verificationStatus: "pending",
      verificationSubmittedAt: "2026-09-04T00:00:00.000Z",
      documentsCount: 2,
      now: new Date("2026-09-05T12:00:00.000Z"),
    });
    assert.equal(underReview.statusLabel, "Under Review");
    assert.equal(underReview.operationalStatus, "under_review");

    const actions = resolveVerificationAllowedActions({
      verificationStatus: "under_review",
      canVerify: true,
      canReject: true,
      canViewDocuments: true,
      canDownloadDocuments: false,
    });
    assert.equal(actions.canApprove, true);
    assert.equal(actions.canRequestDocuments, true);
    assert.equal(actions.canDownloadDocuments, false);
  });

  it("blocks actions for terminal verification states", () => {
    const actions = resolveVerificationAllowedActions({
      verificationStatus: "verified",
      canVerify: true,
      canReject: true,
      canViewDocuments: true,
      canDownloadDocuments: true,
    });
    assert.equal(actions.canApprove, false);
    assert.equal(actions.canReject, false);
    assert.equal(actions.canRequestDocuments, false);
  });

  it("keeps unset verificationStatus pending even when registration is complete", () => {
    const open = resolveVerificationListStatus({
      verificationStatus: null,
      registrationStatus: "completed",
      documentsCount: 0,
      createdAt: "2026-09-05T00:00:00.000Z",
      now: new Date("2026-09-05T12:00:00.000Z"),
    });
    assert.equal(open.statusLabel, "Pending");
    assert.equal(open.operationalStatus, "needs_attention");
  });
});
