import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  listWhatsAppInboxConversationsQuerySchema,
  openWhatsAppInboxConversationBodySchema,
  sendWhatsAppInboxMessageBodySchema,
  setWhatsAppInboxViewLanguageBodySchema,
  translateWhatsAppInboxDraftBodySchema,
  translateWhatsAppInboxMessagesBodySchema,
} from "./operations-whatsapp-inbox.validation.js";

describe("operations whatsapp inbox validation", () => {
  it("defaults conversation list filters", () => {
    const parsed = listWhatsAppInboxConversationsQuerySchema.parse({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 30);
    assert.equal(parsed.participantType, "all");
  });

  it("rejects empty outbound text", () => {
    const result = sendWhatsAppInboxMessageBodySchema.safeParse({ text: "   " });
    assert.equal(result.success, false);
  });

  it("rejects an open-conversation request without an account id", () => {
    const result = openWhatsAppInboxConversationBodySchema.safeParse({
      participantType: "job_seeker",
      accountId: "not-an-id",
    });
    assert.equal(result.success, false);
  });

  it("accepts a valid outbound payload", () => {
    const parsed = sendWhatsAppInboxMessageBodySchema.parse({
      text: "Hello from Operations",
      clientMessageId: "admin-123",
    });
    assert.equal(parsed.text, "Hello from Operations");
    assert.equal(parsed.clientMessageId, "admin-123");
  });

  it("accepts view-language and translation payloads", () => {
    assert.equal(
      setWhatsAppInboxViewLanguageBodySchema.parse({ language: "te" }).language,
      "te",
    );
    assert.equal(
      setWhatsAppInboxViewLanguageBodySchema.parse({ language: "original" })
        .language,
      "original",
    );
    const translated = translateWhatsAppInboxMessagesBodySchema.parse({
      targetLanguage: "hi",
      messageIds: ["507f1f77bcf86cd799439011"],
    });
    assert.equal(translated.targetLanguage, "hi");
    assert.equal(translated.messageIds.length, 1);
    const draft = translateWhatsAppInboxDraftBodySchema.parse({
      text: "Please share your resume",
      targetLanguage: "te",
    });
    assert.equal(draft.targetLanguage, "te");
    assert.equal(
      translateWhatsAppInboxDraftBodySchema.safeParse({
        text: "Please share your resume",
      }).success,
      false,
    );
  });

  it("rejects unsupported translation languages", () => {
    assert.equal(
      setWhatsAppInboxViewLanguageBodySchema.safeParse({ language: "fr" })
        .success,
      false,
    );
    assert.equal(
      translateWhatsAppInboxMessagesBodySchema.safeParse({
        targetLanguage: "fr",
        messageIds: ["507f1f77bcf86cd799439011"],
      }).success,
      false,
    );
  });
});
