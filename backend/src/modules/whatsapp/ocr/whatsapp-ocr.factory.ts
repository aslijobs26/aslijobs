import { env } from "../../../config/env.js";
import type { OcrImageInput, OcrResult, WhatsAppOcrProvider } from "./whatsapp-ocr.types.js";
import { TesseractOcrProvider } from "./whatsapp-ocr.tesseract.provider.js";

let cached: WhatsAppOcrProvider | null = null;

/** Disabled provider — used when WHATSAPP_OCR_ENABLED=false. */
export class DisabledOcrProvider implements WhatsAppOcrProvider {
  readonly name = "disabled";
  async recognizeImage(_input: OcrImageInput): Promise<OcrResult> {
    return { ok: false, errorCode: "disabled", provider: this.name, durationMs: 0 };
  }
}

let testOverride: WhatsAppOcrProvider | null = null;

export function createWhatsAppOcrProvider(): WhatsAppOcrProvider {
  if (testOverride) {
    return testOverride;
  }
  if (!env.WHATSAPP_OCR_ENABLED) {
    return new DisabledOcrProvider();
  }
  if (!cached) {
    cached = new TesseractOcrProvider();
  }
  return cached;
}

/** Test-only: inject a mock provider (bypasses WHATSAPP_OCR_ENABLED). */
export function setWhatsAppOcrProviderForTests(provider: WhatsAppOcrProvider | null): void {
  testOverride = provider;
  if (provider === null) {
    cached = null;
  }
}
