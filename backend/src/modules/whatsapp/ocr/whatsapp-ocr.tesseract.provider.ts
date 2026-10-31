import { createWorker, type Worker } from "tesseract.js";
import type { OcrImageInput, OcrResult, WhatsAppOcrProvider } from "./whatsapp-ocr.types.js";
import {
  detectImageKind,
  declaredMimeMatchesImage,
  readImageDimensions,
} from "./whatsapp-image-signature.js";

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_EDGE = 4_096;
const DEFAULT_MAX_TEXT = 12_000;
const DEFAULT_TIMEOUT_MS = 45_000;

let sharedWorker: Worker | null = null;
let sharedWorkerLangs = "";
let workerInit: Promise<Worker> | null = null;

async function getWorker(languages: string): Promise<Worker> {
  if (sharedWorker && sharedWorkerLangs === languages) {
    return sharedWorker;
  }
  if (workerInit) {
    return workerInit;
  }
  workerInit = (async () => {
    if (sharedWorker) {
      await sharedWorker.terminate().catch(() => undefined);
      sharedWorker = null;
    }
    // Official tesseract.js API: createWorker(langs)
    const worker = await createWorker(languages);
    sharedWorker = worker;
    sharedWorkerLangs = languages;
    workerInit = null;
    return worker;
  })();
  return workerInit;
}

/** Test helper — terminate shared worker between suites. */
export async function resetTesseractWorker(): Promise<void> {
  workerInit = null;
  if (sharedWorker) {
    await sharedWorker.terminate().catch(() => undefined);
    sharedWorker = null;
  }
  sharedWorkerLangs = "";
}

function truncate(text: string, maxChars: number): { text: string; truncated: boolean } {
  const normalized = text.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").trim();
  if (normalized.length <= maxChars) return { text: normalized, truncated: false };
  return { text: normalized.slice(0, maxChars), truncated: true };
}

/**
 * Local WASM OCR via tesseract.js (no native OS packages required).
 * Docs: https://github.com/naptha/tesseract.js — recognize(image) on Buffer/URL.
 */
export class TesseractOcrProvider implements WhatsAppOcrProvider {
  readonly name = "tesseract.js";

  async recognizeImage(input: OcrImageInput): Promise<OcrResult> {
    const started = Date.now();
    const maxText = input.maxTextChars ?? DEFAULT_MAX_TEXT;
    const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const languages = (input.languages ?? "eng").trim() || "eng";

    if (!input.buffer.length || input.buffer.length > DEFAULT_MAX_BYTES) {
      return {
        ok: false,
        errorCode: input.buffer.length > DEFAULT_MAX_BYTES ? "too_large" : "empty",
        provider: this.name,
        durationMs: Date.now() - started,
      };
    }

    const kind = detectImageKind(input.buffer);
    if (!kind) {
      return {
        ok: false,
        errorCode: "unsupported_image",
        provider: this.name,
        durationMs: Date.now() - started,
      };
    }
    if (!declaredMimeMatchesImage(input.mimeType, kind)) {
      return {
        ok: false,
        errorCode: "unsupported_image",
        provider: this.name,
        durationMs: Date.now() - started,
      };
    }

    const dims = readImageDimensions(input.buffer, kind);
    if (dims && (dims.width > DEFAULT_MAX_EDGE || dims.height > DEFAULT_MAX_EDGE)) {
      return {
        ok: false,
        errorCode: "dimensions",
        provider: this.name,
        durationMs: Date.now() - started,
      };
    }

    try {
      const result = await Promise.race([
        (async (): Promise<OcrResult> => {
          const worker = await getWorker(languages);
          const recognized = await worker.recognize(input.buffer);
          const raw = recognized.data?.text ?? "";
          const { text, truncated } = truncate(raw, maxText);
          if (!text) {
            return {
              ok: false,
              errorCode: "empty",
              provider: this.name,
              durationMs: Date.now() - started,
            };
          }
          return {
            ok: true,
            text,
            truncated,
            languageHint: languages,
            provider: this.name,
            durationMs: Date.now() - started,
          };
        })(),
        new Promise<OcrResult>((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: false,
                errorCode: "timeout",
                provider: this.name,
                durationMs: Date.now() - started,
              }),
            timeoutMs,
          ),
        ),
      ]);
      return result;
    } catch {
      return {
        ok: false,
        errorCode: "provider_error",
        provider: this.name,
        durationMs: Date.now() - started,
      };
    }
  }
}
