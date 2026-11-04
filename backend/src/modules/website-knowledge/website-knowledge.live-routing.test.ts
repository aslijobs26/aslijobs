import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import {
  applyAccountAwareIntent,
  buildDeterministicReply,
  understandLocally,
  unknownUserAction,
} from "../whatsapp/whatsapp-bot.logic.js";
import { authorizeWhatsAppRole } from "../whatsapp/whatsapp-role-policy.js";
import {
  answerWebsiteKnowledgeQuestion,
  clearWebsiteKnowledgeFaqCache,
} from "./website-knowledge.service.js";
import { resetWebsiteKnowledgeMemory } from "./website-knowledge.store.js";
import { syncWebsiteKnowledge } from "./website-knowledge.sync.js";

const ORIGIN = "https://www.aslijobs.com";

async function knowledgeReply(query: string, account: "none" | "seeker" | "employer") {
  const local = understandLocally(query);
  const mapped = applyAccountAwareIntent(local, account);
  const gate = authorizeWhatsAppRole({
    account,
    intent: mapped.intent,
    activeRole: account === "none" ? "" : account,
  });
  let answerText = "";
  let sourceUrl = "";
  if (mapped.intent === "PLATFORM_KNOWLEDGE" && gate.allowed) {
    const knowledge = await answerWebsiteKnowledgeQuestion({
      query,
      language: mapped.language,
      frontendOrigin: ORIGIN,
      persona: account === "employer" ? "employer" : account === "seeker" ? "seeker" : "general",
    });
    answerText =
      buildDeterministicReply(mapped.language, {
        situation: "platform_knowledge",
        answer: knowledge.text,
      }) ?? "";
    sourceUrl = knowledge.sourceUrl;
  }
  return { local, mapped, gate, answerText, sourceUrl };
}

describe("website knowledge live routing regressions", () => {
  before(async () => {
    resetWebsiteKnowledgeMemory();
    clearWebsiteKnowledgeFaqCache();
    await syncWebsiteKnowledge({
      frontendOrigin: ORIGIN,
      crawlEnabled: false,
      persistMongo: false,
    });
  });

  const knowledgeCases = [
    {
      q: "What is AsliJobs?",
      expectIntent: "PLATFORM_KNOWLEDGE",
      content: /WhatsApp-based job portal|blue-collar|grey-collar/i,
      source: /faqs/i,
    },
    {
      q: "How does AsliJobs work?",
      expectIntent: "PLATFORM_KNOWLEDGE",
      content: /WhatsApp|job seekers|employers/i,
      source: /faqs/i,
    },
    {
      q: "Do I need to download an app?",
      expectIntent: "PLATFORM_KNOWLEDGE",
      content: /do not need to download|WhatsApp/i,
      source: /faqs/i,
    },
    {
      q: "Which job category are available",
      expectIntent: "PLATFORM_KNOWLEDGE",
      content: /manufacturing|construction|logistics|categories/i,
      source: /faqs|job-categories/i,
    },
    {
      q: "Which job categories are available?",
      expectIntent: "PLATFORM_KNOWLEDGE",
      content: /manufacturing|construction|logistics|categories/i,
      source: /faqs|job-categories/i,
    },
    {
      q: "Are employer services free or paid",
      expectIntent: "PLATFORM_KNOWLEDGE",
      content: /free and paid|paid hiring plans|promoted jobs/i,
      source: /faqs|pricing-plans/i,
    },
    {
      q: "Is job posting free?",
      expectIntent: "PLATFORM_KNOWLEDGE",
      content: /free and paid|paid hiring plans|Basic Hiring Plan|pricing/i,
      source: /faqs|pricing-plans|employer-guide/i,
    },
    {
      q: "How much does posting a job cost?",
      expectIntent: "PLATFORM_KNOWLEDGE",
      content: /free and paid|paid hiring plans|Hiring Plan|pricing/i,
      source: /faqs|pricing-plans/i,
    },
    {
      q: "How can I post a job?",
      expectIntent: "PLATFORM_KNOWLEDGE",
      content: /job title|location|salary|post a job|Employers can post/i,
      source: /faqs|employer-guide|post-a-job/i,
    },
    {
      q: "Employer pricing plans",
      expectIntent: "PLATFORM_KNOWLEDGE",
      content: /Hiring Plan|pricing|paid hiring/i,
      source: /pricing-plans/i,
    },
    {
      q: "AsliJobs ante enti?",
      expectIntent: "PLATFORM_KNOWLEDGE",
      content: /WhatsApp-based job portal|blue-collar|grey-collar/i,
      source: /faqs/i,
    },
    {
      q: "Job seeker registration ela?",
      expectIntent: "PLATFORM_KNOWLEDGE",
      content: /register|profile|WhatsApp|account/i,
      source: /faqs|job-seeker-guide|register/i,
    },
    {
      q: "Employer guide",
      expectIntent: "PLATFORM_KNOWLEDGE",
      content: /employer|hire|post|dashboard|WhatsApp/i,
      source: /employer-guide/i,
    },
    {
      q: "Phone",
      expectIntent: "PLATFORM_KNOWLEDGE",
      content: /WhatsApp|phone|email|support/i,
      source: /faqs|contact/i,
    },
  ] as const;

  for (const account of ["none", "seeker", "employer"] as const) {
    for (const testCase of knowledgeCases) {
      it(`${account}: ${testCase.q}`, async () => {
        const result = await knowledgeReply(testCase.q, account);
        assert.equal(result.mapped.intent, testCase.expectIntent, testCase.q);
        assert.equal(result.gate.allowed, true, `${testCase.q} must not hit role block`);
        assert.doesNotMatch(
          result.answerText,
          /configured for Employer services only|configured for Job Seeker services only/i,
        );
        assert.doesNotMatch(result.answerText, /Tell me a role and city|Which location are you looking for/i);
        assert.match(result.answerText, testCase.content);
        assert.match(result.sourceUrl, testCase.source);
      });
    }
  }

  it("keeps isolated role words on job search without platform FAQ contamination", () => {
    for (const q of ["Driver", "Driver job"]) {
      const u = understandLocally(q);
      assert.equal(u.intent, "JOB_SEARCH", q);
      assert.equal(u.category, "Driver", q);
      assert.notEqual(u.intent, "PLATFORM_KNOWLEDGE", q);
    }
  });

  it("keeps concrete city job searches on JOB_SEARCH", () => {
    for (const q of [
      "Driver jobs in Hyderabad",
      "Hyderabad lo driver jobs",
      "Hyderabad lo enni jobs available ga vunnayi",
    ]) {
      const u = understandLocally(q);
      assert.equal(u.intent, "JOB_SEARCH", q);
      assert.notEqual(u.intent, "PLATFORM_KNOWLEDGE", q);
    }
  });

  it("keeps imperative hire CTAs on POST_JOB", () => {
    for (const q of ["Post a job", "I want to post a job", "I want to hire staff"]) {
      const u = understandLocally(q);
      assert.equal(u.intent, "POST_JOB", q);
    }
  });

  it("does not require registration merely to answer public docs", () => {
    const u = understandLocally("Are employer services free or paid");
    assert.equal(u.intent, "PLATFORM_KNOWLEDGE");
    assert.notEqual(unknownUserAction(u), "employer_register");
    assert.notEqual(unknownUserAction(u), "seeker_register");
  });

  it("covers multilingual platform questions", () => {
    const samples = [
      "AsliJobs ante enti?",
      "AsliJobs क्या है?",
      "AsliJobs par pricing plans kya hain?",
      "AsliJobs la employer job epdi post pannuvanga?",
      "AsliJobs nalli job hege post madodu?",
      "AsliJobs-il job engane post cheyyam?",
      "నాకు job seeker registration ఎలా?",
    ];
    for (const q of samples) {
      const u = understandLocally(q);
      assert.equal(u.intent, "PLATFORM_KNOWLEDGE", q);
      assert.equal(u.category, "", q);
    }
  });
});
