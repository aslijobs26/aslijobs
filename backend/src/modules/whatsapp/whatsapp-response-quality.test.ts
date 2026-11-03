import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveJobSeekerAccountLanguage } from "./job-seeker-whatsapp-language.js";
import { shouldUseOpenAiAssist } from "./openai-assist.routing.js";
import { whatsappAiCallPlan } from "./sarvam-translate.client.js";
import {
  aboutAsliJobsCopy,
  buildDeterministicReply,
  contactEmployerGuideCopy,
  detectLanguage,
  detectProtocolTurn,
  howToApplyCopy,
  howToFindJobsCopy,
  howToRegisterCopy,
  protocolReply,
  shouldUseLlmFallback,
  understandLocally,
} from "./whatsapp-bot.logic.js";

function assistFor(text: string, situation: string) {
  return shouldUseOpenAiAssist({
    enabled: true,
    hasApiKey: true,
    model: "gpt-4o-mini",
    protocol: false,
    menuIntent: false,
    situation,
    userText: text,
    understandingSource: "local",
    language: "en",
  });
}

describe("WhatsApp response quality", () => {
  it("routes greetings in all six languages without AI", () => {
    for (const [text, lang] of [
      ["Hi", "en"],
      ["Hello", "en"],
      ["నమస్కారం", "te"],
      ["नमस्ते", "hi"],
      ["வணக்கம்", "ta"],
      ["ನಮಸ್ಕಾರ", "kn"],
      ["നമസ്കാരം", "ml"],
    ] as const) {
      assert.equal(detectProtocolTurn(text), "greeting", text);
      assert.equal(detectLanguage(text, null, null, true), lang, text);
      const reply = protocolReply("greeting", lang, "none", "");
      assert.ok(reply.length > 10, text);
      assert.doesNotMatch(reply, /undefined|null|\{|stack/i);
    }
    const plan = whatsappAiCallPlan({ protocol: true, voice: false, needsTranslation: false });
    assert.equal(plan.chatLlmCalls, 0);
  });

  it("treats thanks and yes/no acknowledgements as protocol turns", () => {
    assert.equal(detectProtocolTurn("Thank you"), "thanks");
    assert.equal(detectProtocolTurn("Thanks"), "thanks");
    assert.equal(detectProtocolTurn("ధన్యవాదాలు"), "thanks");
    assert.equal(detectProtocolTurn("धन्यवाद"), "thanks");
    for (const text of ["OK", "Yes", "No", "haan", "avunu", "nahi"]) {
      assert.equal(detectProtocolTurn(text), "ack", text);
    }
    assert.equal(detectLanguage("Yes", "te", null, true), "te");
    assert.equal(detectLanguage("OK", "hi", null, true), "hi");
    const thanks = protocolReply("thanks", "te", "seeker", "");
    assert.match(thanks, /సరే|ఇంకా/);
    assert.doesNotMatch(thanks, /undefined|null/);
  });

  it("answers help and AsliJobs FAQs without starting a job search", () => {
    for (const text of ["Help", "సహాయం", "मदद", "உதவி", "ಸಹಾಯ", "സഹായം"]) {
      const u = understandLocally(text);
      assert.equal(u.intent, "HELP", text);
      assert.equal(u.category, "");
      assert.equal(shouldUseLlmFallback(u, text), false, text);
    }

    const about = understandLocally("What is AsliJobs?");
    assert.equal(about.intent, "HELP");
    assert.equal(about.focus, "about");
    assert.equal(about.openSearch, false);
    assert.equal(about.category, "");
    const aboutReply = buildDeterministicReply("en", {
      situation: "help",
      accountType: "seeker",
      focus: "about",
    });
    assert.equal(aboutReply, aboutAsliJobsCopy("en"));
    assert.match(aboutReply ?? "", /WhatsApp-first job platform/i);
    assert.doesNotMatch(aboutReply ?? "", /₹\d|AJ-\d|undefined/);

    const find = understandLocally("How to find jobs?");
    assert.equal(find.intent, "HELP");
    assert.equal(find.focus, "find_jobs");
    assert.equal(find.category, "");
    assert.equal(
      buildDeterministicReply("en", { situation: "help", focus: "find_jobs", accountType: "seeker" }),
      howToFindJobsCopy("en"),
    );

    const register = understandLocally("How to register?");
    assert.equal(register.intent, "HELP");
    assert.equal(register.focus, "register");
    const registerReply = buildDeterministicReply("en", {
      situation: "help",
      focus: "register",
      accountType: "none",
      registration: {
        seekerRegisterUrl: "https://example.com/seeker",
        employerRegisterUrl: "https://example.com/employer",
      },
    });
    assert.equal(
      registerReply,
      howToRegisterCopy("en", "https://example.com/seeker", "https://example.com/employer"),
    );
    assert.match(registerReply ?? "", /Job Seeker/);
    assert.doesNotMatch(registerReply ?? "", /applied successfully|registered successfully/i);

    const contact = understandLocally("How to contact employer?");
    assert.equal(contact.intent, "HELP");
    assert.equal(contact.focus, "contact_employer");
    assert.notEqual(contact.intent, "POST_JOB");
    const contactReply = buildDeterministicReply("en", {
      situation: "help",
      focus: "contact_employer",
      accountType: "seeker",
    });
    assert.equal(contactReply, contactEmployerGuideCopy("en"));
    assert.doesNotMatch(contactReply ?? "", /\+91|phone number is|call them at/i);
  });

  it("routes apply guidance separately from my applications", () => {
    const apply = understandLocally("How to apply?");
    assert.equal(apply.intent, "HOW_TO_APPLY");
    assert.notEqual(apply.intent, "MY_APPLICATIONS");
    for (const lang of ["en", "te", "hi", "ta", "kn", "ml"] as const) {
      const copy = howToApplyCopy(lang, "seeker", "");
      assert.ok(copy.length > 20, lang);
      if (lang !== "en") {
        assert.notEqual(copy, howToApplyCopy("en", "seeker", ""));
      }
    }
  });

  it("keeps real job search separate from unrelated questions", () => {
    const search = understandLocally("Driver jobs in Hyderabad");
    assert.equal(search.intent, "JOB_SEARCH");
    assert.equal(search.category, "Driver");
    assert.equal(search.location, "Hyderabad");

    const available = understandLocally("What jobs are available?");
    assert.equal(available.intent, "JOB_SEARCH");
    assert.equal(available.openSearch, true);

    const joke = understandLocally("Tell me a joke");
    assert.equal(joke.intent, "UNRELATED");
    const out = buildDeterministicReply("en", { situation: "out_of_scope", accountType: "seeker" });
    assert.ok(out);
    assert.doesNotMatch(out, /undefined|null|AJ-/);

    const weather = understandLocally("Who won today's cricket match?");
    assert.equal(weather.intent, "UNRELATED");
  });

  it("preserves language across turns and does not overwrite a saved preference", () => {
    assert.equal(detectLanguage("OK", "te", null, true), "te");
    assert.equal(detectLanguage("driver jobs in Hyderabad", "te", null, true), "en");
    assert.equal(detectLanguage("నాకు డ్రైవర్ జాబ్ కావాలి", "en", null, true), "te");

    const saved = resolveJobSeekerAccountLanguage({
      storedLanguage: "te",
      explicitLanguage: "hi",
      sessionLanguage: "en",
    });
    assert.equal(saved, "te");

    const romanTe = understandLocally("meeru help cheyyandi", "te");
    assert.equal(romanTe.language, "te");
  });

  it("does not call OpenAI assist for protocol or platform guide questions", () => {
    assert.equal(
      shouldUseOpenAiAssist({
        enabled: true,
        hasApiKey: true,
        model: "gpt-4o-mini",
        protocol: true,
        menuIntent: false,
        situation: "greeting",
        userText: "Hi",
        understandingSource: "local",
        language: "en",
      }),
      false,
    );
    assert.equal(assistFor("What is AsliJobs?", "help"), false);
    assert.equal(assistFor("How to find jobs?", "help"), false);
    assert.equal(assistFor("How to register?", "help"), false);
    assert.equal(assistFor("How to contact employer?", "help"), false);
    assert.equal(assistFor("How to apply?", "how_to_apply"), false);
    assert.equal(assistFor("Help", "help"), false);
    assert.equal(shouldUseLlmFallback(understandLocally("Help"), "Help"), false);
    assert.equal(shouldUseLlmFallback(understandLocally("What is AsliJobs?"), "What is AsliJobs?"), false);
  });

  it("keeps translation-failure and missing-data replies free of raw errors", () => {
    const missing = buildDeterministicReply("en", { situation: "clarify", missing: "location" });
    assert.ok(missing);
    assert.doesNotMatch(missing, /undefined|null|TypeError|stack|api[_-]?key/i);

    const failed = buildDeterministicReply("te", { situation: "search_failed", location: "Hyderabad", role: "Driver" });
    assert.ok(failed);
    assert.doesNotMatch(failed, /undefined|null|ECONN|timeout/i);

    const emptyJobs = buildDeterministicReply("en", {
      situation: "jobs",
      empty: true,
      location: "Hyderabad",
      role: "Plumber",
      jobs: [],
      total: 0,
    });
    assert.ok(emptyJobs);
    assert.match(emptyJobs ?? "", /Hyderabad|Plumber|no /i);
    assert.doesNotMatch(emptyJobs ?? "", /undefined|null/);
  });
});
