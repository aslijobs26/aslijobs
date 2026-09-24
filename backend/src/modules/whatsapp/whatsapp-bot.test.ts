import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  formatJobFacts,
  mergePending,
  nationalPhone,
  parseUnderstanding,
  understandLocally,
} from "./whatsapp-bot.logic.js";
import { verifyWhatsAppSignature } from "./whatsapp-signature.js";

describe("whatsapp bot", () => {
  it("normalizes cloud recipient numbers to 10 digits", () => {
    assert.equal(nationalPhone("919876543210"), "9876543210");
  });

  it("routes Telugu job search locally without inventing jobs", () => {
    const understood = understandLocally("Hyderabad lo driver job undha?");
    assert.equal(understood.intent, "JOB_SEARCH");
    assert.equal(understood.language, "te");
    assert.equal(understood.location.toLowerCase(), "hyderabad");
    assert.equal(understood.category, "driver");
  });

  it("routes Hindi and English searches", () => {
    assert.equal(understandLocally("Mujhe delivery job chahiye").language, "hi");
    assert.equal(
      understandLocally("Driver jobs in Madhapur").intent,
      "JOB_SEARCH",
    );
  });

  it("keeps prior location when the next turn only gives a category", () => {
    const merged = mergePending(
      { location: "Hyderabad", category: "" },
      understandLocally("Driver"),
    );
    assert.equal(merged.intent, "JOB_SEARCH");
    assert.equal(merged.location, "Hyderabad");
    assert.equal(merged.category, "driver");
  });

  it("parses Sarvam JSON and falls back when invalid", () => {
    const parsed = parseUnderstanding(
      '{"intent":"MY_APPLICATIONS","language":"te","location":"","category":"","jobQuery":""}',
      "na applications",
    );
    assert.equal(parsed.intent, "MY_APPLICATIONS");
    assert.equal(parseUnderstanding("not-json", "hello").intent, "GREETING");
  });

  it("formats only supplied job facts", () => {
    const text = formatJobFacts(
      [
        {
          jobTitle: "Driver",
          companyName: "Acme",
          cityName: "Hyderabad",
          stateName: "Telangana",
          jobId: "AJ-2026-000001",
        },
      ],
      "en",
    );
    assert.match(text, /Driver/);
    assert.match(text, /Acme/);
    assert.equal(formatJobFacts([], "en").includes("No active jobs"), true);
  });

  it("accepts a valid Meta signature and rejects a bad one", () => {
    const body = Buffer.from('{"ok":true}');
    const digest = createHmac("sha256", "secret").update(body).digest("hex");
    assert.equal(
      verifyWhatsAppSignature(body, `sha256=${digest}`, "secret"),
      true,
    );
    assert.equal(
      verifyWhatsAppSignature(body, "sha256=deadbeef", "secret"),
      false,
    );
    assert.equal(verifyWhatsAppSignature(body, undefined, ""), true);
  });
});
