import mammoth from "mammoth";
import { PasswordException, PDFParse } from "pdf-parse";
import { env } from "../../config/env.js";
import { createWhatsAppOcrProvider } from "./ocr/whatsapp-ocr.factory.js";
import type { OcrResult } from "./ocr/whatsapp-ocr.types.js";

export type ExtractableDocumentKind = "pdf" | "docx" | "txt" | "unsupported";

const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
const DOCX_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // PK..
const ZIP_MAGIC = DOCX_MAGIC;
const EXE_MZ = Buffer.from([0x4d, 0x5a]);

/** Minimum alphanumeric chars to treat digital PDF text as usable. */
export const MIN_USABLE_DIGITAL_CHARS = 40;

export function maxExtractChars(): number {
  return env.WHATSAPP_MEDIA_MAX_EXTRACT_CHARS;
}

export function maxMediaBufferBytes(): number {
  return env.WHATSAPP_MEDIA_MAX_BYTES;
}

export function maxPdfPages(): number {
  return env.WHATSAPP_OCR_MAX_PDF_PAGES;
}

export function detectDocumentKind(
  mimeType: string,
  fileName: string,
  buffer: Buffer,
): ExtractableDocumentKind {
  const mime = mimeType.trim().toLowerCase().split(";")[0] ?? "";
  const name = fileName.trim().toLowerCase();

  // Reject executables even if renamed.
  if (buffer.length >= 2 && buffer.subarray(0, 2).equals(EXE_MZ)) {
    return "unsupported";
  }

  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(PDF_MAGIC)) {
    return "pdf";
  }
  if (
    (mime === "application/pdf" || name.endsWith(".pdf")) &&
    !(buffer.length >= 4 && buffer.subarray(0, 4).equals(PDF_MAGIC))
  ) {
    // Declared PDF but wrong magic → unsupported (spoof).
    return "unsupported";
  }

  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    if (buffer.length >= 4 && buffer.subarray(0, 4).equals(DOCX_MAGIC)) return "docx";
    return "unsupported";
  }

  // Bare ZIP / RAR without DOCX intent.
  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(ZIP_MAGIC)) {
    if (name.endsWith(".zip") || mime === "application/zip") return "unsupported";
  }
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "Rar!") {
    return "unsupported";
  }

  if (mime === "text/plain" || name.endsWith(".txt")) {
    // Reject binary-looking "txt".
    const sample = buffer.subarray(0, Math.min(buffer.length, 512));
    if (sample.includes(0)) return "unsupported";
    return "txt";
  }

  if (mime === "application/msword" || name.endsWith(".doc")) return "unsupported";
  return "unsupported";
}

export type MediaExtractResult =
  | {
      ok: true;
      kind: ExtractableDocumentKind;
      text: string;
      truncated: boolean;
      source: "digital" | "ocr" | "mixed";
      pageCount?: number;
      ocrProvider?: string;
    }
  | {
      ok: false;
      kind: ExtractableDocumentKind;
      reason:
        | "unsupported"
        | "empty"
        | "too_large"
        | "parse_failed"
        | "timeout"
        | "encrypted"
        | "too_many_pages"
        | "ocr_disabled"
        | "ocr_failed";
    };

export function truncateExtractedText(
  text: string,
  maxChars = maxExtractChars(),
): { text: string; truncated: boolean } {
  const normalized = text.replace(/\u0000/g, "").replace(/\s+\n/g, "\n").trim();
  if (normalized.length <= maxChars) {
    return { text: normalized, truncated: false };
  }
  return { text: normalized.slice(0, maxChars), truncated: true };
}

export function isUsableDigitalText(text: string): boolean {
  const alnum = text.replace(/[^0-9A-Za-z\u0C00-\u0C7F\u0900-\u097F\u0B80-\u0BFF\u0C80-\u0CFF\u0D00-\u0D7F]/g, "");
  return alnum.length >= MIN_USABLE_DIGITAL_CHARS;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout: () => T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(onTimeout()), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function ocrPdfPages(input: {
  buffer: Buffer;
  maxPages: number;
}): Promise<OcrResult & { pageCount?: number }> {
  const ocr = createWhatsAppOcrProvider();
  if (ocr.name === "disabled") {
    return { ok: false, errorCode: "disabled", provider: "disabled", durationMs: 0 };
  }

  const started = Date.now();
  const parser = new PDFParse({ data: input.buffer });
  try {
    const info = await parser.getInfo();
    const totalPages = Number(info.total ?? 0);
    if (!Number.isFinite(totalPages) || totalPages < 1) {
      return {
        ok: false,
        errorCode: "provider_error",
        provider: ocr.name,
        durationMs: Date.now() - started,
      };
    }
    if (totalPages > input.maxPages) {
      return {
        ok: false,
        errorCode: "too_many_pages",
        provider: ocr.name,
        durationMs: Date.now() - started,
        pageCount: totalPages,
      };
    }

    // Render pages via pdf-parse getScreenshot (PNG buffers) — no node-canvas.
    const scale = Math.min(2, Math.max(1, env.WHATSAPP_OCR_PDF_SCALE));
    const shot = await parser.getScreenshot({
      scale,
      imageBuffer: true,
      imageDataUrl: false,
      first: totalPages,
    });

    const pages = shot.pages ?? [];
    const parts: string[] = [];
    for (let i = 0; i < pages.length; i += 1) {
      const page = pages[i];
      const buf = page?.data;
      if (!buf || !(buf instanceof Uint8Array || Buffer.isBuffer(buf))) continue;
      const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
      const pageOcr = await ocr.recognizeImage({
        buffer,
        mimeType: "image/png",
        languages: env.WHATSAPP_OCR_LANGUAGES,
        timeoutMs: env.WHATSAPP_OCR_TIMEOUT_MS,
        maxTextChars: maxExtractChars(),
      });
      if (pageOcr.ok && pageOcr.text.trim()) {
        parts.push(pageOcr.text.trim());
      }
    }

    const joined = parts.join("\n\n");
    const { text, truncated } = truncateExtractedText(joined);
    if (!text) {
      return {
        ok: false,
        errorCode: "empty",
        provider: ocr.name,
        durationMs: Date.now() - started,
        pageCount: totalPages,
      };
    }
    return {
      ok: true,
      text,
      truncated,
      languageHint: env.WHATSAPP_OCR_LANGUAGES,
      provider: ocr.name,
      durationMs: Date.now() - started,
      pageCount: totalPages,
    };
  } catch (error) {
    if (error instanceof PasswordException) {
      return {
        ok: false,
        errorCode: "encrypted",
        provider: ocr.name,
        durationMs: Date.now() - started,
      };
    }
    return {
      ok: false,
      errorCode: "provider_error",
      provider: ocr.name,
      durationMs: Date.now() - started,
    };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

/**
 * Extract plain text from digital PDF / DOCX / TXT.
 * Scanned PDFs: digital first, then OCR via pdf-parse screenshots + tesseract.js when enabled.
 */
export async function extractDocumentText(input: {
  buffer: Buffer;
  mimeType: string;
  fileName?: string;
  allowOcr?: boolean;
}): Promise<MediaExtractResult> {
  const maxBytes = maxMediaBufferBytes();
  if (!input.buffer.length || input.buffer.length > maxBytes) {
    return {
      ok: false,
      kind: "unsupported",
      reason: input.buffer.length > maxBytes ? "too_large" : "empty",
    };
  }
  const kind = detectDocumentKind(input.mimeType, input.fileName ?? "", input.buffer);
  if (kind === "unsupported") {
    return { ok: false, kind, reason: "unsupported" };
  }

  const timeoutMs = env.WHATSAPP_MEDIA_EXTRACT_TIMEOUT_MS;
  return withTimeout(
    extractDocumentTextInner({ ...input, kind, allowOcr: input.allowOcr !== false }),
    timeoutMs,
    () => ({ ok: false as const, kind, reason: "timeout" as const }),
  );
}

async function extractDocumentTextInner(input: {
  buffer: Buffer;
  mimeType: string;
  fileName?: string;
  kind: ExtractableDocumentKind;
  allowOcr: boolean;
}): Promise<MediaExtractResult> {
  const { kind } = input;
  try {
    if (kind === "txt") {
      const { text, truncated } = truncateExtractedText(input.buffer.toString("utf8"));
      if (!text) return { ok: false, kind, reason: "empty" };
      return { ok: true, kind, text, truncated, source: "digital" };
    }

    if (kind === "docx") {
      const result = await mammoth.extractRawText({ buffer: input.buffer });
      const { text, truncated } = truncateExtractedText(result.value ?? "");
      if (!text) return { ok: false, kind, reason: "empty" };
      return { ok: true, kind, text, truncated, source: "digital" };
    }

    // PDF: digital text first.
    const parser = new PDFParse({ data: input.buffer });
    let digitalText = "";
    let pageCount = 0;
    try {
      const info = await parser.getInfo();
      pageCount = Number(info.total ?? 0);
      if (pageCount > maxPdfPages()) {
        return { ok: false, kind, reason: "too_many_pages" };
      }
      const parsed = await parser.getText();
      digitalText =
        typeof parsed === "string"
          ? parsed
          : typeof parsed?.text === "string"
            ? parsed.text
            : "";
    } catch (error) {
      if (error instanceof PasswordException) {
        return { ok: false, kind, reason: "encrypted" };
      }
      // Fall through to OCR if digital parse fails.
      digitalText = "";
    } finally {
      await parser.destroy().catch(() => undefined);
    }

    const digitalUsable = isUsableDigitalText(digitalText);
    if (digitalUsable) {
      const { text, truncated } = truncateExtractedText(digitalText);
      // Mixed: if very short relative to pages, still try OCR for extra pages when OCR on.
      const words = countWords(text);
      const likelyThin =
        pageCount > 1 && words < MIN_USABLE_DIGITAL_CHARS * pageCount * 0.5;
      if (!likelyThin || !input.allowOcr || !env.WHATSAPP_OCR_ENABLED) {
        return {
          ok: true,
          kind,
          text,
          truncated,
          source: "digital",
          pageCount,
        };
      }
      const ocr = await ocrPdfPages({ buffer: input.buffer, maxPages: maxPdfPages() });
      if (ocr.ok) {
        const merged = truncateExtractedText(`${text}\n\n${ocr.text}`);
        return {
          ok: true,
          kind,
          text: merged.text,
          truncated: merged.truncated,
          source: "mixed",
          pageCount: ocr.pageCount ?? pageCount,
          ocrProvider: ocr.provider,
        };
      }
      return {
        ok: true,
        kind,
        text,
        truncated,
        source: "digital",
        pageCount,
      };
    }

    if (!input.allowOcr || !env.WHATSAPP_OCR_ENABLED) {
      return {
        ok: false,
        kind,
        reason: env.WHATSAPP_OCR_ENABLED ? "empty" : "ocr_disabled",
      };
    }

    const ocr = await ocrPdfPages({ buffer: input.buffer, maxPages: maxPdfPages() });
    if (!ocr.ok) {
      if (ocr.errorCode === "disabled") return { ok: false, kind, reason: "ocr_disabled" };
      if (ocr.errorCode === "encrypted") return { ok: false, kind, reason: "encrypted" };
      if (ocr.errorCode === "too_many_pages") {
        return { ok: false, kind, reason: "too_many_pages" };
      }
      if (ocr.errorCode === "timeout") return { ok: false, kind, reason: "timeout" };
      return { ok: false, kind, reason: "ocr_failed" };
    }
    return {
      ok: true,
      kind,
      text: ocr.text,
      truncated: ocr.truncated,
      source: "ocr",
      pageCount: ocr.pageCount,
      ocrProvider: ocr.provider,
    };
  } catch (error) {
    if (error instanceof PasswordException) {
      return { ok: false, kind, reason: "encrypted" };
    }
    return { ok: false, kind, reason: "parse_failed" };
  }
}

/** Lightweight skill/keyword harvest — facts only from extracted text, never invented. */
export function extractResumeHints(text: string): {
  skills: string[];
  missingHints: string[];
  looksLikeJobAd: boolean;
  looksLikeResume: boolean;
} {
  const lower = text.toLowerCase();
  const skillCandidates = [
    "react",
    "node",
    "javascript",
    "typescript",
    "python",
    "java",
    "sql",
    "excel",
    "sales",
    "marketing",
    "accounting",
    "driver",
    "electrician",
    "plumber",
    "carpenter",
    "nursing",
    "teaching",
    "customer service",
  ];
  const skills = skillCandidates.filter((skill) => lower.includes(skill)).slice(0, 8);
  const missingHints: string[] = [];
  if (!/\b(experience|years|yr)\b/i.test(text)) missingHints.push("experience");
  if (!/\b(education|degree|b\.?tech|b\.?com|mba|sslc|intermediate)\b/i.test(text)) {
    missingHints.push("education");
  }
  if (!/\b(phone|mobile|\+?\d{10})\b/i.test(text)) missingHints.push("phone");

  const looksLikeJobAd =
    /\b(job description|responsibilities|requirements|we are hiring|vacancy|apply now|salary)\b/i.test(
      text,
    ) || /\b(ఉద్యోగం|नौकरी|வேலை|ಉದ್ಯೋಗ|ജോലി)\b/.test(text);
  const looksLikeResume =
    /\b(resume|curriculum vitae|\bcv\b|work experience|education|skills)\b/i.test(text) ||
    /\b(రెజ్యూమ్|रिज़्यूमे|ரெஸ்யூம்)\b/.test(text);

  return { skills, missingHints, looksLikeJobAd, looksLikeResume };
}
