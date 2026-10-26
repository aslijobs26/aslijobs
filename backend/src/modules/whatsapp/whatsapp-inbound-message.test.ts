import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  describeInboundWhatsAppMessage,
  isWebhookForConfiguredPhone,
  whatsAppWebhookTime,
} from "./whatsapp-inbound-message.js";

describe("inbound WhatsApp messages", () => {
  it("keeps the customer's text, including Hi", () => {
    assert.deepEqual(
      describeInboundWhatsAppMessage({ type: "text", text: { body: "Hi" } }),
      { body: "Hi", messageType: "text" },
    );
  });

  it("stores a safe label for media instead of dropping it", () => {
    assert.equal(
      describeInboundWhatsAppMessage({ type: "image" })?.body,
      "[Image]",
    );
    assert.equal(
      describeInboundWhatsAppMessage({ type: "audio" })?.messageType,
      "audio_transcript",
    );
    assert.equal(
      describeInboundWhatsAppMessage({
        type: "document",
        document: { filename: "resume.pdf" },
      })?.body,
      "[Document] resume.pdf",
    );
  });

  it("uses the provider timestamp and ignores events for another phone number id", () => {
    assert.equal(
      whatsAppWebhookTime("1710000000")?.toISOString(),
      "2024-03-09T16:00:00.000Z",
    );
    assert.equal(whatsAppWebhookTime("not-a-time"), undefined);
    assert.equal(isWebhookForConfiguredPhone("123", "123"), true);
    assert.equal(isWebhookForConfiguredPhone("999", "123"), false);
    assert.equal(isWebhookForConfiguredPhone(undefined, "123"), true);
  });

  it("checks the latest human-handoff state before a bot reply is sent", () => {
    const source = readFileSync(
      new URL("./whatsapp.service.ts", import.meta.url),
      "utf8",
    );
    const start = source.indexOf("async sendTextMessage");
    const slice = source.slice(start, source.indexOf("async downloadMedia"));
    const pause = slice.indexOf("isBotPausedForPhone(phoneNumber)");
    const send = slice.indexOf("this.sendSessionTextMessage(phoneNumber, body)");
    assert.ok(pause > 0);
    assert.ok(send > pause);
  });
});
