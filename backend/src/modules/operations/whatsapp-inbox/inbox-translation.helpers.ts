import { createHash } from "node:crypto";
import type { BotLanguage } from "../../whatsapp/whatsapp-bot.logic.js";
import { detectLanguage } from "../../whatsapp/whatsapp-bot.logic.js";
import {
  protectProperNouns,
  restoreProperNouns,
  SARVAM_TRANSLATE_INPUT_MAX,
  translateText,
  type TranslateTextInput,
  type TranslateTextResult,
} from "../../whatsapp/sarvam-translate.client.js";
import {
  INBOX_TRANSLATION_PIPELINE_VERSION,
  type InboxTranslationLanguage,
} from "./inbox-translation.constants.js";

const MEDIA_PLACEHOLDER =
  /^\[(Image|Audio|Video|Voice message|Sticker|Document|Location|Contact|Reaction|WhatsApp)(\]|:|\s)/i;

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

const URL_PATTERN = /https?:\/\/[^\s<>\[]+/gi;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_PATTERN = /(?:\+\d[\d\s\-()]{8,}\d|\b\d{10,15}\b)/g;
const JOB_ID_PATTERN = /\b(?:AJ|JOB)(?:[-_]\d+)+/gi;
const MONEY_PATTERN =
  /(?:₹|Rs\.?|INR)\s*[\d,]+(?:\s*[–—-]\s*(?:₹|Rs\.?|INR)?\s*[\d,]+)?/gi;
const DATE_PATTERN = /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g;
const EMOJI_PATTERN =
  /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu;
const LIST_PREFIX_PATTERN = /^(\s*(?:\d{1,3}[.)]|[-•*])\s+)/;
const LEADING_EMOJI_PATTERN =
  /^((?:\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*\s*)+)/u;
const SENTENCE_END_PATTERN = /[.!?।]["')\]]*\s*$/u;
const LAYOUT_SEPARATOR = "[[AJBR]]";
const TRANSLATION_CACHE_LIMIT = 200;

type InboxTranslationOutcome = {
  text: string;
  translated: boolean;
  skipped: boolean;
  failed: boolean;
  errorCode?: string;
  providerRequests: number;
  cacheHit: boolean;
};

const translationMemory = new Map<string, InboxTranslationOutcome>();
const translationFlights = new Map<string, Promise<InboxTranslationOutcome>>();

/** Test hook. Clears the in-process translation cache and in-flight joins. */
export function resetInboxTranslationCache(): void {
  translationMemory.clear();
  translationFlights.clear();
}

/** Protect URLs, phones, amounts, and AsliJobs-style IDs from being rewritten. */
export function extractProtectedIdentifiers(text: string): string[] {
  const found: string[] = [];
  let rest = text;

  for (const url of collectMatches(rest, URL_PATTERN).map(trimTrailingUrlPunctuation)) {
    if (!url) continue;
    found.push(url);
    rest = rest.split(url).join(" ");
  }

  for (const pattern of [
    EMAIL_PATTERN,
    JOB_ID_PATTERN,
    MONEY_PATTERN,
    DATE_PATTERN,
    PHONE_PATTERN,
    EMOJI_PATTERN,
  ]) {
    for (const match of collectMatches(rest, pattern)) {
      found.push(match);
      rest = rest.split(match).join(" ");
    }
  }

  return [...new Set(found.filter((term) => term.length > 1))];
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

const BRAND_LATIN_TOKEN =
  /\b(?:AsliJobs|ASLIJOBS|WhatsApp|OTP|SMS|INR|Rs|ID|URL|PDF|API)\b/gi;

/**
 * True when the message is already in `target` and has no substantial leftover
 * content that still needs translating (other Indic scripts or Latin prose).
 *
 * A single Kannada/Telugu glyph must NOT skip a mixed English+Indic template —
 * that left English sentences visible while neighbors looked translated.
 */
export function isAlreadyTargetLanguage(
  text: string,
  target: InboxTranslationLanguage,
): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;

  if (hasOtherIndicScript(trimmed, target)) {
    return false;
  }

  if (target === "en") {
    return confidentInboxScript(trimmed) === null;
  }

  const script = confidentInboxScript(trimmed);
  if (script !== target && detectInboxSourceLanguage(trimmed) !== target) {
    return false;
  }

  return !hasSubstantialLatinProse(trimmed);
}

function hasOtherIndicScript(
  text: string,
  target: InboxTranslationLanguage,
): boolean {
  return INDIC_SCRIPT.some(
    (entry) => entry.language !== target && entry.pattern.test(text),
  );
}

function hasSubstantialLatinProse(text: string): boolean {
  let rest = text;
  for (const id of extractProtectedIdentifiers(text)) {
    rest = rest.split(id).join(" ");
  }
  rest = rest.replace(BRAND_LATIN_TOKEN, " ");
  const words = rest.match(/[A-Za-z]{3,}/g) ?? [];
  return words.length >= 3;
}

export async function translateInboxText(input: {
  text: string;
  sourceLanguage: BotLanguage;
  targetLanguage: InboxTranslationLanguage;
  /** Composer drafts let Sarvam detect the source so any language pair works. */
  autoDetectSource?: boolean;
  /** Test seam. Production uses the Sarvam client. */
  translateImpl?: (request: TranslateTextInput) => Promise<TranslateTextResult>;
}): Promise<InboxTranslationOutcome> {
  const original = input.text.trim();
  if (!original) {
    return finish(input, {
      text: input.text,
      translated: false,
      skipped: true,
      failed: false,
      providerRequests: 0,
      cacheHit: false,
    });
  }
  if (isAlreadyTargetLanguage(original, input.targetLanguage)) {
    return finish(input, {
      text: input.text,
      translated: false,
      skipped: true,
      failed: false,
      providerRequests: 0,
      cacheHit: false,
    });
  }

  // Mixed English+Indic bodies often detect as the Indic language even when
  // Latin sentences remain. Force Sarvam auto-detect so those sentences translate.
  const autoDetectSource =
    Boolean(input.autoDetectSource) ||
    input.sourceLanguage === input.targetLanguage;
  const resolvedInput = { ...input, autoDetectSource };

  const key = [
    INBOX_TRANSLATION_PIPELINE_VERSION,
    input.targetLanguage,
    autoDetectSource ? "auto" : input.sourceLanguage,
    hashInboxSourceText(original),
  ].join("|");
  const cached = translationMemory.get(key);
  if (cached) {
    translationMemory.delete(key);
    translationMemory.set(key, cached);
    return finish(input, { ...cached, providerRequests: 0, cacheHit: true });
  }

  const existing = translationFlights.get(key);
  if (existing) {
    const shared = await existing;
    return finish(input, { ...shared, providerRequests: 0, cacheHit: true });
  }

  let resolveFlight: (value: InboxTranslationOutcome) => void = () => undefined;
  const flight = new Promise<InboxTranslationOutcome>((resolve) => {
    resolveFlight = resolve;
  });
  translationFlights.set(key, flight);
  try {
    const result = await translateStructuredText(original, resolvedInput);
    resolveFlight(result);
    if (result.translated && !result.failed) {
      rememberTranslation(key, { ...result, providerRequests: 0, cacheHit: false });
    }
    return finish(input, result);
  } catch (error) {
    const failed: InboxTranslationOutcome = {
      text: input.text,
      translated: false,
      skipped: false,
      failed: true,
      errorCode: "exception",
      providerRequests: 0,
      cacheHit: false,
    };
    resolveFlight(failed);
    console.error("[InboxTranslate] event=COMPLETE status=failure", {
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
    return finish(input, failed);
  } finally {
    translationFlights.delete(key);
  }
}

type LayoutSegment =
  | { kind: "gap"; text: string }
  | { kind: "unit"; text: string };

/**
 * Sarvam's translate endpoint returns a single paragraph and drops newlines.
 * Keep blank lines, list rows, and field rows as boundaries, and only join
 * adjacent lines when they are an unfinished sentence.
 */
function planInboxTranslationLayout(text: string): LayoutSegment[] {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : line))
    .join("\n");
  const parts: Array<{ kind: "gap"; text: string } | { kind: "text"; text: string }> = [];
  for (const part of normalized.split(/(\n+)/)) {
    if (!part) continue;
    if (/^\n+$/.test(part)) parts.push({ kind: "gap", text: part });
    else parts.push({ kind: "text", text: part });
  }

  const segments: LayoutSegment[] = [];
  let index = 0;
  while (index < parts.length) {
    const part = parts[index];
    if (!part) break;
    if (part.kind === "gap") {
      segments.push(part);
      index += 1;
      continue;
    }
    if (isAtomicLine(part.text) || endsSentence(part.text)) {
      segments.push({ kind: "unit", text: part.text });
      index += 1;
      continue;
    }

    const group = [part.text.trim()];
    let cursor = index + 1;
    let merged = false;
    while (cursor + 1 < parts.length) {
      const gap = parts[cursor];
      const next = parts[cursor + 1];
      if (!gap || gap.kind !== "gap" || gap.text !== "\n") break;
      if (!next || next.kind !== "text" || isAtomicLine(next.text)) break;
      group.push(next.text.trim());
      cursor += 2;
      merged = true;
      if (endsSentence(next.text)) break;
    }

    segments.push({
      kind: "unit",
      text: merged ? group.join(" ") : part.text,
    });
    index = merged ? cursor : index + 1;
  }

  return segments;
}

function isAtomicLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (LIST_PREFIX_PATTERN.test(trimmed)) return true;
  if (/^\p{Extended_Pictographic}/u.test(trimmed)) return true;
  if (/https?:\/\/\S/i.test(trimmed)) return true;
  return /(?:₹|Rs\.?|INR)\s*[\d,]/i.test(trimmed);
}

function endsSentence(line: string): boolean {
  return SENTENCE_END_PATTERN.test(line.trim());
}

type PreparedUnit =
  | { kind: "copy"; text: string }
  | {
      kind: "translate";
      prefix: string;
      leading: string;
      trailing: string;
      core: string;
    };

function prepareLayoutUnit(unit: string): PreparedUnit {
  const { prefix, body } = peelStablePrefix(unit);
  const leading = body.match(/^[ \t]*/)?.[0] ?? "";
  const trailing = body.match(/[ \t]*$/)?.[0] ?? "";
  const core = body.trim();
  if (!core) return { kind: "copy", text: unit };
  const protectedIds = protectProperNouns(core, extractProtectedIdentifiers(core));
  if (!hasTranslatableLetters(protectedIds.text)) return { kind: "copy", text: unit };
  return { kind: "translate", prefix, leading, trailing, core };
}

type TranslateContext = {
  sourceLanguage: BotLanguage;
  targetLanguage: InboxTranslationLanguage;
  autoDetectSource?: boolean;
  translateImpl: (request: TranslateTextInput) => Promise<TranslateTextResult>;
  usage: { providerRequests: number };
};

function finish(
  input: { targetLanguage: InboxTranslationLanguage },
  result: InboxTranslationOutcome,
): InboxTranslationOutcome {
  console.info(
    `[InboxTranslate] event=COMPLETE target=${input.targetLanguage} providerRequests=${result.providerRequests} cache=${result.cacheHit ? "hit" : "miss"} pipeline=${INBOX_TRANSLATION_PIPELINE_VERSION} status=${result.failed ? "failure" : result.skipped ? "skipped" : "ok"}`,
  );
  return result;
}

function rememberTranslation(key: string, value: InboxTranslationOutcome): void {
  translationMemory.delete(key);
  translationMemory.set(key, value);
  while (translationMemory.size > TRANSLATION_CACHE_LIMIT) {
    const oldest = translationMemory.keys().next().value;
    if (oldest === undefined) break;
    translationMemory.delete(oldest);
  }
}

async function translateStructuredText(
  original: string,
  input: {
    sourceLanguage: BotLanguage;
    targetLanguage: InboxTranslationLanguage;
    autoDetectSource?: boolean;
    translateImpl?: (request: TranslateTextInput) => Promise<TranslateTextResult>;
  },
): Promise<InboxTranslationOutcome> {
  const usage = { providerRequests: 0 };
  const context: TranslateContext = {
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    autoDetectSource: input.autoDetectSource,
    translateImpl: input.translateImpl ?? translateText,
    usage,
  };
  const layout = planInboxTranslationLayout(original);
  const prepared = layout.map((segment) =>
    segment.kind === "gap" ? segment : prepareLayoutUnit(segment.text),
  );
  const translatable = prepared.flatMap((segment) =>
    segment.kind === "translate" ? [segment] : [],
  );
  const translatedCores = await translateAllCores(
    translatable.map((segment) => segment.core),
    context,
  );
  if (translatedCores.failed) {
    return {
      text: original,
      translated: false,
      skipped: false,
      failed: true,
      errorCode: translatedCores.errorCode,
      providerRequests: usage.providerRequests,
      cacheHit: false,
    };
  }
  if (!translatedCores.translated) {
    return {
      text: original,
      translated: false,
      skipped: true,
      failed: false,
      providerRequests: usage.providerRequests,
      cacheHit: false,
    };
  }

  let coreIndex = 0;
  const text = prepared
    .map((segment) => {
      if (segment.kind === "gap") return segment.text;
      if (segment.kind === "copy") return segment.text;
      const translated = translatedCores.values[coreIndex] ?? segment.core;
      coreIndex += 1;
      return `${segment.prefix}${segment.leading}${translated}${segment.trailing}`;
    })
    .join("");

  const skeleton = prepared
    .map((segment) => (segment.kind === "gap" ? segment.text : "x"))
    .join("");
  if (!layoutMatches(original, text, skeleton) || !protectedValuesMatch(original, text)) {
    return {
      text: original,
      translated: false,
      skipped: false,
      failed: true,
      errorCode: "layout_mismatch",
      providerRequests: usage.providerRequests,
      cacheHit: false,
    };
  }

  return {
    text,
    translated: true,
    skipped: false,
    failed: false,
    providerRequests: usage.providerRequests,
    cacheHit: false,
  };
}

async function translateAllCores(
  cores: readonly string[],
  context: TranslateContext,
): Promise<
  | { failed: true; errorCode?: string }
  | { failed: false; translated: boolean; values: string[] }
> {
  if (cores.length === 0) return { failed: false, translated: false, values: [] };
  if (cores.length === 1) {
    const single = await translateOneCore(cores[0] ?? "", context);
    if (single.failed) return { failed: true, errorCode: single.errorCode };
    return { failed: false, translated: single.translated, values: [single.text] };
  }

  const batched = await translateCoresBatched(cores, context);
  if (!batched.failed) return batched;

  // Sarvam often mangled multi-segment separators on account/template bodies.
  // Fall back to one provider call per structural unit so multiline English
  // still translates instead of staying English with Retry.
  if (
    batched.errorCode === "layout_mismatch" ||
    batched.errorCode === "protected_token"
  ) {
    return translateCoresIndividually(cores, context);
  }
  return batched;
}

async function translateCoresIndividually(
  cores: readonly string[],
  context: TranslateContext,
): Promise<
  | { failed: true; errorCode?: string }
  | { failed: false; translated: boolean; values: string[] }
> {
  const values: string[] = [];
  let translated = false;
  for (const core of cores) {
    const single = await translateOneCore(core, context);
    if (single.failed) {
      return { failed: true, errorCode: single.errorCode };
    }
    if (single.translated) translated = true;
    values.push(single.text);
  }
  if (values.length !== cores.length || !coresAlign(cores, values)) {
    return { failed: true, errorCode: "layout_mismatch" };
  }
  return { failed: false, translated, values };
}

async function translateCoresBatched(
  cores: readonly string[],
  context: TranslateContext,
): Promise<
  | { failed: true; errorCode?: string }
  | { failed: false; translated: boolean; values: string[] }
> {
  const marked = cores.map((core, index) => `${segmentMark(index)}${core}`);
  const joined = marked.join(LAYOUT_SEPARATOR);
  const protectedIds = protectProperNouns(joined, [
    ...cores.flatMap((core) => extractProtectedIdentifiers(core)),
    LAYOUT_SEPARATOR,
    ...cores.map((_, index) => segmentMark(index)),
  ]);
  const separatorIndex = protectedIds.tokens.indexOf(LAYOUT_SEPARATOR);
  if (separatorIndex < 0) {
    return { failed: true, errorCode: "layout_mismatch" };
  }
  const separatorToken = `__AJ${separatorIndex}__`;
  const parts = protectedIds.text.split(separatorToken);
  if (parts.length !== cores.length) {
    return { failed: true, errorCode: "layout_mismatch" };
  }

  const values: string[] = [];
  let translated = false;
  for (const chunk of packProtectedParts(parts, separatorToken)) {
    const start = values.length;
    if (chunk.oversized) {
      const wide = await translateProtectedPieces(
        chunk.payload,
        protectedIds.tokens,
        context,
      );
      if (wide.failed) return wide;
      const stripped = takeSegmentMark(wide.text, start);
      if (stripped === null) return { failed: true, errorCode: "layout_mismatch" };
      if (wide.translated) translated = true;
      values.push(stripped);
      continue;
    }
    const parsed = await translateChunkWithRetry(
      chunk.payload,
      chunk.expectedParts,
      protectedIds.tokens,
      cores.slice(start, start + chunk.expectedParts),
      start,
      context,
    );
    if (parsed.failed) return parsed;
    if (parsed.translated) translated = true;
    values.push(...parsed.values);
  }

  if (values.length !== cores.length || !coresAlign(cores, values)) {
    return { failed: true, errorCode: "layout_mismatch" };
  }
  return { failed: false, translated, values };
}

function packProtectedParts(
  parts: readonly string[],
  separatorToken: string,
  limit = SARVAM_TRANSLATE_INPUT_MAX,
): Array<{ payload: string; expectedParts: number; oversized: boolean }> {
  const chunks: Array<{ payload: string; expectedParts: number; oversized: boolean }> = [];
  let group: string[] = [];
  let size = 0;
  const flush = () => {
    if (group.length === 0) return;
    chunks.push({
      payload: group.join(separatorToken),
      expectedParts: group.length,
      oversized: false,
    });
    group = [];
    size = 0;
  };
  for (const part of parts) {
    if (part.length > limit) {
      flush();
      chunks.push({ payload: part, expectedParts: 1, oversized: true });
      continue;
    }
    const nextSize =
      group.length === 0 ? part.length : size + separatorToken.length + part.length;
    if (group.length > 0 && nextSize > limit) flush();
    group.push(part);
    size = group.length === 1 ? part.length : size + separatorToken.length + part.length;
  }
  flush();
  return chunks;
}

async function translateChunkWithRetry(
  payload: string,
  expectedParts: number,
  tokens: readonly string[],
  cores: readonly string[],
  start: number,
  context: TranslateContext,
): Promise<
  | { failed: true; errorCode?: string }
  | { failed: false; translated: boolean; values: string[] }
> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await callTranslate(payload, context);
    if (result.failed) return { failed: true, errorCode: result.errorCode };
    const restored = restoreChunk(result.text, payload, tokens, expectedParts);
    const values = restored ? stripSegmentMarks(restored, start) : null;
    if (values && coresAlign(cores, values)) {
      return { failed: false, translated: result.translated, values };
    }
  }
  return { failed: true, errorCode: "layout_mismatch" };
}

function restoreChunk(
  translated: string,
  payload: string,
  tokens: readonly string[],
  expectedParts: number,
): string[] | null {
  const flat = normalizePlaceholders(flattenProviderText(translated));
  if (!pieceKeptTokens(flat, tokens, payload)) return null;
  const restored = restoreProperNouns(flat, tokens);
  const parts =
    expectedParts === 1
      ? [restored.trim()]
      : restored.split(LAYOUT_SEPARATOR).map((part) => part.trim());
  return parts.length === expectedParts ? parts : null;
}

async function translateProtectedPieces(
  payload: string,
  tokens: readonly string[],
  context: TranslateContext,
): Promise<
  | { failed: true; errorCode?: string }
  | { failed: false; translated: boolean; text: string }
> {
  const pieces = splitOversizedUnit(payload);
  const translatedPieces: string[] = [];
  let translated = false;
  for (const piece of pieces) {
    let accepted: { translated: boolean; text: string } | null = null;
    for (let attempt = 0; attempt < 2 && !accepted; attempt += 1) {
      const result = await callTranslate(piece, context);
      if (result.failed) return { failed: true, errorCode: result.errorCode };
      const flat = normalizePlaceholders(flattenProviderText(result.text));
      if (!pieceKeptTokens(flat, tokens, piece)) continue;
      accepted = {
        translated: result.translated,
        text: restoreProperNouns(flat, tokens),
      };
    }
    if (!accepted) return { failed: true, errorCode: "protected_token" };
    if (accepted.translated) translated = true;
    translatedPieces.push(accepted.text);
  }
  return { failed: false, translated, text: translatedPieces.join(" ") };
}

async function translateOneCore(
  core: string,
  context: TranslateContext,
): Promise<{
  text: string;
  translated: boolean;
  skipped: boolean;
  failed: boolean;
  errorCode?: string;
}> {
  const protectedIds = protectProperNouns(core, extractProtectedIdentifiers(core));
  const wide = await translateProtectedPieces(protectedIds.text, protectedIds.tokens, context);
  if (wide.failed) {
    return {
      text: core,
      translated: false,
      skipped: false,
      failed: true,
      errorCode: wide.errorCode,
    };
  }
  return {
    text: wide.text,
    translated: wide.translated,
    skipped: !wide.translated,
    failed: false,
  };
}

async function callTranslate(
  text: string,
  context: TranslateContext,
): Promise<TranslateTextResult> {
  if (text.length > SARVAM_TRANSLATE_INPUT_MAX) {
    return {
      text,
      translated: false,
      skipped: false,
      failed: true,
      durationMs: 0,
      errorCode: "input_limit",
    };
  }
  context.usage.providerRequests += 1;
  try {
    return await context.translateImpl({
      text,
      sourceLanguage: context.sourceLanguage,
      targetLanguage: context.targetLanguage,
      autoDetectSource: context.autoDetectSource,
      cache: false,
    });
  } catch {
    return {
      text,
      translated: false,
      skipped: false,
      failed: true,
      durationMs: 0,
      errorCode: "exception",
    };
  }
}

function segmentMark(index: number): string {
  return `[[AJSEG${index}]]`;
}

function takeSegmentMark(value: string, index: number): string | null {
  const mark = segmentMark(index);
  if (value.split(mark).length !== 2) return null;
  return value.split(mark).join("").trim();
}

function stripSegmentMarks(parts: readonly string[], start: number): string[] | null {
  const stripped: string[] = [];
  for (let offset = 0; offset < parts.length; offset += 1) {
    const next = takeSegmentMark(parts[offset] ?? "", start + offset);
    if (next === null) return null;
    stripped.push(next);
  }
  return stripped;
}

function countOccurrences(text: string, token: string): number {
  if (!token) return 0;
  return text.split(token).length - 1;
}

function coresAlign(cores: readonly string[], values: readonly string[]): boolean {
  return cores.every((core, index) =>
    extractProtectedIdentifiers(core).every((term) => (values[index] ?? "").includes(term)),
  );
}

function layoutSignature(text: string): string {
  return text
    .split("\n")
    .map((line) => (line.trim() ? "L" : "B"))
    .join("");
}

function numberedMarkers(text: string): string[] {
  return text.split("\n").flatMap((line) => {
    const match = line.trim().match(/^(\d+)[.)]/);
    return match?.[1] ? [match[1]] : [];
  });
}

function layoutMatches(source: string, output: string, skeleton: string): boolean {
  return (
    layoutSignature(skeleton) === layoutSignature(output) &&
    numberedMarkers(source).join("\0") === numberedMarkers(output).join("\0")
  );
}

function protectedValuesMatch(source: string, output: string): boolean {
  return extractProtectedIdentifiers(source).every(
    (term) => source.split(term).length === output.split(term).length,
  );
}

function peelStablePrefix(line: string): { prefix: string; body: string } {
  let prefix = "";
  let body = line;
  const list = body.match(LIST_PREFIX_PATTERN);
  if (list?.[1]) {
    prefix += list[1];
    body = body.slice(list[1].length);
  }
  const emoji = body.match(LEADING_EMOJI_PATTERN);
  if (emoji?.[1]?.trim()) {
    prefix += emoji[1];
    body = body.slice(emoji[1].length);
  }
  return { prefix, body };
}

function splitOversizedUnit(text: string): string[] {
  if (text.length <= SARVAM_TRANSLATE_INPUT_MAX) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > SARVAM_TRANSLATE_INPUT_MAX) {
    let cut = rest.lastIndexOf(" ", SARVAM_TRANSLATE_INPUT_MAX);
    if (cut < Math.floor(SARVAM_TRANSLATE_INPUT_MAX / 2)) cut = SARVAM_TRANSLATE_INPUT_MAX;
    const head = rest.slice(0, cut);
    const tokenAt = head.lastIndexOf("__AJ");
    if (tokenAt !== -1) {
      const closing = rest.indexOf("__", tokenAt + 4);
      if (closing !== -1 && closing + 2 > cut) {
        cut = tokenAt > 0 ? tokenAt : closing + 2;
      }
    }
    const piece = rest.slice(0, cut).trim();
    if (!piece) {
      chunks.push(rest.slice(0, SARVAM_TRANSLATE_INPUT_MAX));
      rest = rest.slice(SARVAM_TRANSLATE_INPUT_MAX).trim();
      continue;
    }
    chunks.push(piece);
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function flattenProviderText(text: string): string {
  return text.replace(/[ \t]*\r?\n+[ \t]*/g, " ").replace(/[ \t]{2,}/g, " ").trim();
}

function normalizePlaceholders(text: string): string {
  return text.replace(/__\s*AJ\s*(\d+)\s*__/gi, "__AJ$1__");
}

function hasTranslatableLetters(text: string): boolean {
  return /\p{L}/u.test(text.replace(/__AJ\d+__/g, ""));
}

function pieceKeptTokens(
  translated: string,
  tokens: readonly string[],
  payload: string,
): boolean {
  for (let index = 0; index < tokens.length; index += 1) {
    const token = `__AJ${index}__`;
    const expected = countOccurrences(payload, token);
    if (expected === 0) continue;
    const actual = countOccurrences(translated, token);
    if (actual === expected) continue;
    const term = tokens[index] ?? "";
    if (actual === 0 && term.length > 0 && countOccurrences(translated, term) === expected) {
      continue;
    }
    return false;
  }
  return true;
}

function collectMatches(text: string, pattern: RegExp): string[] {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  return [...text.matchAll(new RegExp(pattern.source, flags))].map((match) => match[0]);
}

function trimTrailingUrlPunctuation(url: string): string {
  return url.replace(/[.,;:!?)]+$/g, "");
}
