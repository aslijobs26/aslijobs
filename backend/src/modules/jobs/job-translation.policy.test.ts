import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canEnqueueJobTranslation,
  claimTranslationEnqueueSlot,
  isDuplicateKeyError,
  jobTranslationCacheKey,
  jobTranslationQueueJobId,
  parseConfiguredJobLanguages,
  releaseTranslationEnqueueSlot,
  shouldResetStoredTranslationTask,
  translationRetryDelayMs,
} from "./job-translation.policy.js";

describe("job translation queue policy", () => {
  it("keeps supported languages and drops unknown codes", () => {
    assert.deepEqual(parseConfiguredJobLanguages("te, hi, fr, te"), ["te", "hi"]);
    assert.deepEqual(parseConfiguredJobLanguages(""), ["en", "hi", "te", "ta", "kn", "ml"]);
  });

  it("backs off and then stops lengthening the delay", () => {
    assert.equal(translationRetryDelayMs(1), 30_000);
    assert.equal(translationRetryDelayMs(2), 60_000);
    assert.equal(translationRetryDelayMs(3), 120_000);
  });

  it("allows only one task while the same translation is pending, processing, or current", () => {
    assert.equal(canEnqueueJobTranslation(null), true);
    assert.equal(canEnqueueJobTranslation({ status: "pending", attempts: 0 }), false);
    assert.equal(canEnqueueJobTranslation({ status: "processing", attempts: 1 }), false);
    assert.equal(canEnqueueJobTranslation({ status: "completed", attempts: 1 }), false);
    assert.equal(
      canEnqueueJobTranslation({
        status: "failed",
        attempts: 3,
        nextAttemptAt: new Date(Date.now() + 60_000),
      }),
      false,
    );
    assert.equal(
      canEnqueueJobTranslation({
        status: "failed",
        attempts: 3,
        nextAttemptAt: new Date(Date.now() - 1_000),
      }),
      false,
    );
    assert.equal(
      canEnqueueJobTranslation({
        status: "failed",
        attempts: 1,
        nextAttemptAt: new Date(Date.now() - 1_000),
      }),
      true,
    );
  });

  it("claims one enqueue slot when many callers arrive together", () => {
    const key = "job-1:te:source";
    releaseTranslationEnqueueSlot(key);
    const claims = Array.from({ length: 100 }, () => claimTranslationEnqueueSlot(key));
    assert.equal(claims.filter(Boolean).length, 1);
    releaseTranslationEnqueueSlot(key);
    assert.equal(claimTranslationEnqueueSlot(key), true);
    releaseTranslationEnqueueSlot(key);
  });

  it("builds cache and queue ids without exposing secrets", () => {
    assert.equal(jobTranslationCacheKey("abc", "te"), "job:translation:abc:te");
    assert.equal(
      jobTranslationQueueJobId("abc", "te", "0123456789abcdefEXTRA", 2).includes(":"),
      false,
    );
    assert.equal(isDuplicateKeyError({ code: 11000 }), true);
    assert.equal(isDuplicateKeyError(new Error("no")), false);
  });

  it("resets completed tasks only when Mongo still needs that language", () => {
    assert.equal(shouldResetStoredTranslationTask("completed", true), true);
    assert.equal(shouldResetStoredTranslationTask("completed", false), false);
    assert.equal(shouldResetStoredTranslationTask("failed", true), false);
    assert.equal(shouldResetStoredTranslationTask("pending", true), false);
    assert.equal(shouldResetStoredTranslationTask("processing", true), false);
  });
});
