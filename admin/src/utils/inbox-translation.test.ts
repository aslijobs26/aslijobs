import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isTranslatableInboxMessage,
  translationCacheKey,
} from "./inbox-translation.ts";

describe("inbox translation utils", () => {
  it("skips placeholders and keeps real text", () => {
    assert.equal(
      isTranslatableInboxMessage({
        messageType: "audio",
        body: "[Voice message]",
        hasMedia: true,
      }),
      false,
    );
    assert.equal(
      isTranslatableInboxMessage({
        messageType: "text",
        body: "నాకు ఉద్యోగం కావాలి",
        hasMedia: false,
      }),
      true,
    );
  });

  it("builds stable frontend cache keys", () => {
    assert.equal(
      translationCacheKey("c1", "m1", "te"),
      "c1:m1:te",
    );
  });
});
