import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { INBOX_TRANSLATION_LANGUAGE_OPTIONS } from "../constants/inbox-translation-languages.ts";
import {
  applyComposerTranslation,
  editComposerDraft,
  emptyComposerDraft,
  restoreAuthoredDraft,
  textForNextTranslation,
  translationFailureMessage,
} from "./inbox-draft-translation.ts";

describe("composer draft translation", () => {
  it("keeps the authored English text when translating again", () => {
    const typed = editComposerDraft(emptyComposerDraft(), "Please share your resume.");
    const telugu = applyComposerTranslation(typed, "దయచేసి రెజ్యూమ్ పంపండి.", "te");
    assert.equal(textForNextTranslation(telugu), "Please share your resume.");
    const hindi = applyComposerTranslation(telugu, "कृपया अपना रिज़्यूमे भेजें।", "hi");
    assert.equal(hindi.authoredText, "Please share your resume.");
    assert.equal(hindi.draft, "कृपया अपना रिज़्यूमे भेजें।");
    assert.equal(hindi.targetLanguage, "hi");
  });

  it("restores the exact text from before translation", () => {
    const typed = editComposerDraft(emptyComposerDraft(), "I need a job.");
    const translated = applyComposerTranslation(typed, "నాకు ఉద్యోగం కావాలి.", "te");
    const restored = restoreAuthoredDraft(translated);
    assert.equal(restored.draft, "I need a job.");
    assert.equal(restored.mode, "original");
    assert.equal(restored.targetLanguage, null);
  });

  it("keeps edits to a translated draft until the admin translates again", () => {
    const typed = editComposerDraft(emptyComposerDraft(), "Hello");
    const translated = applyComposerTranslation(typed, "హలో", "te");
    const edited = editComposerDraft(translated, "హలో, ధన్యవాదాలు");
    assert.equal(edited.draft, "హలో, ధన్యవాదాలు");
    assert.equal(edited.authoredText, "Hello");
    assert.equal(edited.targetLanguage, null);
    const again = applyComposerTranslation(edited, "नमस्ते, धन्यवाद", "hi");
    assert.equal(again.authoredText, "హలో, ధన్యవాదాలు");
    assert.equal(restoreAuthoredDraft(again).draft, "హలో, ధన్యవాదాలు");
  });

  it("does not change the draft message when translation fails", () => {
    assert.match(translationFailureMessage("missing_key"), /SARVAM_API_KEY/);
    assert.match(translationFailureMessage("timeout"), /not changed/);
    assert.match(translationFailureMessage("http_error"), /not changed/);
  });

  it("offers all six destination languages from the composer control", () => {
    assert.deepEqual(
      INBOX_TRANSLATION_LANGUAGE_OPTIONS.map((option) => option.code),
      ["en", "te", "hi", "ta", "kn", "ml"],
    );
    const panel = readFileSync(
      new URL("../components/operations/inbox/InboxChatPanel.tsx", import.meta.url),
      "utf8",
    );
    assert.equal(panel.includes("setDraftLanguageMenuOpen((open) => !open)"), true);
    assert.equal(panel.includes("fetchWhatsAppInboxRecipientLanguage"), false);
    assert.equal(panel.includes("translateWhatsAppInboxDraft"), true);
    assert.equal(panel.includes("onSend(caption"), true);
  });
});