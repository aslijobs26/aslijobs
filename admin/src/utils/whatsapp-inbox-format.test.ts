import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  applicationStatusVariant,
  initialsFromName,
} from "./whatsapp-inbox-format.ts";

describe("whatsapp inbox format helpers", () => {
  it("builds initials from display names", () => {
    assert.equal(initialsFromName("Ravi Kumar"), "RK");
    assert.equal(initialsFromName("BlinkKart"), "BL");
  });

  it("shows the persisted message body without reconstructing template values", () => {
    const panel = readFileSync(
      new URL("../components/operations/inbox/InboxChatPanel.tsx", import.meta.url),
      "utf8",
    );
    const translatedBody = readFileSync(
      new URL(
        "../components/operations/inbox/InboxTranslatedBody.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    assert.equal(translatedBody.includes("whitespace-pre-wrap break-words"), true);
    assert.equal(panel.includes("originalBody={message.body}"), true);
    assert.equal(panel.includes("Historical template details unavailable"), false);
    assert.equal(panel.includes("{{1}}"), false);
  });

  it("renders employer secondary names without splitting the primary heading", () => {
    const chat = readFileSync(
      new URL("../components/operations/inbox/InboxChatPanel.tsx", import.meta.url),
      "utf8",
    );
    const contact = readFileSync(
      new URL("../components/operations/inbox/InboxContactPanel.tsx", import.meta.url),
      "utf8",
    );
    assert.equal(chat.includes("secondaryDisplayName"), true);
    assert.equal(contact.includes("secondaryName"), true);
    assert.equal(contact.includes('split("·")'), false);
    assert.equal(chat.includes('split("·")'), false);
  });

  it("maps application statuses to badge variants", () => {
    assert.equal(applicationStatusVariant("under_review"), "job");
    assert.equal(applicationStatusVariant("applied"), "candidate");
    assert.equal(applicationStatusVariant("rejected"), "high");
  });
});
