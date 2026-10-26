import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  listWhatsAppInboxConversationsQuerySchema,
  openWhatsAppInboxConversationBodySchema,
  sendWhatsAppInboxMessageBodySchema,
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
});
