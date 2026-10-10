import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveEmployerJobPostingAccess } from "./employer-job-posting-access";

describe("resolveEmployerJobPostingAccess", () => {
  it("allows verified employers", () => {
    assert.equal(resolveEmployerJobPostingAccess("verified"), "allowed");
    assert.equal(resolveEmployerJobPostingAccess("approved"), "allowed");
    assert.equal(resolveEmployerJobPostingAccess(" Verified "), "allowed");
  });

  it("blocks rejected and unverified employers from opening Post Job", () => {
    assert.equal(resolveEmployerJobPostingAccess("rejected"), "under_review");
    assert.equal(resolveEmployerJobPostingAccess("pending"), "under_review");
  });

  it("blocks pending, missing, and unknown statuses", () => {
    assert.equal(resolveEmployerJobPostingAccess("pending"), "under_review");
    assert.equal(resolveEmployerJobPostingAccess(""), "under_review");
    assert.equal(resolveEmployerJobPostingAccess(null), "under_review");
    assert.equal(resolveEmployerJobPostingAccess(undefined), "under_review");
    assert.equal(resolveEmployerJobPostingAccess("in_review"), "under_review");
  });
});
