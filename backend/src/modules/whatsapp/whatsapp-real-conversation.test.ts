import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CORPUS_SECTIONS } from "../website-knowledge/website-knowledge.corpus.js";
import { mergePolicySectionsIntoCorpus } from "../website-knowledge/website-knowledge.policy.js";
import { composeGroundedKnowledgeAnswer } from "../website-knowledge/website-knowledge.answer.js";
import {
  expandKnowledgeQuery,
  rankKnowledgeHits,
  type RetrievableSection,
} from "../website-knowledge/website-knowledge.retrieve.js";
import {
  applyAccountAwareIntent,
  applyConversationFollowUp,
  buildDeterministicReply,
  postJobGuideCopy,
  resolveTurnUnderstanding,
  understandLocally,
} from "./whatsapp-bot.logic.js";
import { authorizeWhatsAppRole } from "./whatsapp-role-policy.js";
import { resolveNoMatchChoice } from "./whatsapp-conversation-orchestrator.js";
import { looksLikeShownSalaryComparison } from "./whatsapp-bot.criteria.js";
import {
  resolveClarificationAck,
  shouldClearSearchOnGreeting,
} from "./whatsapp-turn-resolver.js";

const SEEKER_JOB_ASK = /మీకు ఏ జాబ్ కావాలి|which job do you want|You mentioned|మీరు చెప్పింది|आपने बताया/i;

function officialSections(): RetrievableSection[] {
  return mergePolicySectionsIntoCorpus(CORPUS_SECTIONS).map((section) => ({
    title: section.title,
    sectionHeading: section.sectionHeading,
    content: section.content,
    canonicalUrl: `https://www.aslijobs.com${section.path}`,
    sourceType: section.sourceType,
    language: "en" as const,
    persona: section.persona,
    keywords: section.keywords,
    active: true,
  }));
}

function answerFor(query: string, persona?: "employer" | "seeker" | "general") {
  const expanded = expandKnowledgeQuery(query);
  const hits = rankKnowledgeHits({
    query: expanded,
    faqs: [],
    sections: officialSections(),
    persona,
    limit: 5,
  });
  return composeGroundedKnowledgeAnswer({
    query: expanded,
    hits,
    helpCenterUrl: "https://www.aslijobs.com/help-center",
    contactUrl: "https://www.aslijobs.com/contact",
    faqsUrl: "https://www.aslijobs.com/faqs",
  });
}

describe("real WhatsApp conversation fixes", () => {
  it("answers AsliJobs guidelines from the official guidelines page", () => {
    for (const query of [
      "aslijobs guidelines cheppu",
      "Tell me AsliJobs guidelines",
      "అస్లీజాబ్స్ గైడ్‌లైన్స్ చెప్పు",
    ]) {
      const understanding = applyAccountAwareIntent(understandLocally(query), "employer");
      assert.equal(understanding.intent, "PLATFORM_KNOWLEDGE", query);
      const answer = answerFor(query);
      assert.match(answer.text, /Introduction|General Platform Guidelines/i);
      assert.doesNotMatch(answer.text, /^Admin and Operations/i);
      assert.match(answer.sourceUrl, /\/guidelines/);
      assert.equal(SEEKER_JOB_ASK.test(answer.text), false);
    }
  });

  it("answers employer guidelines from the employer guidelines section", () => {
    const query = "employer guidelines enti";
    const understanding = applyAccountAwareIntent(understandLocally(query), "employer");
    assert.equal(understanding.intent, "PLATFORM_KNOWLEDGE");
    const answer = answerFor(query, "employer");
    assert.match(answer.text, /Employer Guidelines/i);
    assert.match(answer.text, /genuine job openings/i);
    assert.match(answer.sourceUrl, /\/guidelines/);
    assert.equal(SEEKER_JOB_ASK.test(answer.text), false);
  });

  it("posts a job with the official link and no echoed user text", () => {
    const query = "Nenu aslijobs lo job post cheyyali anukuntunnanu";
    const understanding = resolveTurnUnderstanding(query, understandLocally(query), null);
    assert.equal(understanding.intent, "POST_JOB");
    assert.equal(understanding.category, "");
    const copy = postJobGuideCopy({
      language: "te",
      verification: "verified",
      name: "Acme",
      role: "Nenu Aslijobs Lo",
      location: "",
      postJobUrl: "https://www.aslijobs.com/post-job?lang=te",
      profileUrl: "https://www.aslijobs.com/employer/profile",
    });
    assert.match(copy, /https:\/\/www\.aslijobs\.com\/post-job\?lang=te/);
    assert.equal(copy.includes("మీరు చెప్పింది"), false);
    assert.equal(copy.includes("Nenu Aslijobs"), false);
    assert.equal(copy.includes("You mentioned"), false);
  });

  it("treats how to post a job as website guidance", () => {
    const understanding = applyAccountAwareIntent(
      understandLocally("How can I post a job?"),
      "employer",
    );
    assert.equal(understanding.intent, "PLATFORM_KNOWLEDGE");
    const answer = answerFor("How can I post a job?", "employer");
    assert.match(answer.text, /job post|Post a Job|Job Posting/i);
    assert.match(answer.sourceUrl, /guidelines|employer-guide/);
  });

  it("routes job posting rules to official posting guidelines", () => {
    const understanding = understandLocally("job posting rules cheppu");
    assert.equal(understanding.intent, "PLATFORM_KNOWLEDGE");
    const answer = answerFor("job posting rules cheppu", "employer");
    assert.match(answer.text, /Job Posting Guidelines/i);
    assert.match(answer.sourceUrl, /\/guidelines/);
  });

  it("answers how to manage applicants from employer guidance", () => {
    const understanding = applyAccountAwareIntent(
      understandLocally("How do I manage applicants?"),
      "employer",
    );
    assert.equal(understanding.intent, "PLATFORM_KNOWLEDGE");
    assert.equal(understanding.crossRole ?? "", "");
    const answer = answerFor("How do I manage applicants?", "employer");
    assert.match(answer.text, /application|dashboard/i);
    assert.equal(SEEKER_JOB_ASK.test(answer.text), false);
  });

  it("does not run a seeker job search when an employer asks how seekers search", () => {
    const understanding = applyAccountAwareIntent(
      understandLocally("job seeker ki jobs ela search cheyyali"),
      "employer",
    );
    assert.equal(understanding.intent, "PLATFORM_KNOWLEDGE");
    assert.notEqual(understanding.crossRole, "seeker");
    const answer = answerFor("job seeker ki jobs ela search cheyyali", "seeker");
    assert.equal(SEEKER_JOB_ASK.test(answer.text), false);
    assert.ok(answer.text.length > 40);
  });

  it("keeps seeker job search, apply, and application status", () => {
    const jobs = understandLocally("React jobs kavali");
    assert.equal(jobs.intent, "JOB_SEARCH");
    assert.equal(jobs.category, "React");
    const apply = applyConversationFollowUp("apply", understandLocally("apply"), "JOB_SEARCH");
    assert.equal(apply.intent, "JOB_DETAILS");
    const status = understandLocally("application status");
    assert.equal(status.intent, "APPLICATION_STATUS");
    const seekerGuide = understandLocally("aslijobs guidelines cheppu");
    assert.equal(applyAccountAwareIntent(seekerGuide, "seeker").intent, "PLATFORM_KNOWLEDGE");
  });

  it("says so when website knowledge has no matching page", () => {
    const answer = answerFor("zzzzqqqq plugh");
    assert.equal(answer.confidence, "none");
    assert.match(answer.text, /could not confirm/i);
    assert.match(answer.text, /help-center/);
    assert.equal(SEEKER_JOB_ASK.test(answer.text), false);
  });

  it("combines more than one guidelines section and keeps the source URL", () => {
    const answer = answerFor("aslijobs guidelines cheppu");
    assert.match(answer.text, /Details: https:\/\/www\.aslijobs\.com\/guidelines/);
    const headings = answer.text.match(/Guidelines/gi) ?? [];
    assert.ok(headings.length >= 1);
    assert.ok(answer.text.length > 180);
  });

  it("uses employer capability copy instead of a seeker job question", () => {
    const text = buildDeterministicReply("te", {
      situation: "clarify",
      missing: "intent",
      accountType: "employer",
    });
    assert.match(text ?? "", /పోస్ట్ చేసిన/);
    assert.equal(/ఏ జాబ్ కావాలి/.test(text ?? ""), false);
    const seeker = buildDeterministicReply("te", { situation: "clarify", missing: "role" });
    assert.match(seeker ?? "", /ఏ జాబ్/);
  });

  it("blocks an employer from seeker job search tools", () => {
    const decision = authorizeWhatsAppRole({
      account: "employer",
      intent: "JOB_SEARCH",
    });
    assert.equal(decision.allowed, false);
  });

  it("keeps clarification, no-match, greeting, salary, and short-message behavior", () => {
    const yes = resolveClarificationAck("avunu", {
      pendingClarification: "job_search_no_match",
      pendingNearbyCity: "Hyderabad",
    });
    assert.equal(yes.kind, "no_match");
    assert.equal(resolveNoMatchChoice("2"), "use_nearby");
    assert.equal(
      shouldClearSearchOnGreeting("hi", { lastCategory: "Driver", lastJobs: [{ jobTitle: "Driver" }] }),
      false,
    );
    assert.equal(looksLikeShownSalaryComparison("which one pays more"), true);
    const jobs = understandLocally("jobs");
    assert.equal(jobs.intent, "JOB_SEARCH");
    assert.equal(jobs.openSearch, true);
    const roman = understandLocally("Hyderabad lo driver jobs kavali");
    assert.equal(roman.intent, "JOB_SEARCH");
    assert.equal(roman.category, "Driver");
    assert.equal(roman.location, "Hyderabad");
  });
});
