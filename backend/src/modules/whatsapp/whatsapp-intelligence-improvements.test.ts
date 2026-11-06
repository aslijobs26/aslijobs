import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  buildDeterministicReply,
  detectLanguage,
  detectProtocolTurn,
  looksLikeCompetingIntents,
  mentionsNightShift,
  resolveTurnUnderstanding,
  shortCommandUnderstanding,
  understandLocally,
} from "./whatsapp-bot.logic.js";
import {
  compareShownJobSalaries,
  looksLikeRelativeHigherSalary,
  looksLikeShownSalaryComparison,
  parseSalaryLabelCeiling,
} from "./whatsapp-bot.criteria.js";
import { authorizeWhatsAppRole } from "./whatsapp-role-policy.js";
import { resolveNoMatchChoice } from "./whatsapp-conversation-orchestrator.js";
import { sarvamFallbackUnderstanding, sarvamUnderstandUserContent } from "./sarvam.client.js";
import {
  consumeCountedSlot,
  createMemoryReplyLimiter,
  decideReplySlot,
  replyWindowNeedsExpire,
} from "./whatsapp-reply-limit.js";
import {
  resolveClarificationAck,
  shouldClearSearchOnGreeting,
  shouldDeferProtocolAck,
} from "./whatsapp-turn-resolver.js";
import { blendSemanticHits } from "../website-knowledge/website-knowledge.retrieve.js";

function noMatchChoice(text: string, session: Parameters<typeof resolveClarificationAck>[1]) {
  const action = resolveClarificationAck(text, session);
  return action.kind === "no_match" ? action.choice : "";
}

describe("clarification yes/no", () => {
  it("keeps a bare yes as an acknowledgement when nothing is pending", () => {
    assert.equal(detectProtocolTurn("yes"), "ack");
    assert.equal(detectProtocolTurn("avunu"), "ack");
    assert.equal(detectProtocolTurn("kadu"), "ack");
    assert.equal(detectProtocolTurn("sare"), "ack");
    assert.equal(shouldDeferProtocolAck("ack", { lastIntent: "JOB_SEARCH" }), false);
    assert.equal(resolveClarificationAck("yes", null).kind, "ack");
  });

  it("does not swallow yes while a location question is open", () => {
    const session = { pendingIntent: "JOB_SEARCH", pendingCategory: "Driver", lastClarifyMissing: "location" };
    assert.equal(shouldDeferProtocolAck("ack", session), true);
    assert.deepEqual(resolveClarificationAck("yes", session), { kind: "reask", missing: "location" });
    assert.deepEqual(resolveClarificationAck("kadu", session), { kind: "reask", missing: "location" });
    assert.deepEqual(resolveClarificationAck("sare", session), { kind: "reask", missing: "location" });
  });

  it("maps yes and no onto the no-match menu", () => {
    const session = {
      pendingClarification: "job_search_no_match",
      pendingNearbyCity: "Hyderabad",
      lastCategory: "Driver",
      lastLocation: "Madhapur",
      lastMinSalary: 30000,
    };
    assert.equal(noMatchChoice("avunu", session), "use_nearby");
    assert.equal(noMatchChoice("kadu", session), "wait");
    const salaryOnly = { ...session, pendingNearbyCity: "" };
    assert.equal(noMatchChoice("yes", salaryOnly), "relax_salary");
    assert.equal(noMatchChoice("सही", session), "use_nearby");
    assert.equal(resolveNoMatchChoice("2"), "use_nearby");
    assert.equal(resolveNoMatchChoice("4"), "wait");
  });
});

describe("multi-turn job search", () => {
  it("keeps React when the next message only adds Hyderabad", () => {
    const first = understandLocally("Find React jobs");
    const second = resolveTurnUnderstanding(
      "Only Hyderabad",
      understandLocally("Only Hyderabad"),
      {
        location: first.location,
        category: first.category || "React",
        intent: "JOB_SEARCH",
      },
      "JOB_SEARCH",
    );
    assert.equal(second.intent, "JOB_SEARCH");
    assert.equal(second.location, "Hyderabad");
    assert.match(second.category, /react/i);
  });

  it("does not let a model city replace a city written in the message", () => {
    const raw = understandLocally("driver jobs in Hyderabad");
    raw.location = "Mumbai";
    const merged = resolveTurnUnderstanding("driver jobs in Hyderabad", raw, null, "");
    assert.equal(merged.location, "Hyderabad");
    assert.match(merged.category, /driver/i);
  });

  it("keeps the search when the user says hello, and clears it on an explicit reset", () => {
    const active = { lastCategory: "Driver", lastLocation: "Hyderabad", lastJobs: [{ jobTitle: "Driver" }] };
    assert.equal(shouldClearSearchOnGreeting("Hi", active), false);
    assert.equal(shouldClearSearchOnGreeting("Hi", null), true);
    assert.equal(shouldClearSearchOnGreeting("start over", active), true);
  });
});

describe("salary comparison and unsupported filters", () => {
  it("compares listed pay and ignores undisclosed salaries", () => {
    assert.equal(looksLikeShownSalaryComparison("which one pays more?"), true);
    assert.equal(looksLikeRelativeHigherSalary("which one pays more?"), false);
    assert.equal(looksLikeShownSalaryComparison("higher salary"), false);
    assert.equal(parseSalaryLabelCeiling("Not disclosed"), null);
    assert.equal(parseSalaryLabelCeiling(""), null);
    const text = compareShownJobSalaries(
      [
        { jobTitle: "Driver", salaryLabel: "₹18,000" },
        { jobTitle: "Car Driver", salaryLabel: "₹25,000–₹30,000" },
        { jobTitle: "Helper", salaryLabel: "" },
      ],
      "en",
    );
    assert.match(text, /Car Driver/);
    assert.match(text, /30,000|30000/);
    assert.match(text, /left out/i);
    assert.doesNotMatch(text, /Helper/);
  });

  it("says night shift is not a filter instead of pretending it was applied", () => {
    const reply = buildDeterministicReply("en", {
      situation: "jobs",
      location: "Hyderabad",
      role: "Driver",
      unsupportedFilter: "shift",
      jobs: [
        {
          jobTitle: "Driver",
          companyName: "City Cabs",
          cityName: "Hyderabad",
          jobId: "job-1",
          salaryLabel: "₹18,000",
        },
      ],
      accountType: "seeker",
    });
    assert.match(reply || "", /not a search filter/i);
    assert.match(reply || "", /Driver/);
    const tied = compareShownJobSalaries(
      [
        { jobTitle: "Driver", salaryLabel: "₹20,000" },
        { jobTitle: "Helper", salaryLabel: "₹20,000" },
      ],
      "en",
    );
    assert.match(tied, /Driver/);
    assert.match(tied, /Helper/);
    const nightInCity = understandLocally("night shift jobs in Hyderabad");
    assert.equal(nightInCity.location, "Hyderabad");
    assert.equal(nightInCity.category, "");
    assert.equal(mentionsNightShift("night shift jobs in Hyderabad"), true);
  });
});

describe("short messages, language, and multiple intents", () => {
  it("maps jobs and apply without calling a model", () => {
    const jobs = shortCommandUnderstanding("jobs", "en");
    assert.equal(jobs?.intent, "JOB_SEARCH");
    assert.equal(jobs?.openSearch, true);
    const apply = resolveTurnUnderstanding(
      "apply",
      understandLocally("apply"),
      { location: "Hyderabad", category: "Driver", intent: "JOB_SEARCH" },
      "JOB_SEARCH",
    );
    assert.equal(apply.intent, "JOB_DETAILS");
  });

  it("continues status and next from the previous topic", () => {
    const status = resolveTurnUnderstanding(
      "status",
      understandLocally("status"),
      null,
      "MY_APPLICATIONS",
    );
    assert.equal(status.intent, "APPLICATION_STATUS");
    assert.equal(status.requiresAuth, true);
    const statusAfterJobs = resolveTurnUnderstanding(
      "status",
      understandLocally("status"),
      { location: "Hyderabad", category: "Driver", intent: "JOB_SEARCH" },
      "JOB_SEARCH",
    );
    assert.notEqual(statusAfterJobs.intent, "APPLICATION_STATUS");
    const next = resolveTurnUnderstanding(
      "next",
      understandLocally("next"),
      { location: "Hyderabad", category: "Driver", intent: "JOB_SEARCH" },
      "JOB_SEARCH",
    );
    assert.equal(next.intent, "JOB_SEARCH");
    assert.equal(next.showMore, true);
    assert.match(next.category, /driver/i);
    assert.equal(next.location, "Hyderabad");
    const role = resolveTurnUnderstanding(
      "driver",
      understandLocally("driver"),
      { location: "Hyderabad", category: "", intent: "JOB_SEARCH" },
      "JOB_SEARCH",
    );
    assert.match(role.category, /driver/i);
    assert.equal(role.location, "Hyderabad");
  });

  it("reads roman Telugu and mixed Telugu-English as Telugu", () => {
    assert.equal(detectLanguage("hyd lo driver jobs kavali"), "te");
    assert.equal(detectLanguage("Hyderabad lo electrician jobs unnaya"), "te");
    assert.equal(understandLocally("hyd lo driver jobs kavali").location, "Hyderabad");
    assert.match(understandLocally("hyd lo driver jobs kavali").category, /driver/i);
  });

  it("asks which intent to handle when a job search and a status ask are both explicit", () => {
    const text = "show driver jobs in Hyderabad and my application status";
    assert.equal(looksLikeCompetingIntents(text), true);
    const understood = understandLocally(text);
    assert.equal(understood.intent, "CLARIFY");
    assert.equal(understood.clarifyField, "which_intent");
    const reply = buildDeterministicReply("en", { situation: "clarify", missing: "which_intent" });
    assert.match(reply || "", /which should I do first/i);
    assert.equal(looksLikeCompetingIntents("how do I apply for driver jobs in Hyderabad"), false);
  });
});

describe("role isolation and classifier context", () => {
  it("blocks an employer from seeker job search", () => {
    const decision = authorizeWhatsAppRole({
      account: "employer",
      intent: "JOB_SEARCH",
      activeRole: "employer",
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.redirectTo, "seeker");
  });

  it("sends previous slots to Sarvam on a normal turn and falls back locally", () => {
    const payload = JSON.parse(
      sarvamUnderstandUserContent("only night jobs please", {
        accountType: "JOB_SEEKER",
        priorIntent: "JOB_SEARCH",
        priorLocation: "Hyderabad",
        priorRole: "Driver",
        priorMinSalary: 20000,
      }),
    ) as { prev?: { intent?: string; loc?: string; role?: string } };
    assert.equal(payload.prev?.intent, "JOB_SEARCH");
    assert.equal(payload.prev?.loc, "Hyderabad");
    assert.equal(payload.prev?.role, "Driver");
    const fallback = sarvamFallbackUnderstanding("jobs", "te", null);
    assert.equal(fallback.source, "fallback");
    assert.equal(fallback.understanding.intent, "JOB_SEARCH");
  });
});

describe("rate limit and webhook ordering", () => {
  it("allows 20 replies, sends one notice, then drops", () => {
    assert.equal(decideReplySlot(20), "allow");
    assert.equal(decideReplySlot(21), "notice");
    assert.equal(decideReplySlot(22), "drop");
    const limiter = createMemoryReplyLimiter();
    const slots = Array.from({ length: 22 }, () => limiter.consume("919999999999"));
    assert.equal(slots.filter((slot) => slot === "allow").length, 20);
    assert.equal(slots.filter((slot) => slot === "notice").length, 1);
    assert.equal(slots.at(-1), "drop");
    const other = createMemoryReplyLimiter();
    assert.equal(other.consume("911111111111"), "allow");
    assert.equal(replyWindowNeedsExpire(-1), true);
    assert.equal(replyWindowNeedsExpire(40), false);
  });

  it("uses the in-process window when the shared counter throws", async () => {
    const slot = await consumeCountedSlot("918888888888", async () => {
      throw new Error("redis down");
    });
    assert.equal(slot, "allow");
  });

  it("acknowledges the webhook only after persist and enqueue", () => {
    const source = readFileSync(new URL("./whatsapp-webhook.controller.ts", import.meta.url), "utf8");
    const persist = source.indexOf("persistInboundMessages(body)");
    const route = source.indexOf("routeConversationalMessages(body)");
    const ack = source.indexOf("res.sendStatus(200)");
    assert.ok(persist > 0 && route > persist && ack > route);
    const release = source.indexOf("await releaseWhatsAppEvent(messageId);");
    const rethrow = source.indexOf("throw error;");
    const failure = source.indexOf("res.sendStatus(500)");
    assert.ok(release > 0 && rethrow > release && failure > 0);
  });

  it("keeps an active search on a greeting classified outside the protocol list", () => {
    const source = readFileSync(new URL("./whatsapp-bot.service.ts", import.meta.url), "utf8");
    const patch = source.indexOf("const sessionPatch");
    const after = source.indexOf("const localizeStarted", patch);
    const body = source.slice(patch, after);
    assert.match(body, /shouldClearSearchOnGreeting/);
    assert.match(body, /lastJobs: session\?\.lastJobs/);
    assert.doesNotMatch(body, /GREETING" \? clearedTemporarySearchSessionFields\(\)/);
    const compare = source.indexOf("understanding.compareShownSalaries");
    const redirect = source.lastIndexOf('understanding.crossRole === "employer"', compare);
    assert.ok(redirect > 0 && redirect < compare);
  });
});

describe("website knowledge grounding", () => {
  it("does not score a hash vector against an E5 chunk", () => {
    const hits = blendSemanticHits({
      queryEmbedding: [1, 0],
      chunks: [
        {
          sectionTitle: "Privacy",
          text: "We store your phone number.",
          sourceUrl: "https://aslijobs.com/privacy",
          sourceType: "policy",
          language: "en",
          embedding: [1, 0, 0],
        },
      ],
      lexicalHits: [],
    });
    assert.equal(hits.length, 0);
  });

  it("keeps a grounded extract and a source link", () => {
    const reply = buildDeterministicReply("en", {
      situation: "platform_knowledge",
      answer: "Job seekers can register on the website.\n\nDetails: https://aslijobs.com/help-center",
    });
    assert.match(reply || "", /register/i);
    assert.match(reply || "", /help-center/);
    assert.doesNotMatch(reply || "", /successfully applied/i);
  });
});
