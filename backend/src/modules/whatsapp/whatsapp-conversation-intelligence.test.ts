import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyAccountAwareIntent,
  applyConversationFollowUp,
  buildDeterministicReply,
  employerVerificationCopy,
  resolveTurnUnderstanding,
  seekerProfileStatusCopy,
  shouldUseLlmFallback,
  understandLocally,
  unknownUserAction,
  serviceErrorCopy,
} from "./whatsapp-bot.logic.js";
import { authorizeWhatsAppRole } from "./whatsapp-role-policy.js";

function classify(text: string, account: "employer" | "seeker" | "none" | "both" = "none") {
  return applyAccountAwareIntent(understandLocally(text), account);
}

describe("conversation intelligence — screenshot + acceptance regressions", () => {
  it("1. i want to post a job → employer posting", () => {
    for (const text of ["i want to post a job", "i want post a job"]) {
      const mapped = classify(text, "employer");
      assert.equal(mapped.intent, "POST_JOB", text);
      assert.equal(mapped.crossRole, "");
      assert.equal(shouldUseLlmFallback(understandLocally(text), text), false);
    }
  });

  it("2. nenu post chesina jobs status kavali → employer job status, no title pollution", () => {
    const mapped = classify("nenu post chesina jobs status kavali", "employer");
    assert.equal(mapped.intent, "EMPLOYER_JOB_STATUS");
    assert.equal(mapped.category, "");
    assert.equal(mapped.crossRole, "");
    const resolved = resolveTurnUnderstanding(
      "nenu post chesina jobs status kavali",
      understandLocally("nenu post chesina jobs status kavali"),
      null,
    );
    assert.equal(resolved.intent, "EMPLOYER_JOB_STATUS");
    assert.equal(resolved.category, "");
  });

  it("3. Show my posted jobs → employer listings", () => {
    const mapped = classify("Show my posted jobs", "employer");
    assert.equal(mapped.intent, "EMPLOYER_JOBS");
    assert.equal(mapped.crossRole, "");
  });

  it("4. naa company profile verify ayyindha? → account status from employer facts", () => {
    const mapped = classify("naa company profile verify ayyindha?", "employer");
    assert.equal(mapped.intent, "ACCOUNT_STATUS");
    assert.equal(mapped.scope, "OWN_EMPLOYER_DATA");
    assert.equal(shouldUseLlmFallback(understandLocally("naa company profile verify ayyindha?"), "naa company profile verify ayyindha?"), false);
    const reply = employerVerificationCopy({
      language: "en",
      verification: "pending",
      name: "Acme",
      profileUrl: "https://aslijobs.com/employer/company-profile",
    });
    assert.match(reply, /pending verification/i);
    assert.doesNotMatch(reply, /kind of job|looking for/i);
  });

  it("5. How many people applied to my job? → employer applicant count without garbage category", () => {
    const mapped = classify("How many people applied to my job?", "employer");
    assert.equal(mapped.intent, "EMPLOYER_APPLICATION_COUNT");
    assert.equal(mapped.category, "");
  });

  it("6. Employer asking for personal electrician jobs is role-gated", () => {
    const mapped = classify("I want electrician jobs for myself", "employer");
    assert.equal(mapped.intent, "JOB_SEARCH");
    assert.equal(mapped.crossRole, "seeker");
    assert.equal(authorizeWhatsAppRole({ account: "employer", intent: "JOB_SEARCH" }).allowed, false);
  });

  it("7. Find electrician jobs → seeker job search", () => {
    const mapped = classify("Find electrician jobs", "seeker");
    assert.equal(mapped.intent, "JOB_SEARCH");
    assert.equal(mapped.category, "Electrician");
    assert.equal(mapped.crossRole, "");
  });

  it("8. naa profile status ela/elu undhi? → seeker profile status, never job-title clarify", () => {
    for (const text of [
      "naa profile status ela undhi?",
      "naa profile status elu undhi?",
      "naa profile status enti?",
      "i want profile status",
    ]) {
      const local = understandLocally(text);
      assert.equal(local.intent, "ACCOUNT_STATUS", text);
      assert.equal(shouldUseLlmFallback(local, text), false, text);
      const mapped = classify(text, "seeker");
      assert.equal(mapped.intent, "ACCOUNT_STATUS", text);
      assert.equal(mapped.scope, "OWN_DATA", text);
      assert.doesNotMatch(
        buildDeterministicReply("en", {
          situation: "clarify",
          missing: "role",
        }) ?? "",
        /profile status/i,
      );
    }
    const statusReply = seekerProfileStatusCopy({
      language: "en",
      registrationStatus: "COMPLETED",
      whatsappVerified: true,
      accountStatus: "active",
      name: "Ravi",
      role: "Electrician",
    });
    assert.match(statusReply, /active/i);
    assert.doesNotMatch(statusReply, /kind of job|Looking at your question/i);
  });

  it("9. profile is verified or not? / naa profile verify ayyindha? → ACCOUNT_STATUS", () => {
    for (const text of [
      "profile is verified or not?",
      "Is my profile verified?",
      "naa profile verify ayyindha?",
    ]) {
      const mapped = classify(text, "seeker");
      assert.equal(mapped.intent, "ACCOUNT_STATUS", text);
      assert.equal(shouldUseLlmFallback(understandLocally(text), text), false, text);
    }
  });

  it("10. What is my application status? → seeker applications", () => {
    const mapped = classify("What is my application status?", "seeker");
    assert.equal(mapped.intent, "APPLICATION_STATUS");
    assert.equal(mapped.crossRole, "");
  });

  it("11. Seeker posting vacancy is role-gated", () => {
    const mapped = classify("I want to post an electrician vacancy", "seeker");
    assert.equal(mapped.intent, "POST_JOB");
    assert.equal(mapped.crossRole, "employer");
  });

  it("12-13. Unregistered job vs hire guidance", () => {
    const job = understandLocally("I want an electrician job");
    assert.equal(job.intent, "JOB_SEARCH");
    assert.equal(unknownUserAction(job), "public_jobs");
    const hire = understandLocally("I want to hire an electrician");
    assert.equal(hire.intent, "POST_JOB");
    assert.equal(unknownUserAction(hire), "employer_register");
  });

  it("14. I need help → help/greeting path, not job-title ask", () => {
    const help = understandLocally("I need help");
    assert.ok(help.intent === "HELP" || help.intent === "UNKNOWN" || help.intent === "GREETING");
    if (help.intent === "HELP") {
      assert.equal(unknownUserAction(help), "greeting");
    }
  });

  it("15. Account lookup failure copy is not unregistered", () => {
    for (const language of ["en", "hi", "te"] as const) {
      assert.doesNotMatch(serviceErrorCopy(language), /unregistered|register as/i);
    }
  });

  it("16. Post a job → Status? keeps employer job-status context", () => {
    const follow = applyConversationFollowUp("Status?", understandLocally("Status?"), "POST_JOB");
    assert.equal(follow.intent, "EMPLOYER_JOB_STATUS");
    const gated = applyAccountAwareIntent(follow, "employer");
    assert.equal(gated.crossRole, "");
  });

  it("17. Profile verified → When will it be approved? keeps verification topic", () => {
    const follow = applyConversationFollowUp(
      "When will it be approved?",
      understandLocally("When will it be approved?"),
      "ACCOUNT_STATUS",
    );
    assert.equal(follow.intent, "ACCOUNT_STATUS");
    assert.equal(follow.jobQuery, "verification_timeline");
    const reply = buildDeterministicReply("en", {
      situation: "verification_timeline_unknown",
    });
    assert.match(reply ?? "", /not available|timeline/i);
    assert.doesNotMatch(reply ?? "", /kind of job/i);
  });

  it("18. Find jobs → Electrician → Hyderabad preserves search slots", () => {
    const step1 = resolveTurnUnderstanding("Find jobs", understandLocally("Find jobs"), null);
    assert.equal(step1.intent, "JOB_SEARCH");
    const step2 = resolveTurnUnderstanding(
      "Electrician",
      understandLocally("Electrician"),
      { location: "", category: "", intent: "JOB_SEARCH", openSearch: true },
    );
    assert.equal(step2.intent, "JOB_SEARCH");
    assert.equal(step2.category, "Electrician");
    const step3 = resolveTurnUnderstanding(
      "Hyderabad",
      understandLocally("Hyderabad"),
      {
        location: "",
        category: "Electrician",
        intent: "JOB_SEARCH",
        openSearch: false,
      },
    );
    assert.equal(step3.location, "Hyderabad");
    assert.equal(step3.category, "Electrician");
  });

  it("19. Correction overrides stale job-search context with posted-job status", () => {
    const corrected = resolveTurnUnderstanding(
      "nenu post chesina jobs status kavali",
      understandLocally("nenu post chesina jobs status kavali"),
      { location: "Hyderabad", category: "Electrician", intent: "JOB_SEARCH" },
    );
    assert.equal(corrected.intent, "EMPLOYER_JOB_STATUS");
    assert.equal(corrected.category, "");
    assert.notEqual(corrected.intent, "JOB_SEARCH");
  });

  it("20. Role change re-authorizes: seeker cannot keep employer lastIntent privileges", () => {
    const follow = applyConversationFollowUp("Status?", understandLocally("Status?"), "POST_JOB");
    assert.equal(follow.intent, "EMPLOYER_JOB_STATUS");
    const asSeeker = applyAccountAwareIntent(follow, "seeker");
    assert.equal(asSeeker.crossRole, "employer");
    assert.equal(
      authorizeWhatsAppRole({ account: "seeker", intent: "EMPLOYER_JOB_STATUS" }).allowed,
      false,
    );
  });

  it("bare electrician after employer post continues POST_JOB, not seeker redirect", () => {
    const follow = applyConversationFollowUp(
      "electrician",
      understandLocally("electrician"),
      "POST_JOB",
    );
    assert.equal(follow.intent, "POST_JOB");
    assert.equal(follow.category, "Electrician");
    const emp = applyAccountAwareIntent(follow, "employer");
    assert.equal(emp.crossRole, "");
  });

  it("profile-status never falls through to Looking at your question / job clarify", () => {
    const text = "i want profile status";
    assert.equal(shouldUseLlmFallback(understandLocally(text), text), false);
    const seekerReply = buildDeterministicReply("en", {
      situation: "account_status",
      accountType: "seeker",
      registrationStatus: "COMPLETED",
      whatsappVerified: true,
      accountStatus: "active",
      name: "Asha",
      role: "Cook",
    });
    assert.match(seekerReply ?? "", /Job Seeker profile is active/i);
    assert.doesNotMatch(seekerReply ?? "", /Looking at your question|kind of job/i);
  });
});
