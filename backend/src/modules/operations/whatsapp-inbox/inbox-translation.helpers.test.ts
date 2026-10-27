import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectInboxSourceLanguage,
  extractProtectedIdentifiers,
  hashInboxSourceText,
  isTranslatableInboxMessage,
} from "./inbox-translation.helpers.js";

describe("inbox translation helpers", () => {
  it("hashes source text stably", () => {
    assert.equal(
      hashInboxSourceText("నాకు ఉద్యోగం కావాలి"),
      hashInboxSourceText("నాకు ఉద్యోగం కావాలి"),
    );
    assert.notEqual(
      hashInboxSourceText("hello"),
      hashInboxSourceText("hello!"),
    );
  });

  it("skips media placeholders and empty bodies", () => {
    assert.equal(
      isTranslatableInboxMessage({ messageType: "audio", body: "[Voice message]" }),
      false,
    );
    assert.equal(
      isTranslatableInboxMessage({ messageType: "image", body: "[Image]" }),
      false,
    );
    assert.equal(
      isTranslatableInboxMessage({ messageType: "document", body: "[Document] resume.pdf" }),
      false,
    );
    assert.equal(
      isTranslatableInboxMessage({ messageType: "text", body: "   " }),
      false,
    );
  });

  it("allows real captions and text messages", () => {
    assert.equal(
      isTranslatableInboxMessage({
        messageType: "text",
        body: "నాకు ఉద్యోగం కావాలి",
      }),
      true,
    );
    assert.equal(
      isTranslatableInboxMessage({
        messageType: "image",
        body: "Site photo from Hyderabad",
      }),
      true,
    );
  });

  it("detects Indic scripts for source language", () => {
    assert.equal(detectInboxSourceLanguage("నాకు ఉద్యోగం కావాలి"), "te");
    assert.equal(detectInboxSourceLanguage("मुझे नौकरी चाहिए"), "hi");
    assert.equal(detectInboxSourceLanguage("Please share your resume"), "en");
  });

  it("extracts URLs and phone numbers for protection", () => {
    const terms = extractProtectedIdentifiers(
      "Call +91 98765 43210 or open https://aslijobs.com/jobs/AJ-12345",
    );
    assert.ok(terms.some((term) => term.includes("98765")));
    assert.ok(terms.some((term) => term.includes("https://aslijobs.com")));
    assert.ok(terms.some((term) => /AJ[-_]?12345/i.test(term)));
  });
});
