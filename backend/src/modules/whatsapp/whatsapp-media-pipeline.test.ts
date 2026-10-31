import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { setWhatsAppOcrProviderForTests } from "./ocr/whatsapp-ocr.factory.js";
import type { OcrImageInput, OcrResult, WhatsAppOcrProvider } from "./ocr/whatsapp-ocr.types.js";
import { detectImageKind } from "./ocr/whatsapp-image-signature.js";
import { extractDocumentText } from "./whatsapp-media-extract.js";
import { mediaEncryptedCopy, mediaOcrEmptyCopy } from "./whatsapp-media-messages.js";

class ScriptedOcr implements WhatsAppOcrProvider {
  readonly name = "scripted";
  constructor(private readonly impl: (input: OcrImageInput) => Promise<OcrResult>) {}
  recognizeImage(input: OcrImageInput): Promise<OcrResult> {
    return this.impl(input);
  }
}

afterEach(() => {
  setWhatsAppOcrProviderForTests(null);
});

describe("media pipeline helpers", () => {
  it("localized OCR empty and encrypted copy exist for en/te/hi", () => {
    assert.match(mediaOcrEmptyCopy("en"), /readable text/i);
    assert.match(mediaOcrEmptyCopy("te"), /టెక్స్ట్/);
    assert.match(mediaEncryptedCopy("en"), /password/i);
    assert.match(mediaEncryptedCopy("hi"), /पासवर्ड/);
  });

  it("scripted OCR provider returns empty for blank images", async () => {
    setWhatsAppOcrProviderForTests(
      new ScriptedOcr(async () => ({
        ok: false,
        errorCode: "empty",
        provider: "scripted",
        durationMs: 1,
      })),
    );
    const { createWhatsAppOcrProvider } = await import("./ocr/whatsapp-ocr.factory.js");
    const result = await createWhatsAppOcrProvider().recognizeImage({
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      mimeType: "image/jpeg",
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.errorCode, "empty");
  });

  it("does not treat PDF magic as an image", () => {
    assert.equal(detectImageKind(Buffer.from("%PDF-1.7")), null);
  });

  it("rejects oversized buffers via extractDocumentText", async () => {
    const huge = Buffer.alloc(9_000_001, 0x61);
    // Force mime/name as txt but size limit should reject first when over env max (default 8MB).
    const result = await extractDocumentText({
      buffer: huge,
      mimeType: "text/plain",
      fileName: "big.txt",
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.reason, "too_large");
  });
});
