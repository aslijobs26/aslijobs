import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPublicEmployerVerificationStages } from "./public-job-eligibility.js";

describe("buildPublicEmployerVerificationStages", () => {
  it("returns a $lookup-based safety filter (to apply after pagination)", () => {
    const stages = buildPublicEmployerVerificationStages();
    assert.ok(stages.length >= 3);
    const lookup = stages[0] as { $lookup?: { from?: string } };
    assert.equal(typeof lookup.$lookup?.from, "string");
  });
});
