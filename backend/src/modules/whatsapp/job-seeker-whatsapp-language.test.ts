import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseBotWhatsAppLanguage,
  persistJobSeekerWhatsAppLanguage,
  resolveJobSeekerAccountLanguage,
  resolveJobSeekerNotificationLanguage,
} from "./job-seeker-whatsapp-language.js";

describe("job seeker WhatsApp language preference", () => {
  it("parses bot languages and rejects unknown values", () => {
    assert.equal(parseBotWhatsAppLanguage("te"), "te");
    assert.equal(parseBotWhatsAppLanguage("Telugu"), "te");
    assert.equal(parseBotWhatsAppLanguage("en"), "en");
    assert.equal(parseBotWhatsAppLanguage("hi"), "hi");
    assert.equal(parseBotWhatsAppLanguage(""), null);
    assert.equal(parseBotWhatsAppLanguage("fr"), null);
  });

  it("prefers stored then explicit website language then WhatsApp session", () => {
    assert.equal(
      resolveJobSeekerAccountLanguage({
        storedLanguage: "en",
        explicitLanguage: "te",
        sessionLanguage: "hi",
      }),
      "en",
    );
    assert.equal(
      resolveJobSeekerAccountLanguage({
        storedLanguage: "",
        explicitLanguage: "te",
        sessionLanguage: "hi",
      }),
      "te",
    );
    assert.equal(
      resolveJobSeekerAccountLanguage({
        storedLanguage: "",
        explicitLanguage: "",
        sessionLanguage: "te",
      }),
      "te",
    );
    assert.equal(
      resolveJobSeekerAccountLanguage({
        storedLanguage: "",
        explicitLanguage: "",
        sessionLanguage: "",
      }),
      "",
    );
  });

  it("uses the stored job-seeker language over session lookup", async () => {
    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
        storedLanguage: "te",
      }),
      "te",
    );
    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
        storedLanguage: "en",
      }),
      "en",
    );
  });

  it("defaults to English when no stored language exists and Mongo is disconnected", async () => {
    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
      }),
      "en",
    );
    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
        storedLanguage: "",
        jobSeekerId: "64f0000000000000000000aa",
      }),
      "en",
    );
  });

  it("does not query Mongo when persisting while disconnected", async () => {
    await persistJobSeekerWhatsAppLanguage({
      phone: "9876543210",
      language: "te",
      jobSeekerId: "64f0000000000000000000aa",
    });
  });
});
