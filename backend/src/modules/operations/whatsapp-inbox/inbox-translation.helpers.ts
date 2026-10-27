import { createHash } from "node:crypto";
import type { BotLanguage } from "../../whatsapp/whatsapp-bot.logic.js";
import { detectLanguage } from "../../whatsapp/whatsapp-bot.logic.js";
import {
  protectProperNouns,
  restoreProperNouns,
  translateText,
} from "../../whatsapp/sarvam-translate.client.js";
import type { InboxTranslationLanguage } from "./inbox-translation.constants.js";

const MEDIA_PLACEHOLDER =
  /^\[(Image|Audio|Video|Voice message|Document)(\]|:|\s)/i;

const CHUNK_LIMIT = 900;

export function hashInboxSourceText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function isTranslatableInboxMessage(input: {
  messageType: string;
  body: string;
}): boolean {
  const body = input.body.trim();
  if (!body) return false;
  if (MEDIA_PLACEHOLDER.test(body)) return false;
  if (body === "[Image]" || body === "[Audio]" || body === "[Video]") {
    return false;
  }
  if (body === "[Voice message]" || body.startsWith("[Document]")) {
    return false;
  }
  return [
    "text",
    "audio_transcript",
    "system",
    "image",
    "document",
    "audio",
    "video",
  ].includes(input.messageType);
}

/** Protect URLs, phones, and AsliJobs-style IDs from being rewritten. */
export function extractProtectedIdentifiers(text: string): string[] {
  const matches = text.match(
    /https?:\/\/[^\s]+|\+?\d[\d\s\-()]{8,}\d|\bAJ[-_]?\d{3,}\b|\bJOB[-_]?\d{3,}\b/gi,
  );
  return matches ? [...new Set(matches)] : [];
}

export function detectInboxSourceLanguage(
  text: string,
  hint?: BotLanguage | null,
): BotLanguage {
  return detectLanguage(text, hint ?? null, hint ?? null, Boolean(hint));
}

const INDIC_SCRIPT: Array<{ language: BotLanguage; pattern: RegExp }> = [
  { language: "te", pattern: /[\u0C00-\u0C7F]/ },
  { language: "hi", pattern: /[\u0900-\u097F]/ },
  { language: "ta", pattern: /[\u0B80-\u0BFF]/ },
  { language: "kn", pattern: /[\u0C80-\u0CFF]/ },
  { language: "ml", pattern: /[\u0D00-\u0D7F]/ },
];

export function confidentInboxScript(text: string): BotLanguage | null {
  for (const entry of INDIC_SCRIPT) {
    if (entry.pattern.test(text)) return entry.language;
  }
  return null;
}

export async function translateInboxText(input: {
  text: string;
  sourceLanguage: BotLanguage;
  targetLanguage: InboxTranslationLanguage;
  /** Composer drafts let Sarvam detect the source so any language pair works. */
  autoDetectSource?: boolean;
}): Promise<{
  text: string;
  translated: boolean;
  skipped: boolean;
  failed: boolean;
  errorCode?: string;
}> {
  const original = input.text.trim();
  if (!original) {
    return { text: input.text, translated: false, skipped: true, failed: false };
  }
  const script = confidentInboxScript(original);
  if (script === input.targetLanguage) {
    return { text: input.text, translated: false, skipped: true, failed: false };
  }
  if (!input.autoDetectSource && input.sourceLanguage === input.targetLanguage) {
    return { text: input.text, translated: false, skipped: true, failed: false };
  }

  const protectedIds = protectProperNouns(
    original,
    extractProtectedIdentifiers(original),
  );

  if (protectedIds.text.length <= 1000) {
    const result = await translateText({
      text: protectedIds.text,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      autoDetectSource: input.autoDetectSource,
      cache: false,
    });
    return {
      text: restoreProperNouns(result.text, protectedIds.tokens),
      translated: result.translated,
      skipped: result.skipped,
      failed: result.failed,
      errorCode: result.errorCode,
    };
  }

  const chunks = splitTranslationChunks(protectedIds.text);
  const translatedChunks: string[] = [];
  let translated = false;
  let failed = false;
  let errorCode: string | undefined;

  for (const chunk of chunks) {
    const result = await translateText({
      text: chunk,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      autoDetectSource: input.autoDetectSource,
      cache: false,
    });
    if (result.failed) {
      failed = true;
      errorCode = result.errorCode;
      translatedChunks.push(chunk);
      continue;
    }
    if (result.translated) translated = true;
    translatedChunks.push(result.text);
  }

  if (failed && !translated) {
    return {
      text: input.text,
      translated: false,
      skipped: false,
      failed: true,
      errorCode,
    };
  }

  return {
    text: restoreProperNouns(translatedChunks.join("\n"), protectedIds.tokens),
    translated,
    skipped: !translated,
    failed: false,
  };
}

function splitTranslationChunks(text: string): string[] {
  if (text.length <= CHUNK_LIMIT) return [text];
  const parts = text.split(/(\n+)/);
  const chunks: string[] = [];
  let current = "";
  for (const part of parts) {
    if (!part) continue;
    if (current.length + part.length <= CHUNK_LIMIT) {
      current += part;
      continue;
    }
    if (current.trim()) chunks.push(current);
    if (part.length <= CHUNK_LIMIT) {
      current = part;
      continue;
    }
    for (let i = 0; i < part.length; i += CHUNK_LIMIT) {
      chunks.push(part.slice(i, i + CHUNK_LIMIT));
    }
    current = "";
  }
  if (current.trim()) chunks.push(current);
  return chunks.length ? chunks : [text.slice(0, CHUNK_LIMIT)];
}
