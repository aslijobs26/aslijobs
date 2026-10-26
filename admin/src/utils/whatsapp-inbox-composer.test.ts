import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatAttachmentSize,
  insertEmojiAtSelection,
  validateInboxAttachment,
} from "./whatsapp-inbox-composer.ts";

describe("whatsapp inbox composer", () => {
  it("inserts an emoji at the start, middle, and end", () => {
    assert.deepEqual(insertEmojiAtSelection("Hello", 0, 0, "🙂"), {
      value: "🙂Hello",
      cursor: 2,
    });
    assert.deepEqual(insertEmojiAtSelection("Hello", 2, 2, "🙂"), {
      value: "He🙂llo",
      cursor: 4,
    });
    assert.deepEqual(insertEmojiAtSelection("", 0, 0, "🙂"), {
      value: "🙂",
      cursor: 2,
    });
    const combined = insertEmojiAtSelection("Hi ", 3, 3, "🎉");
    assert.equal(combined.value, "Hi 🎉");
  });

  it("rejects unsupported and oversized files and accepts a pdf", () => {
    assert.equal(
      validateInboxAttachment({ type: "application/zip", size: 100 }),
      "This file type cannot be sent on WhatsApp.",
    );
    assert.match(
      validateInboxAttachment({ type: "image/png", size: 6 * 1024 * 1024 }) ?? "",
      /5 MB/,
    );
    assert.equal(
      validateInboxAttachment({ type: "application/pdf", size: 2048 }),
      null,
    );
    assert.equal(formatAttachmentSize(2048), "2 KB");
  });
});
