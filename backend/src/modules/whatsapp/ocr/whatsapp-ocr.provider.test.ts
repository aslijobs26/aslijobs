import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OcrImageInput, OcrResult, WhatsAppOcrProvider } from "./whatsapp-ocr.types.js";
import { DisabledOcrProvider } from "./whatsapp-ocr.factory.js";

class FakeOcrProvider implements WhatsAppOcrProvider {
  readonly name = "fake";
  constructor(private readonly result: OcrResult) {}
  async recognizeImage(_input: OcrImageInput): Promise<OcrResult> {
    return this.result;
  }
}

describe("OCR provider contract", () => {
  it("disabled provider returns disabled without reading buffers", async () => {
    const provider = new DisabledOcrProvider();
    const result = await provider.recognizeImage({
      buffer: Buffer.from("x"),
      mimeType: "image/png",
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.errorCode, "disabled");
  });

  it("fake success result includes truncated text metadata", async () => {
    const provider = new FakeOcrProvider({
      ok: true,
      text: "React Node",
      truncated: false,
      languageHint: "eng",
      provider: "fake",
      durationMs: 12,
    });
    const result = await provider.recognizeImage({
      buffer: Buffer.from([0xff, 0xd8, 0xff]),
      mimeType: "image/jpeg",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.match(result.text, /React/);
  });

  it("fake timeout error is typed", async () => {
    const provider = new FakeOcrProvider({
      ok: false,
      errorCode: "timeout",
      provider: "fake",
      durationMs: 100,
    });
    const result = await provider.recognizeImage({
      buffer: Buffer.alloc(10),
      mimeType: "image/png",
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.errorCode, "timeout");
  });
});
