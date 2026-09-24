import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  clarifyJobTitle,
  mergePending,
  nationalPhone,
  parseUnderstanding,
  renderJobSearchReply,
  toPublicJobsLookup,
  understandLocally,
  voiceUnclearCopy,
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
    assert.equal(apps.intent, "APPLICATION_STATUS");
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
    assert.match(telugu, /డ్రైవర్/);
    assert.match(telugu, /Acme/);
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

  it("classifies the required languages, applications, employer, and unrelated questions", () => {
    const english = understandLocally("I want driver jobs in Hyderabad");
    assert.equal(english.intent, "JOB_SEARCH");
    assert.equal(english.language, "en");
    assert.equal(english.category, "Driver");
    assert.equal(english.location, "Hyderabad");

    const hindi = understandLocally("हैदराबाद में ड्राइवर की नौकरी है?");
    assert.equal(hindi.language, "hi");
    assert.equal(hindi.category, "Driver");
    assert.equal(hindi.location, "Hyderabad");

    const kannada = understandLocally("ಹೈದರಾಬಾದ್ ಡ್ರೈವರ್ ಕೆಲಸ");
    assert.equal(kannada.language, "kn");
    assert.equal(kannada.intent, "JOB_SEARCH");
    assert.equal(kannada.category, "Driver");

    const malayalam = understandLocally("ഹൈദരാബാദ് ഡ്രൈവർ ജോലി");
    assert.equal(malayalam.language, "ml");
    assert.equal(malayalam.intent, "JOB_SEARCH");
    assert.equal(malayalam.category, "Driver");

    const mixed = understandLocally("naku Hyderabad lo electrician job kavali");
    assert.equal(mixed.language, "te");
    assert.equal(mixed.category, "Electrician");
    assert.equal(mixed.location, "Hyderabad");

    assert.equal(understandLocally("driver", "te").language, "te");
    assert.equal(understandLocally("నా applications ఎన్ని?").intent, "APPLICATION_COUNT");
    assert.equal(understandLocally("నా applications status ఏంటి?").intent, "APPLICATION_STATUS");
    assert.equal(understandLocally("నా profile కి jobs ఉన్నాయా?").intent, "PROFILE_JOBS");
    assert.equal(
      understandLocally("నా jobs కి ఎన్ని applications వచ్చాయి?").intent,
      "EMPLOYER_APPLICATION_COUNT",
    );
    assert.equal(understandLocally("Who won today's match?").intent, "UNRELATED");
    assert.equal(understandLocally("నేను అన్ని jobs కి apply చేశాను").intent, "APPLIED_COVERAGE");
  });

  it("treats a voice transcript as a normal job search", () => {
    const english = understandLocally("I want electrician jobs in Hyderabad");
    assert.equal(english.intent, "JOB_SEARCH");
    assert.equal(english.language, "en");
    assert.equal(english.category, "Electrician");
    assert.equal(english.location, "Hyderabad");

    const telugu = understandLocally("హైదరాబాద్‌లో ఎలక్ట్రీషియన్ ఉద్యోగాలు కావాలి");
    assert.equal(telugu.language, "te");
    assert.equal(telugu.category, "Electrician");
    assert.equal(telugu.location, "Hyderabad");

    const tamil = understandLocally("ஹைதராபாத் டிரைவர்");
    assert.equal(tamil.language, "ta");
    assert.equal(tamil.category, "Driver");
    assert.equal(tamil.location, "Hyderabad");
  });

  it("does not use the job-clarification line for a failed voice note", () => {
    assert.notEqual(voiceUnclearCopy("en"), clarifyJobTitle("en"));
    assert.match(voiceUnclearCopy("te"), /వాయిస్/);
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
