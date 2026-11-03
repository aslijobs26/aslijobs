import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveJobSeekerAccountLanguage } from "./job-seeker-whatsapp-language.js";
import { detectLanguage, understandLocally } from "./whatsapp-bot.logic.js";

describe("WhatsApp language detection", () => {
  it("detects Telugu and Hindi script", () => {
    assert.equal(detectLanguage("హైదరాబాద్ లో డ్రైవర్ ఉద్యోగాలు ఉన్నాయా?"), "te");
    assert.equal(detectLanguage("నాకు ఉద్యోగం కావాలి"), "te");
    assert.equal(detectLanguage("मुझे हैदराबाद में ड्राइवर की नौकरी चाहिए"), "hi");
    assert.equal(detectLanguage("नौकरी चाहिए"), "hi");
    assert.equal(understandLocally("హైదరాబాద్ లో డ్రైవర్ ఉద్యోగాలు ఉన్నాయా?").language, "te");
    assert.equal(understandLocally("मुझे नौकरी चाहिए").language, "hi");
  });

  it("detects romanized Telugu and Hindi without requiring an older cue spelling", () => {
    assert.equal(detectLanguage("naku driver job"), "te");
    assert.equal(detectLanguage("meeru driver jobs unnara?"), "te");
    assert.equal(detectLanguage("jobs ledu"), "te");
    assert.equal(detectLanguage("Naku Hyderabad lo driver jobs kavali"), "te");
    assert.equal(detectLanguage("job batao"), "hi");
    assert.equal(detectLanguage("hyderabad me driver job"), "hi");
    assert.equal(detectLanguage("muje driver job chahie"), "hi");
    assert.equal(detectLanguage("Mujhe driver naukri chahiye"), "hi");
    assert.equal(understandLocally("naku driver job").language, "te");
    assert.equal(understandLocally("hyderabad me driver job").language, "hi");
  });

  it("keeps English sentences in English after a Telugu session", () => {
    assert.equal(detectLanguage("I need a driver job in Hyderabad", "te", null, true), "en");
    assert.equal(detectLanguage("driver jobs in Hyderabad", "te", null, true), "en");
    assert.equal(detectLanguage("What jobs are available in Hyderabad?", "te", null, true), "en");
    assert.equal(detectLanguage("check my application status", "te", null, true), "en");
    assert.equal(understandLocally("driver jobs in Hyderabad", "te").language, "en");
    assert.equal(understandLocally("What jobs are available in Hyderabad?", "te").language, "en");
    assert.equal(detectLanguage("Show me driver jobs in Hyderabad", "hi"), "en");
  });

  it("inherits the session language for short acknowledgements", () => {
    assert.equal(detectLanguage("Hi", "te"), "te");
    assert.equal(detectLanguage("OK", "te"), "te");
    assert.equal(detectLanguage("Yes", "hi"), "hi");
    assert.equal(detectLanguage("No", "en"), "en");
    assert.equal(detectLanguage("Hai", "en"), "en");
    assert.equal(detectLanguage("Hai", "te"), "te");
    assert.equal(detectLanguage("avunu", "te"), "te");
    assert.equal(detectLanguage("haan", "hi"), "hi");
    assert.equal(detectLanguage("nahi", "hi"), "hi");
    assert.equal(detectLanguage("kadu", "te"), "te");
    assert.equal(understandLocally("avunu", "te").language, "te");
    assert.equal(understandLocally("haan", "hi").language, "hi");
    assert.equal(understandLocally("Hi", "ml").language, "ml");
    assert.equal(detectLanguage("driver", "te", null, true), "te");
    assert.equal(understandLocally("driver", "te").language, "te");
  });

  it("does not treat an English request that starts with Hai as Hindi", () => {
    assert.equal(detectLanguage("Hai I need a driver job", "en"), "en");
    assert.equal(understandLocally("Hai I need a driver job", "en").language, "en");
    assert.equal(detectLanguage("job hai", "en"), "hi");
  });

  it("keeps mixed Telugu grammar in Telugu and English help-me phrases in English", () => {
    assert.equal(detectLanguage("driver jobs kavali in Hyderabad", "en"), "te");
    assert.equal(detectLanguage("Hyderabad lo electrician jobs please", "en"), "te");
    assert.equal(detectLanguage("Show me jobs in హైదరాబాద్"), "te");
    assert.equal(detectLanguage("show me driver jobs", "te", null, true), "en");
    assert.equal(detectLanguage("driver jobs hyderabad", "en", "hi"), "hi");
  });

  it("keeps a saved JobSeeker language ahead of the WhatsApp session", () => {
    assert.equal(
      resolveJobSeekerAccountLanguage({
        storedLanguage: "hi",
        explicitLanguage: "te",
        sessionLanguage: "en",
      }),
      "hi",
    );
    assert.equal(
      resolveJobSeekerAccountLanguage({
        storedLanguage: "",
        explicitLanguage: "",
        sessionLanguage: "te",
      }),
      "te",
    );
  });
});
