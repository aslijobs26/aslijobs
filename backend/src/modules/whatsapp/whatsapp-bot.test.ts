import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  mergePending,
  nationalPhone,
  parseUnderstanding,
  renderJobSearchReply,
  toPublicJobsLookup,
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
    assert.equal(understood.location, "Hyderabad");
    assert.equal(understood.category, "Driver");
    assert.deepEqual(toPublicJobsLookup(understood), {
      search: "Driver",
      city: "Hyderabad",
    });
  });

  it("understands Telugu script, Hindi script, English, and mixed chat", () => {
    const madhapur = understandLocally("మాధాపూర్ లో డ్రైవర్ జాబ్ ఉందా?");
    assert.equal(madhapur.language, "te");
    assert.equal(madhapur.intent, "JOB_SEARCH");
    assert.equal(madhapur.location, "Madhapur");
    assert.equal(madhapur.category, "Driver");

    const delivery = understandLocally("హైదరాబాద్ లో డెలివరీ జాబ్స్ ఉన్నాయా?");
    assert.equal(delivery.language, "te");
    assert.equal(delivery.location, "Hyderabad");
    assert.equal(delivery.category, "Delivery");

    const apps = understandLocally("నా అప్లికేషన్స్ ఏ స్టేజ్ లో ఉన్నాయి?");
    assert.equal(apps.intent, "MY_APPLICATIONS");
    assert.equal(apps.language, "te");

    const profile = understandLocally("నా ప్రొఫైల్ కి సరిపోయే జాబ్స్ ఉన్నాయా?");
    assert.equal(profile.intent, "PROFILE_JOBS");
    assert.equal(profile.language, "te");

    const hindi = understandLocally("माधापुर में ड्राइवर की नौकरी है क्या?");
    assert.equal(hindi.language, "hi");
    assert.equal(hindi.intent, "JOB_SEARCH");
    assert.equal(hindi.location, "Madhapur");
    assert.equal(hindi.category, "Driver");

    const english = understandLocally("Are there driver jobs in Madhapur?");
    assert.equal(english.language, "en");
    assert.equal(english.location, "Madhapur");
    assert.equal(english.category, "Driver");

    const mixed = understandLocally("madhapur lo delivery jobs unnaya?");
    assert.equal(mixed.language, "te");
    assert.equal(mixed.location, "Madhapur");
    assert.equal(mixed.category, "Delivery");

    const profileMixed = understandLocally("na profile ki jobs unnaya?");
    assert.equal(profileMixed.intent, "PROFILE_JOBS");
    assert.equal(profileMixed.language, "te");
  });

  it("replies in the user's language and only with supplied jobs", () => {
    const telugu = renderJobSearchReply({
      language: "te",
      location: "Madhapur",
      jobTitle: "Driver",
      jobs: [
        {
          jobTitle: "Driver",
          companyName: "Acme",
          cityName: "Madhapur",
          stateName: "Telangana",
          jobId: "AJ-1",
          salaryLabel: "₹18,000–₹25,000",
        },
      ],
    });
    assert.match(telugu, /అవును/);
    assert.match(telugu, /Driver/);
    assert.match(telugu, /₹18,000–₹25,000/);
    assert.doesNotMatch(telugu, /Kanipinchina/);

    const empty = renderJobSearchReply({
      language: "te",
      location: "Madhapur",
      jobTitle: "Driver",
      jobs: [],
    });
    assert.match(empty, /కనిపించలేదు/);
    assert.doesNotMatch(empty, /Kanipinchina/);
  });

  it("keeps prior location when the next turn only gives a category", () => {
    const merged = mergePending(
      { location: "Hyderabad", category: "" },
      understandLocally("Driver"),
    );
    assert.equal(merged.intent, "JOB_SEARCH");
    assert.equal(merged.location, "Hyderabad");
    assert.equal(merged.category, "Driver");
  });

  it("parses Sarvam JSON and falls back when invalid", () => {
    const parsed = parseUnderstanding(
      '{"intent":"MY_APPLICATIONS","language":"te","location":"","category":"","jobQuery":""}',
      "na applications",
    );
    assert.equal(parsed.intent, "MY_APPLICATIONS");
    assert.equal(parseUnderstanding("not-json", "hello").intent, "GREETING");
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
