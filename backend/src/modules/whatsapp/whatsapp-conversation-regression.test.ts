import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyAccountAwareIntent,
  understandLocally,
  unknownUserAction,
} from "./whatsapp-bot.logic.js";
import { buildResumeExtractSummary } from "./whatsapp-media-messages.js";

describe("conversation regression: resume then electrician jobseeker", () => {
  it("Scenario A — resume reply offers next steps, not only a profile link", () => {
    const reply = buildResumeExtractSummary({
      language: "en",
      skills: ["excel", "accounting"],
      missingHints: ["phone"],
      truncated: false,
      profileUrl: "https://aslijobs.com/job-seeker/profile",
    });
    assert.match(reply, /resume has been received/i);
    assert.match(reply, /Excel/i);
    assert.match(reply, /Find jobs matching my resume|What would you like to do next/i);
    assert.doesNotMatch(reply, /^Complete your profile:/m);
    assert.doesNotMatch(reply, /OCR|LLM|deterministic/i);
  });

  it("Scenario B — electrician jobseeker is JOB_SEARCH; employers are role-gated", () => {
    const text = "i wnat electrician jobseeker";
    for (const account of ["none", "seeker", "employer", "both"] as const) {
      const mapped = applyAccountAwareIntent(understandLocally(text), account);
      assert.equal(mapped.intent, "JOB_SEARCH", account);
      assert.equal(mapped.category, "Electrician", account);
      if (account === "employer") {
        assert.equal(mapped.crossRole, "seeker", account);
      } else {
        assert.equal(mapped.crossRole, "", account);
      }
      if (account === "none") {
        assert.equal(unknownUserAction(mapped), "public_jobs");
      }
    }
  });

  it("explicit electrician request wins over unrelated resume skills", () => {
    const afterResume = understandLocally("I want electrician job");
    assert.equal(afterResume.intent, "JOB_SEARCH");
    assert.equal(afterResume.category, "Electrician");
    assert.notEqual(afterResume.category.toLowerCase(), "accounting");
  });
});
