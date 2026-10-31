import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  documentDisplayName,
  formatConversationPreview,
  isMediaPlaceholderBody,
  isUnsupportedWhatsAppBody,
  mimeTypeLabel,
  parseContactMessage,
  parseLocationMessage,
} from "./inbox-message-display";

describe("inbox message display helpers", () => {
  it("detects media placeholders and unsupported bodies", () => {
    assert.equal(isMediaPlaceholderBody("[Image]"), true);
    assert.equal(isMediaPlaceholderBody("[Sticker]"), true);
    assert.equal(isMediaPlaceholderBody("[Document] resume.pdf"), true);
    assert.equal(isMediaPlaceholderBody("Hello"), false);
    assert.equal(isUnsupportedWhatsAppBody("[WhatsApp unsupported message]"), true);
    assert.equal(
      isUnsupportedWhatsAppBody(
        "[WhatsApp poll creation message — not available via Cloud API (131051)]",
      ),
      true,
    );
  });

  it("parses location and contact bodies", () => {
    const location = parseLocationMessage(
      "[Location] Madhapur, Hyderabad\n17.4, 78.3\nhttps://maps.google.com/?q=17.4%2C78.3",
    );
    assert.equal(location?.label, "Madhapur, Hyderabad");
    assert.ok(location?.mapsUrl?.includes("maps.google.com"));
    assert.equal(parseLocationMessage("plain text"), null);

    assert.equal(
      parseContactMessage("[Contact] Ravi: +919876543210"),
      "Ravi: +919876543210",
    );
  });

  it("labels document names and mime types", () => {
    assert.equal(
      documentDisplayName({
        id: "1",
        direction: "inbound",
        senderType: "user",
        body: "[Document] offer.pdf",
        messageType: "document",
        hasMedia: true,
        mediaMimeType: "application/pdf",
        mediaFileName: "offer.pdf",
        status: "delivered",
        failureReason: "",
        createdAt: "",
        statusAt: null,
      }),
      "offer.pdf",
    );
    assert.equal(mimeTypeLabel("application/pdf"), "PDF");
    assert.equal(mimeTypeLabel("image/jpeg"), "Image");
    assert.equal(
      formatConversationPreview("[WhatsApp unsupported message]"),
      "⚠️ Unsupported WhatsApp message",
    );
    assert.equal(
      formatConversationPreview("[Document] resume.pdf"),
      "📄 resume.pdf",
    );
  });
});
