import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  describeInboundWhatsAppMessage,
  inboxListPreview,
  isWebhookForConfiguredPhone,
  whatsAppWebhookTime,
} from "./whatsapp-inbound-message.js";

describe("inbound WhatsApp messages", () => {
  it("keeps the customer's text, including Hi", () => {
    assert.deepEqual(
      describeInboundWhatsAppMessage({ type: "text", text: { body: "Hi" } }),
      {
        body: "Hi",
        messageType: "text",
        mediaProviderId: "",
        mediaMimeType: "",
        mediaFileName: "",
      },
    );
  });

  it("stores a safe label for media instead of dropping it", () => {
    assert.equal(
      describeInboundWhatsAppMessage({ type: "image" })?.body,
      "[Image]",
    );
    const image = describeInboundWhatsAppMessage({
      type: "image",
      image: { id: "media-1", mime_type: "image/jpeg", caption: "Site photo" },
    });
    assert.equal(image?.messageType, "image");
    assert.equal(image?.mediaProviderId, "media-1");
    assert.equal(image?.mediaMimeType, "image/jpeg");
    assert.equal(image?.body, "Site photo");
    const document = describeInboundWhatsAppMessage({
      type: "document",
      document: { id: "doc-1", mime_type: "application/pdf", filename: "resume.pdf" },
    });
    assert.equal(document?.messageType, "document");
    assert.equal(document?.mediaProviderId, "doc-1");
    assert.equal(
      describeInboundWhatsAppMessage({ type: "audio" })?.messageType,
      "audio",
    );
    assert.equal(
      describeInboundWhatsAppMessage({
        type: "document",
        document: { filename: "resume.pdf" },
      })?.body,
      "[Document] resume.pdf",
    );
  });

  it("stores sticker media so the inbox can preview it", () => {
    const sticker = describeInboundWhatsAppMessage({
      type: "sticker",
      sticker: { id: "stk-1", mime_type: "image/webp" },
    });
    assert.equal(sticker?.messageType, "image");
    assert.equal(sticker?.mediaProviderId, "stk-1");
    assert.equal(sticker?.body, "[Sticker]");
    assert.equal(sticker?.mediaMimeType, "image/webp");
  });

  it("preserves location coordinates and contact details", () => {
    const location = describeInboundWhatsAppMessage({
      type: "location",
      location: {
        name: "Madhapur",
        address: "Hyderabad",
        latitude: 17.448,
        longitude: 78.391,
      },
    });
    assert.equal(location?.messageType, "text");
    assert.match(location?.body ?? "", /\[Location\] Madhapur/);
    assert.match(location?.body ?? "", /maps\.google\.com/);

    const contacts = describeInboundWhatsAppMessage({
      type: "contacts",
      contacts: [
        {
          name: { formatted_name: "Ravi Kumar" },
          phones: [{ phone: "+919876543210" }],
        },
      ],
    });
    assert.match(contacts?.body ?? "", /\[Contact\] Ravi Kumar: \+919876543210/);
  });

  it("explains Meta unsupported payloads without inventing media", () => {
    const unsupported = describeInboundWhatsAppMessage({
      type: "unsupported",
      unsupported: { type: "poll_creation" },
      errors: [
        {
          code: 131051,
          title: "Message type unknown",
          error_data: { details: "Message type is currently not supported." },
        },
      ],
    });
    assert.equal(unsupported?.messageType, "text");
    assert.equal(unsupported?.mediaProviderId, "");
    assert.match(unsupported?.body ?? "", /poll creation/i);
    assert.match(unsupported?.body ?? "", /131051/);
  });

  it("recovers media when type is wrong but a media object is present", () => {
    const recovered = describeInboundWhatsAppMessage({
      type: "unsupported",
      image: { id: "img-9", mime_type: "image/jpeg", caption: "Gate photo" },
    });
    assert.equal(recovered?.messageType, "image");
    assert.equal(recovered?.mediaProviderId, "img-9");
    assert.equal(recovered?.body, "Gate photo");
  });

  it("builds media-aware conversation list previews", () => {
    assert.equal(
      inboxListPreview({
        body: "[Image]",
        messageType: "image",
      }),
      "📷 Image",
    );
    assert.equal(
      inboxListPreview({
        body: "[Document] resume.pdf",
        messageType: "document",
        mediaFileName: "resume.pdf",
      }),
      "📄 resume.pdf",
    );
    assert.equal(
      inboxListPreview({
        body: "[WhatsApp unsupported message]",
        messageType: "text",
      }),
      "⚠️ Unsupported WhatsApp message",
    );
    assert.equal(
      inboxListPreview({
        body: "[Sticker]",
        messageType: "image",
      }),
      "🎨 Sticker",
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
