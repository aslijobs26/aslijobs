import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { buildEmployerOwnedJobMatch } from "./employer-job-ownership.js";
import { jobIdParamsSchema } from "./job.validation.js";

const ownerId = "64f0000000000000000000aa";
const draftMongoId = "64f0000000000000000000cc";
const otherEmployerId = "64f0000000000000000000bb";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("employer job id from the incomplete-draft WhatsApp button", () => {
  it("accepts the literal {{1}} prefix and keeps the draft Mongo id", () => {
    for (const jobId of [
      draftMongoId,
      `{{1}}${draftMongoId}`,
      `%7B%7B1%7D%7D${draftMongoId}`,
    ]) {
      assert.deepEqual(jobIdParamsSchema.parse({ jobId }), {
        jobId: draftMongoId,
      });
    }
  });

  it("rejects a public job id, a truncated id, and a non-hex suffix", () => {
    for (const jobId of [
      "AJ-2026-000010",
      "{{1}}not-a-job",
      "{{1}}",
      "64f0000000000000000000",
      `{{2}}${draftMongoId}`,
    ]) {
      const result = jobIdParamsSchema.safeParse({ jobId });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.error.issues[0]?.message, "Invalid job id");
      }
    }
  });

  it("does not treat another employer's id as this employer's draft", () => {
    const parsed = jobIdParamsSchema.parse({
      jobId: `{{1}}${otherEmployerId}`,
    });
    assert.equal(parsed.jobId, otherEmployerId);
    const match = JSON.stringify(buildEmployerOwnedJobMatch(ownerId));
    assert.equal(match.includes(otherEmployerId), false);
    assert.equal(match.includes(ownerId), true);
  });

  it("uses the same id validator for fetch, draft save, and submit", () => {
    const routes = source("./job.routes.ts");
    assert.match(routes, /jobRouter\.get\(\s*"\/:jobId"/);
    assert.match(routes, /jobRouter\.patch\(\s*"\/:jobId\/draft"/);
    assert.match(routes, /jobRouter\.put\(\s*"\/:jobId\/publish"/);
    assert.equal(
      routes.match(/validate\(jobIdParamsSchema, "params"\)/g)?.length,
      6,
    );
  });

  it("loads an owned draft without requiring it to be published", () => {
    const service = source("./job.service.ts");
    const lookupStart = service.indexOf("private async findOwnedJobOrThrow");
    const lookupEnd = service.indexOf("return job;", lookupStart);
    const lookup = service.slice(lookupStart, lookupEnd);
    assert.match(lookup, /_id: jobMongoId/);
    assert.match(lookup, /buildEmployerOwnedJobMatch\(employerId\)/);
    assert.equal(lookup.includes("status"), false);

    const updateStart = service.indexOf("async updateDraft(");
    const updateEnd = service.indexOf("async publishDraft(");
    const update = service.slice(updateStart, updateEnd);
    assert.match(update, /job\.status !== "draft"/);

    const publishStart = updateEnd;
    const publishEnd = service.indexOf("async updateActiveJob(");
    const publish = service.slice(publishStart, publishEnd);
    assert.match(
      publish,
      /job\.status !== "draft" && job\.status !== "rejected"/,
    );
    assert.match(publish, /job\.status = "pending_approval"/);
  });
});
