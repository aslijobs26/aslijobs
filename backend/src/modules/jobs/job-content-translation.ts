import { createHash } from "node:crypto";
import { JobModel } from "./job.model.js";
import {
  JOB_CONTENT_LANGUAGES,
  parseJobContentLanguage,
  resolveJobSourceLanguage,
  type JobContentLanguage,
} from "./job-content-language.js";
import {
  protectProperNouns,
  restoreProperNouns,
  toSarvamLanguageCode,
  translateText,
} from "../whatsapp/sarvam-translate.client.js";

export const JOB_TRANSLATABLE_FIELDS = [
  "jobTitle",
  "description",
  "interviewInstructions",
] as const;

export type JobTranslatableField = (typeof JOB_TRANSLATABLE_FIELDS)[number];

export type JobTranslationStatus = "completed" | "failed" | "partial";

export type JobTranslationLogEvent =
  | "CACHE_HIT"
  | "CACHE_MISS"
  | "TRANSLATION_QUEUED"
  | "TRANSLATION_ENQUEUED"
  | "TRANSLATION_STARTED"
  | "TRANSLATION_CREATED"
  | "TRANSLATION_PERSISTED"
  | "TRANSLATION_SKIPPED"
  | "TRANSLATION_SKIPPED_SOURCE_LANGUAGE"
  | "TRANSLATION_FAILED";

export type JobFieldTranslation = {
  jobTitle: string;
  description: string;
  interviewInstructions: string;
  jobTitleHash: string;
  descriptionHash: string;
  interviewInstructionsHash: string;
  lastAttemptAt?: string;
  status?: JobTranslationStatus;
};

export type JobContentTranslations = Partial<
  Record<JobContentLanguage, JobFieldTranslation>
>;

const CHUNK = 900;
/** Storm protection between user-triggered retries after a failed attempt. */
export const TRANSLATION_RETRY_COOLDOWN_MS = 30_000;
/** One extra whole-batch mapping retry. Never per-segment fallback. */
export const HTML_BATCH_MAPPING_RETRIES = 1;
/**
 * Word-free delimiter. mayura:v1 treats `__AJ_END__` as English "END" and
 * strips or translates it; `__AJQ__` survived a live en→kn probe.
 */
export const HTML_SEGMENT_DELIMITER = "__AJQ__";
const HTML_DELIMITER_JOIN = `\n${HTML_SEGMENT_DELIMITER}\n`;
const HTML_DELIMITER_SPLIT = /_{0,2}AJQ_{0,2}/;

const HARD_PROVIDER_ERROR_CODES = new Set([
  "missing_key",
  "insufficient_quota_error",
]);

export type JobFieldTranslateResult = {
  text: string;
  failed: boolean;
  calls: number;
  httpStatus?: number;
  errorCode?: string;
  hardFailure?: boolean;
};

export type JobTranslationFieldCalls = Record<JobTranslatableField, number>;

function emptyFieldCalls(): JobTranslationFieldCalls {
  return {
    jobTitle: 0,
    description: 0,
    interviewInstructions: 0,
  };
}

export function isHardSarvamProviderFailure(result: {
  httpStatus?: number;
  errorCode?: string;
}): boolean {
  if (result.errorCode && HARD_PROVIDER_ERROR_CODES.has(result.errorCode)) {
    return true;
  }
  return (
    result.httpStatus === 401
    || result.httpStatus === 402
    || result.httpStatus === 403
  );
}

const inFlightTranslations = new Map<string, Promise<unknown>>();

/**
 * Currency amounts, comma-grouped numbers, percentages, and plain digits must
 * stay international (ASCII) through Sarvam — never become Indic numerals or
 * word forms.
 */
const JOB_NUMERIC_LITERAL_PATTERN =
  /₹\s*\d{1,3}(?:,\d{2,3})*(?:\.\d+)?(?:\s*[-–—]\s*₹?\s*\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)?|(?:Rs\.?|INR)\s*\d{1,3}(?:,\d{2,3})*(?:\.\d+)?|\b\d{1,3}(?:,\d{2,3})+(?:\.\d+)?\b|\b\d+(?:\.\d+)?%|\b\d{1,2}:\d{2}(?::\d{2})?\b|\b\d+(?:\.\d+)?\b/gi;

const INDIC_DIGIT_MAP: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "०": "0",
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9",
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
  "੦": "0",
  "੧": "1",
  "੨": "2",
  "੩": "3",
  "੪": "4",
  "੫": "5",
  "੬": "6",
  "੭": "7",
  "੮": "8",
  "੯": "9",
  "૦": "0",
  "૧": "1",
  "૨": "2",
  "૩": "3",
  "૪": "4",
  "૫": "5",
  "૬": "6",
  "૭": "7",
  "૮": "8",
  "૯": "9",
  "୦": "0",
  "୧": "1",
  "୨": "2",
  "୩": "3",
  "୪": "4",
  "୫": "5",
  "୬": "6",
  "୭": "7",
  "୮": "8",
  "୯": "9",
  "௦": "0",
  "௧": "1",
  "௨": "2",
  "௩": "3",
  "௪": "4",
  "௫": "5",
  "௬": "6",
  "௭": "7",
  "௮": "8",
  "௯": "9",
  "౦": "0",
  "౧": "1",
  "౨": "2",
  "౩": "3",
  "౪": "4",
  "౫": "5",
  "౬": "6",
  "౭": "7",
  "౮": "8",
  "౯": "9",
  "೦": "0",
  "೧": "1",
  "೨": "2",
  "೩": "3",
  "೪": "4",
  "೫": "5",
  "೬": "6",
  "೭": "7",
  "೮": "8",
  "೯": "9",
  "൦": "0",
  "൧": "1",
  "൨": "2",
  "൩": "3",
  "൪": "4",
  "൫": "5",
  "൬": "6",
  "൭": "7",
  "൮": "8",
  "൯": "9",
};

export function extractJobNumericLiterals(text: string): string[] {
  const matches = text.match(JOB_NUMERIC_LITERAL_PATTERN) ?? [];
  return [...new Set(matches.map((match) => match.trim()).filter(Boolean))];
}

export function normalizeInternationalNumerals(text: string): string {
  return text.replace(
    /[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g,
    (digit) => INDIC_DIGIT_MAP[digit] ?? digit,
  );
}

export function protectJobNumericLiterals(text: string): {
  text: string;
  tokens: string[];
} {
  return protectProperNouns(text, extractJobNumericLiterals(text));
}

export function restoreJobNumericLiterals(
  text: string,
  tokens: readonly string[],
): string {
  return normalizeInternationalNumerals(restoreProperNouns(text, tokens));
}

export function translationInFlightKey(
  jobMongoId: string,
  language: JobContentLanguage,
): string {
  return `${jobMongoId}:${language}`;
}

export async function withTranslationInFlight<T>(
  key: string,
  work: () => Promise<T>,
): Promise<T> {
  const existing = inFlightTranslations.get(key);
  if (existing) {
    return existing as Promise<T>;
  }
  const promise = work().finally(() => {
    if (inFlightTranslations.get(key) === promise) {
      inFlightTranslations.delete(key);
    }
  });
  inFlightTranslations.set(key, promise);
  return promise;
}

export function isTranslationRetryCoolingDown(
  lastAttemptAt: string | Date | null | undefined,
  now = Date.now(),
): boolean {
  if (!lastAttemptAt) {
    return false;
  }
  const timestamp =
    lastAttemptAt instanceof Date ? lastAttemptAt.getTime() : Date.parse(lastAttemptAt);
  if (!Number.isFinite(timestamp)) {
    return false;
  }
  return now - timestamp < TRANSLATION_RETRY_COOLDOWN_MS;
}

function logJobTranslation(
  event: JobTranslationLogEvent,
  details: {
    jobId?: string;
    language?: string;
    field?: string;
    sourceHash?: string;
    reason?: string;
    calls?: number;
    attempt?: number;
    durationMs?: number;
  },
): void {
  console.info(
    `[JOB-TRANSLATE] event=${event} jobId=${details.jobId ?? "-"} language=${details.language ?? "-"} field=${details.field ?? "job"} sourceHash=${details.sourceHash ?? "-"} reason=${details.reason ?? "-"} calls=${details.calls ?? 0} attempt=${details.attempt ?? 0} durationMs=${details.durationMs ?? 0}`,
  );
}

function logSarvamJobTranslate(
  event: "SARVAM_REQUEST_STARTED" | "SARVAM_REQUEST_SUCCEEDED" | "SARVAM_REQUEST_FAILED",
  details: {
    jobId?: string;
    language?: string;
    field?: string;
    sourceHash?: string;
    success?: boolean;
    durationMs?: number;
    reason?: string;
    batch?: number;
    batchCount?: number;
    attempt?: number;
  },
): void {
  const target = details.language
    ? toSarvamLanguageCode(details.language as JobContentLanguage)
    : "-";
  const batch =
    details.batch && details.batchCount
      ? `${details.batch}/${details.batchCount}`
      : "-";
  console.info(
    `[SARVAM-JOB-TRANSLATE] event=${event} jobId=${details.jobId ?? "-"} language=${details.language ?? "-"} target=${target} field=${details.field ?? "-"} batch=${batch} attempt=${details.attempt ?? 1} sourceHash=${details.sourceHash ?? "-"} requestStarted=${event === "SARVAM_REQUEST_STARTED"} responseReceived=${event !== "SARVAM_REQUEST_STARTED"} success=${details.success ?? event === "SARVAM_REQUEST_SUCCEEDED"} reason=${details.reason ?? "-"} durationMs=${details.durationMs ?? 0}`,
  );
}

function logJobTranslationSummary(details: {
  jobId?: string;
  language?: string;
  sarvamCalls: number;
  fieldCalls: JobTranslationFieldCalls;
  status: string;
}): void {
  console.info(
    `[JOB-TRANSLATE-SUMMARY] job=${details.jobId ?? "-"} language=${details.language ?? "-"} sarvamCalls=${details.sarvamCalls} titleCalls=${details.fieldCalls.jobTitle} descriptionCalls=${details.fieldCalls.description} interviewCalls=${details.fieldCalls.interviewInstructions} status=${details.status}`,
  );
}

export function hashJobField(value: string): string {
  return createHash("sha256").update(value.trim()).digest("hex");
}

/** Aggregate source version used by the queue task key and cache resolver. */
export function hashJobSource(source: {
  jobTitle: string;
  description: string;
  interviewInstructions: string;
}): string {
  return hashJobField(
    `${source.jobTitle}\n${source.description}\n${source.interviewInstructions}`,
  );
}

export function splitForTranslation(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= CHUNK) return [trimmed];
  const parts: string[] = [];
  let rest = trimmed;
  while (rest.length > CHUNK) {
    const window = rest.slice(0, CHUNK);
    const breakAt = Math.max(window.lastIndexOf("\n"), window.lastIndexOf(". "));
    const cut = breakAt > 200 ? breakAt + 1 : CHUNK;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

export async function translateJobField(input: {
  text: string;
  sourceLanguage: JobContentLanguage;
  targetLanguage: JobContentLanguage;
  fetchImpl?: typeof fetch;
  log?: { jobId?: string; field?: string; sourceHash?: string };
}): Promise<JobFieldTranslateResult> {
  const chunks = splitForTranslation(input.text);
  if (chunks.length === 0 || input.sourceLanguage === input.targetLanguage) {
    return { text: input.text, failed: false, calls: 0 };
  }
  const translated: string[] = [];
  for (const [index, chunk] of chunks.entries()) {
    const protectedChunk = protectJobNumericLiterals(chunk);
    const batch = index + 1;
    logSarvamJobTranslate("SARVAM_REQUEST_STARTED", {
      jobId: input.log?.jobId,
      language: input.targetLanguage,
      field: input.log?.field,
      sourceHash: input.log?.sourceHash,
      batch,
      batchCount: chunks.length,
      attempt: 1,
    });
    const started = Date.now();
    const result = await translateText({
      text: protectedChunk.text,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      cache: false,
      fetchImpl: input.fetchImpl,
      jobLog: {
        jobId: input.log?.jobId,
        language: input.targetLanguage,
        field: input.log?.field,
        batch,
        batchCount: chunks.length,
        attempt: 1,
      },
    });
    logSarvamJobTranslate(
      result.failed || !result.translated
        ? "SARVAM_REQUEST_FAILED"
        : "SARVAM_REQUEST_SUCCEEDED",
      {
        jobId: input.log?.jobId,
        language: input.targetLanguage,
        field: input.log?.field,
        sourceHash: input.log?.sourceHash,
        success: !result.failed && result.translated,
        durationMs: Date.now() - started,
        reason: result.errorCode
          ?? (result.httpStatus ? `http_${result.httpStatus}` : undefined)
          ?? (result.failed || !result.translated ? "provider_failed" : undefined),
        batch,
        batchCount: chunks.length,
        attempt: 1,
      },
    );
    if (result.failed || !result.translated) {
      return {
        text: input.text,
        failed: true,
        calls: translated.length + 1,
        httpStatus: result.httpStatus,
        errorCode: result.errorCode,
        hardFailure: isHardSarvamProviderFailure(result),
      };
    }
    translated.push(
      restoreJobNumericLiterals(result.text, protectedChunk.tokens),
    );
  }
  return { text: translated.join("\n"), failed: false, calls: chunks.length };
}

const HTML_TAG_SPLIT_PATTERN = /(<[^>]+>)/;
const HTML_TAG_NAME_PATTERN = /<\/?[a-z][a-z0-9]*/gi;

export function looksLikeHtmlContent(value: string): boolean {
  return /<\/?[a-z][^>]*>/i.test(value);
}

function htmlTagSignature(value: string): string {
  return (value.match(HTML_TAG_NAME_PATTERN) ?? [])
    .map((tag) => tag.toLowerCase())
    .join(",");
}

/**
 * Machine translation of raw HTML drops or duplicates tags (e.g. hundreds of
 * `<br>`). A translation is only usable when it keeps the source tag sequence.
 */
export function hasMatchingHtmlStructure(source: string, translated: string): boolean {
  if (!looksLikeHtmlContent(source)) {
    return true;
  }
  return htmlTagSignature(source) === htmlTagSignature(translated);
}

export function joinHtmlSegmentBatch(segments: readonly string[]): string {
  return segments.join(HTML_DELIMITER_JOIN);
}

export function packHtmlSegmentBatches(
  segments: readonly string[],
  chunkLimit = CHUNK,
): number[][] {
  const batches: number[][] = [];
  let current: number[] = [];
  let currentLen = 0;
  segments.forEach((segment, index) => {
    const extra =
      current.length > 0
        ? HTML_DELIMITER_JOIN.length + segment.length
        : segment.length;
    if (current.length > 0 && currentLen + extra > chunkLimit) {
      batches.push(current);
      current = [index];
      currentLen = segment.length;
      return;
    }
    current.push(index);
    currentLen += extra;
  });
  if (current.length > 0) {
    batches.push(current);
  }
  return batches;
}

export function parseHtmlSegmentTranslations(
  translated: string,
  expectedIndexes: readonly number[],
): Map<number, string> | null {
  const parts = translated
    .split(HTML_DELIMITER_SPLIT)
    .map((part) => part.replace(/\s+/g, " ").trim());
  if (parts.length !== expectedIndexes.length || !parts.every(Boolean)) {
    return null;
  }
  return new Map(
    expectedIndexes.map((index, offset) => [index, parts[offset] ?? ""]),
  );
}

/**
 * Translates only the text between tags and copies every tag verbatim.
 * Text nodes are sent in CHUNK-sized batches separated by __AJQ__.
 * Mapping failure retries the same batch once; it never falls back per node.
 */
export async function translateJobHtmlField(input: {
  html: string;
  sourceLanguage: JobContentLanguage;
  targetLanguage: JobContentLanguage;
  fetchImpl?: typeof fetch;
  log?: { jobId?: string; field?: string; sourceHash?: string };
}): Promise<JobFieldTranslateResult> {
  const tokens = input.html.split(HTML_TAG_SPLIT_PATTERN);
  const textIndexes = tokens.flatMap((token, index) =>
    !token.startsWith("<") && token.trim() ? [index] : [],
  );
  if (textIndexes.length === 0 || input.sourceLanguage === input.targetLanguage) {
    return { text: input.html, failed: false, calls: 0 };
  }

  const segments = textIndexes.map((index) => tokens[index].replace(/\s+/g, " ").trim());
  const batches = packHtmlSegmentBatches(segments);
  const translatedByIndex = new Map<number, string>();
  let calls = 0;

  for (const [batchOffset, batchIndexes] of batches.entries()) {
    const batch = batchOffset + 1;
    const payload = joinHtmlSegmentBatch(
      batchIndexes.map((index) => segments[index] ?? ""),
    );
    let mapped: Map<number, string> | null = null;
    let lastFailure: JobFieldTranslateResult | null = null;

    for (let attempt = 1; attempt <= HTML_BATCH_MAPPING_RETRIES + 1; attempt += 1) {
      const protectedChunk = protectJobNumericLiterals(payload);
      logSarvamJobTranslate("SARVAM_REQUEST_STARTED", {
        jobId: input.log?.jobId,
        language: input.targetLanguage,
        field: input.log?.field,
        sourceHash: input.log?.sourceHash,
        batch,
        batchCount: batches.length,
        attempt,
      });
      const started = Date.now();
      const result = await translateText({
        text: protectedChunk.text,
        sourceLanguage: input.sourceLanguage,
        targetLanguage: input.targetLanguage,
        cache: false,
        fetchImpl: input.fetchImpl,
        jobLog: {
          jobId: input.log?.jobId,
          language: input.targetLanguage,
          field: input.log?.field,
          batch,
          batchCount: batches.length,
          attempt,
        },
      });
      calls += 1;
      logSarvamJobTranslate(
        result.failed || !result.translated
          ? "SARVAM_REQUEST_FAILED"
          : "SARVAM_REQUEST_SUCCEEDED",
        {
          jobId: input.log?.jobId,
          language: input.targetLanguage,
          field: input.log?.field,
          sourceHash: input.log?.sourceHash,
          success: !result.failed && result.translated,
          durationMs: Date.now() - started,
          reason: result.errorCode
            ?? (result.httpStatus ? `http_${result.httpStatus}` : undefined)
            ?? (result.failed || !result.translated ? "provider_failed" : undefined),
          batch,
          batchCount: batches.length,
          attempt,
        },
      );
      if (result.failed || !result.translated) {
        return {
          text: input.html,
          failed: true,
          calls,
          httpStatus: result.httpStatus,
          errorCode: result.errorCode,
          hardFailure: isHardSarvamProviderFailure(result),
        };
      }
      const restored = restoreJobNumericLiterals(result.text, protectedChunk.tokens);
      mapped = parseHtmlSegmentTranslations(restored, batchIndexes);
      if (mapped) {
        break;
      }
      lastFailure = {
        text: input.html,
        failed: true,
        calls,
        errorCode: "html_segment_mapping_failed",
      };
    }

    if (!mapped) {
      logSarvamJobTranslate("SARVAM_REQUEST_FAILED", {
        jobId: input.log?.jobId,
        language: input.targetLanguage,
        field: input.log?.field,
        sourceHash: input.log?.sourceHash,
        success: false,
        reason: "html_segment_mapping_failed",
        batch,
        batchCount: batches.length,
        attempt: HTML_BATCH_MAPPING_RETRIES + 1,
      });
      return lastFailure ?? { text: input.html, failed: true, calls, errorCode: "html_segment_mapping_failed" };
    }
    mapped.forEach((value, index) => {
      translatedByIndex.set(index, value);
    });
  }

  textIndexes.forEach((tokenIndex, segmentIndex) => {
    const original = tokens[tokenIndex];
    const translated = translatedByIndex.get(segmentIndex);
    if (!translated) {
      return;
    }
    const leading = original.match(/^\s*/)?.[0] ?? "";
    const trailing = original.match(/\s*$/)?.[0] ?? "";
    tokens[tokenIndex] = `${leading}${translated}${trailing}`;
  });

  const reconstructed = tokens.join("");
  if (!hasMatchingHtmlStructure(input.html, reconstructed)) {
    logSarvamJobTranslate("SARVAM_REQUEST_FAILED", {
      jobId: input.log?.jobId,
      language: input.targetLanguage,
      field: input.log?.field,
      sourceHash: input.log?.sourceHash,
      success: false,
      reason: "html_structure_mismatch",
      batch: batches.length,
      batchCount: batches.length,
      attempt: 1,
    });
    return {
      text: input.html,
      failed: true,
      calls,
      errorCode: "html_structure_mismatch",
    };
  }

  return { text: reconstructed, failed: false, calls };
}

type SourceFields = Record<JobTranslatableField, string>;

function readSource(job: {
  jobTitle?: string;
  description?: string;
  interviewInstructions?: string;
}): SourceFields {
  return {
    jobTitle: job.jobTitle?.trim() ?? "",
    description: job.description?.trim() ?? "",
    interviewInstructions: job.interviewInstructions?.trim() ?? "",
  };
}

function entryFromSource(source: SourceFields): JobFieldTranslation {
  return {
    jobTitle: source.jobTitle,
    description: source.description,
    interviewInstructions: source.interviewInstructions,
    jobTitleHash: hashJobField(source.jobTitle),
    descriptionHash: hashJobField(source.description),
    interviewInstructionsHash: hashJobField(source.interviewInstructions),
    lastAttemptAt: new Date().toISOString(),
    status: "completed",
  };
}

function blankTargetTranslation(): JobFieldTranslation {
  return {
    jobTitle: "",
    description: "",
    interviewInstructions: "",
    jobTitleHash: "",
    descriptionHash: "",
    interviewInstructionsHash: "",
  };
}

/**
 * A failed field must not keep the current source hash. An empty hash means
 * "not translated", so a later retry can run without a source edit, while a
 * real stored hash that no longer matches still means the source was edited.
 */
function clearUnusableFieldHashes(
  translated: JobFieldTranslation,
  source: SourceFields,
  previous: JobFieldTranslation | undefined,
): void {
  for (const field of JOB_TRANSLATABLE_FIELDS) {
    if (
      isUsableFieldTranslation(source[field], translated, field)
      || isUsableFieldTranslation(source[field], previous, field)
    ) {
      continue;
    }
    translated[`${field}Hash`] = "";
  }
}

export async function buildJobContentTranslations(input: {
  source: SourceFields;
  existing?: JobContentTranslations | null;
  languages?: readonly JobContentLanguage[];
  contentLanguage?: string | null;
  publicJobId?: string;
  fetchImpl?: typeof fetch;
}): Promise<{
  contentLanguage: JobContentLanguage;
  contentTranslations: JobContentTranslations;
  translationStatus: "complete" | "partial" | "failed" | "none";
  translateCalls: number;
  fieldCalls: JobTranslationFieldCalls;
}> {
  const emptyCalls = emptyFieldCalls();
  const sample = `${input.source.jobTitle}\n${input.source.description}\n${input.source.interviewInstructions}`;
  if (!sample.trim()) {
    return {
      contentLanguage: "en",
      contentTranslations: {},
      translationStatus: "none",
      translateCalls: 0,
      fieldCalls: emptyCalls,
    };
  }
  const sourceLanguage = resolveJobSourceLanguage({
    ...input.source,
    contentLanguage: input.contentLanguage,
  });
  const sourceVersionHash = hashJobSource(input.source);
  const next: JobContentTranslations = { ...(input.existing ?? {}) };
  next[sourceLanguage] = entryFromSource(input.source);
  const targets = (input.languages ?? []).filter(
    (language) => language !== sourceLanguage,
  );
  if (targets.length === 0) {
    return {
      contentLanguage: sourceLanguage,
      contentTranslations: next,
      translationStatus: "none",
      translateCalls: 0,
      fieldCalls: emptyCalls,
    };
  }

  let calls = 0;
  const fieldCalls = emptyFieldCalls();
  let failedTargets = 0;

  await Promise.all(
    targets.map(async (target) => {
      const previous = next[target];
      const translated: JobFieldTranslation = previous
        ? { ...previous }
        : blankTargetTranslation();
      let targetFailed = false;
      let translatedAny = false;
      for (const field of JOB_TRANSLATABLE_FIELDS) {
        const value = input.source[field];
        const hash = hashJobField(value);
        const hashKey = `${field}Hash` as const;
        if (!value) {
          translated[field] = "";
          translated[hashKey] = hash;
          continue;
        }
        if (isUsableFieldTranslation(value, previous, field)) {
          continue;
        }
        const log = {
          jobId: input.publicJobId,
          field,
          sourceHash: sourceVersionHash,
        };
        const result = looksLikeHtmlContent(value)
          ? await translateJobHtmlField({
              html: value,
              sourceLanguage,
              targetLanguage: target,
              fetchImpl: input.fetchImpl,
              log,
            })
          : await translateJobField({
              text: value,
              sourceLanguage,
              targetLanguage: target,
              fetchImpl: input.fetchImpl,
              log,
            });
        calls += result.calls;
        fieldCalls[field] += result.calls;
        if (
          result.failed ||
          !result.text.trim() ||
          !translatedTextIsPersistable(value, result.text)
        ) {
          targetFailed = true;
          translated[hashKey] = "";
          if (result.hardFailure) {
            clearUnusableFieldHashes(translated, input.source, previous);
            break;
          }
          continue;
        }
        translated[field] = result.text;
        translated[hashKey] = hash;
        translatedAny = true;
      }
      translated.lastAttemptAt = new Date().toISOString();
      translated.status = targetFailed
        ? translatedAny
          ? "partial"
          : "failed"
        : "completed";
      if (targetFailed) failedTargets += 1;
      next[target] = translated;
    }),
  );

  const translationStatus =
    failedTargets === 0
      ? "complete"
      : failedTargets === targets.length
        ? "failed"
        : "partial";

  return {
    contentLanguage: sourceLanguage,
    contentTranslations: next,
    translationStatus,
    translateCalls: calls,
    fieldCalls,
  };
}

export function resolveJobContent<T extends SourceFields & {
  contentLanguage?: string | null;
  contentTranslations?: JobContentTranslations | null;
}>(job: T, language: JobContentLanguage | null): SourceFields {
  const source = readSource(job);
  if (!language || language === resolveJobSourceLanguage({ ...job, ...source })) {
    return source;
  }
  const stored = job.contentTranslations?.[language];
  if (!stored) return source;
  const usable = (field: JobTranslatableField): string =>
    isUsableFieldTranslation(source[field], stored, field)
      ? (stored[field]?.trim() ?? "")
      : source[field];
  return {
    jobTitle: normalizeInternationalNumerals(usable("jobTitle")),
    description: normalizeInternationalNumerals(usable("description")),
    interviewInstructions: normalizeInternationalNumerals(
      usable("interviewInstructions"),
    ),
  };
}

/**
 * A stored translation is shown only when it was produced from the current
 * source text (hash match) and kept the source HTML structure. Stale entries
 * (e.g. after an approved live edit) fall back to the original text.
 * Failed/empty rows and English clones are never treated as translations.
 */
export function isUsableFieldTranslation(
  sourceValue: string,
  stored: JobFieldTranslation | undefined,
  field: JobTranslatableField,
): boolean {
  const translated = stored?.[field]?.trim() ?? "";
  if (
    !translated ||
    stored?.[`${field}Hash`] !== hashJobField(sourceValue) ||
    !hasMatchingHtmlStructure(sourceValue, translated) ||
    isUntranslatedSourceClone(sourceValue, translated)
  ) {
    return false;
  }
  return translationPreservesSourceNumbers(sourceValue, translated);
}

function isUntranslatedSourceClone(sourceValue: string, translated: string): boolean {
  const source = sourceValue.trim();
  const next = translated.trim();
  return Boolean(source) && source === next;
}

function translatedTextIsPersistable(sourceValue: string, translated: string): boolean {
  if (!translated.trim()) {
    return false;
  }
  if (!hasMatchingHtmlStructure(sourceValue, translated)) {
    return false;
  }
  if (!translationPreservesSourceNumbers(sourceValue, translated)) {
    return false;
  }
  return !isUntranslatedSourceClone(sourceValue, translated);
}

export function hasUsableTranslatedField(
  source: SourceFields,
  stored: JobFieldTranslation | undefined,
): boolean {
  return JOB_TRANSLATABLE_FIELDS.some(
    (field) =>
      Boolean(source[field].trim()) &&
      isUsableFieldTranslation(source[field], stored, field),
  );
}

export function translationPreservesSourceNumbers(
  source: string,
  translated: string,
): boolean {
  const literals = extractJobNumericLiterals(source);
  if (literals.length === 0) {
    return true;
  }
  const normalized = normalizeInternationalNumerals(translated);
  return literals.every((literal) => normalized.includes(literal));
}

type TranslatableJob = {
  jobTitle?: string;
  description?: string;
  interviewInstructions?: string;
  contentLanguage?: string | null;
  contentTranslations?: JobContentTranslations | null;
};

/**
 * True when a target language is missing, stale, or structurally broken for
 * any non-empty field. Pass `languages` to limit the check (list payloads only
 * project the requested language); fields absent from the payload are skipped.
 */
export function needsJobContentTranslation(
  job: TranslatableJob,
  languages?: readonly JobContentLanguage[],
): boolean {
  const source = readSource(job);
  const sample = `${source.jobTitle}\n${source.description}\n${source.interviewInstructions}`;
  if (!sample.trim()) {
    return false;
  }
  const sourceLanguage = resolveJobSourceLanguage(job);
  const targets = (languages ?? JOB_CONTENT_LANGUAGES).filter(
    (language) => language !== sourceLanguage,
  );
  return targets.some((language) => {
    const stored = job.contentTranslations?.[language];
    return JOB_TRANSLATABLE_FIELDS.some(
      (field) =>
        Boolean(source[field]) && !isUsableFieldTranslation(source[field], stored, field),
    );
  });
}

export function languageNeedsTranslation(
  job: TranslatableJob,
  language: JobContentLanguage,
): boolean {
  return needsJobContentTranslation(job, [language]);
}

export function shouldSkipFailedTranslationRetry(
  stored: JobFieldTranslation | undefined,
  source: SourceFields,
): boolean {
  if (!stored || stored.status !== "failed") {
    return false;
  }
  const staleBecauseEdited = JOB_TRANSLATABLE_FIELDS.some((field) => {
    const value = source[field];
    const storedHash = stored[`${field}Hash`];
    return Boolean(value) && Boolean(storedHash) && storedHash !== hashJobField(value);
  });
  if (staleBecauseEdited) {
    return false;
  }
  return isTranslationRetryCoolingDown(stored.lastAttemptAt);
}

export async function translateRequestedJobLanguage(input: {
  source: SourceFields;
  existing?: JobContentTranslations | null;
  language: JobContentLanguage;
  contentLanguage?: string | null;
  publicJobId?: string;
  fetchImpl?: typeof fetch;
  /** Worker retries bypass the public request cooldown. */
  forceRetry?: boolean;
}): Promise<{
  content: SourceFields;
  event: JobTranslationLogEvent;
  translateCalls: number;
  contentTranslations: JobContentTranslations;
  contentLanguage: JobContentLanguage;
}> {
  const job = {
    ...input.source,
    contentTranslations: input.existing,
    contentLanguage: input.contentLanguage,
  };
  const sourceLanguage = resolveJobSourceLanguage(job);

  if (!`${input.source.jobTitle}\n${input.source.description}\n${input.source.interviewInstructions}`.trim() || input.language === sourceLanguage) {
    const skippedSource = input.language === sourceLanguage;
    logJobTranslation(
      skippedSource ? "TRANSLATION_SKIPPED_SOURCE_LANGUAGE" : "TRANSLATION_SKIPPED",
      {
        jobId: input.publicJobId,
        language: input.language,
        reason: skippedSource ? "same_language" : "empty",
      },
    );
    return {
      content: input.source,
      event: skippedSource ? "TRANSLATION_SKIPPED_SOURCE_LANGUAGE" : "TRANSLATION_SKIPPED",
      translateCalls: 0,
      contentTranslations: input.existing ?? {},
      contentLanguage: sourceLanguage,
    };
  }

  const sourceVersionHash = hashJobSource(input.source);

  if (!languageNeedsTranslation(job, input.language)) {
    logJobTranslation("CACHE_HIT", {
      jobId: input.publicJobId,
      language: input.language,
      sourceHash: sourceVersionHash,
    });
    return {
      content: resolveJobContent(job, input.language),
      event: "CACHE_HIT",
      translateCalls: 0,
      contentTranslations: input.existing ?? {},
      contentLanguage: sourceLanguage,
    };
  }

  const stored = input.existing?.[input.language];
  if (!input.forceRetry && shouldSkipFailedTranslationRetry(stored, input.source)) {
    logJobTranslation("TRANSLATION_SKIPPED", {
      jobId: input.publicJobId,
      language: input.language,
      reason: "retry_cooldown",
      sourceHash: sourceVersionHash,
    });
    return {
      content: resolveJobContent(job, input.language),
      event: "TRANSLATION_SKIPPED",
      translateCalls: 0,
      contentTranslations: input.existing ?? {},
      contentLanguage: sourceLanguage,
    };
  }

  logJobTranslation("CACHE_MISS", {
    jobId: input.publicJobId,
    language: input.language,
    sourceHash: sourceVersionHash,
  });
  logJobTranslation("TRANSLATION_STARTED", {
    jobId: input.publicJobId,
    language: input.language,
    sourceHash: sourceVersionHash,
  });

  const built = await buildJobContentTranslations({
    source: input.source,
    existing: input.existing,
    languages: [input.language],
    contentLanguage: input.contentLanguage ?? sourceLanguage,
    publicJobId: input.publicJobId,
    fetchImpl: input.fetchImpl,
  });
  const requested = built.contentTranslations[input.language];
  const usableAny = hasUsableTranslatedField(input.source, requested);
  const stillNeeds = languageNeedsTranslation(
    {
      ...input.source,
      contentLanguage: sourceLanguage,
      contentTranslations: built.contentTranslations,
    },
    input.language,
  );

  if (!usableAny || built.translationStatus === "failed") {
    logJobTranslation("TRANSLATION_FAILED", {
      jobId: input.publicJobId,
      language: input.language,
      sourceHash: sourceVersionHash,
      calls: built.translateCalls,
      reason: built.translationStatus,
    });
    logJobTranslationSummary({
      jobId: input.publicJobId,
      language: input.language,
      sarvamCalls: built.translateCalls,
      fieldCalls: built.fieldCalls,
      status: "failed",
    });
    return {
      content: resolveJobContent(
        { ...input.source, contentTranslations: built.contentTranslations },
        input.language,
      ),
      event: "TRANSLATION_FAILED",
      translateCalls: built.translateCalls,
      contentTranslations: built.contentTranslations,
      contentLanguage: built.contentLanguage,
    };
  }

  if (!stillNeeds && built.translateCalls === 0) {
    logJobTranslation("CACHE_HIT", {
      jobId: input.publicJobId,
      language: input.language,
      sourceHash: sourceVersionHash,
    });
    logJobTranslationSummary({
      jobId: input.publicJobId,
      language: input.language,
      sarvamCalls: 0,
      fieldCalls: built.fieldCalls,
      status: "cache_hit",
    });
    return {
      content: resolveJobContent(
        { ...input.source, contentTranslations: built.contentTranslations },
        input.language,
      ),
      event: "CACHE_HIT",
      translateCalls: 0,
      contentTranslations: built.contentTranslations,
      contentLanguage: built.contentLanguage,
    };
  }

  logJobTranslationSummary({
    jobId: input.publicJobId,
    language: input.language,
    sarvamCalls: built.translateCalls,
    fieldCalls: built.fieldCalls,
    status: "success",
  });
  return {
    content: resolveJobContent(
      { ...input.source, contentTranslations: built.contentTranslations },
      input.language,
    ),
    event: "TRANSLATION_CREATED",
    translateCalls: built.translateCalls,
    contentTranslations: built.contentTranslations,
    contentLanguage: built.contentLanguage,
  };
}

/**
 * Single Sarvam boundary for job content. List pages must not call this in a loop.
 * Detail pages call it once for the requested language.
 */
export type PublicJobTranslationStatus = "ready" | "pending" | "fallback" | "failed";

/**
 * Decides what a job-detail request may return without calling a translation
 * provider. Usable per-field translations are returned immediately. Missing
 * or stale fields stay on the original text and can be queued for one language.
 */
export function resolvePublicJobTranslationView(
  job: TranslatableJob,
  language: JobContentLanguage | null,
): {
  content: SourceFields;
  language: JobContentLanguage | null;
  sourceLanguage: JobContentLanguage;
  translationStatus: PublicJobTranslationStatus;
  isTranslated: boolean;
  shouldEnqueue: boolean;
} {
  const source = readSource(job);
  const sourceLanguage = resolveJobSourceLanguage({ ...job, ...source });
  if (!language) {
    return {
      content: source,
      language: null,
      sourceLanguage,
      translationStatus: "fallback",
      isTranslated: false,
      shouldEnqueue: false,
    };
  }

  if (!`${source.jobTitle}\n${source.description}\n${source.interviewInstructions}`.trim() || language === sourceLanguage) {
    return {
      content: source,
      language,
      sourceLanguage,
      translationStatus: "ready",
      isTranslated: false,
      shouldEnqueue: false,
    };
  }

  const content = resolveJobContent({ ...job, ...source }, language);
  const needsTranslation = languageNeedsTranslation(job, language);
  const isTranslated = !needsTranslation && hasUsableTranslatedContent(content, source);

  if (!needsTranslation) {
    return {
      content,
      language,
      sourceLanguage,
      translationStatus: "ready",
      isTranslated,
      shouldEnqueue: false,
    };
  }

  if (shouldSkipFailedTranslationRetry(job.contentTranslations?.[language], source)) {
    return {
      content,
      language,
      sourceLanguage,
      translationStatus: "failed",
      isTranslated,
      shouldEnqueue: false,
    };
  }

  return {
    content,
    language,
    sourceLanguage,
    translationStatus: "pending",
    isTranslated,
    shouldEnqueue: true,
  };
}

/**
 * `contentLanguage` is the requested language only when every required field
 * is a usable translation. Partial and failed responses stay on the source language.
 */
export function resolveDisplayedContentLanguage(
  translationStatus: PublicJobTranslationStatus,
  isTranslated: boolean,
  language: JobContentLanguage | null,
  sourceLanguage: JobContentLanguage,
): JobContentLanguage {
  if (translationStatus === "ready" && isTranslated && language) {
    return language;
  }
  return sourceLanguage;
}

function hasUsableTranslatedContent(
  resolved: SourceFields,
  source: SourceFields,
): boolean {
  return JOB_TRANSLATABLE_FIELDS.some(
    (field) => Boolean(resolved[field].trim()) && resolved[field] !== source[field],
  );
}

export async function translateJobContentOnDemand(input: {
  jobMongoId: string;
  publicJobId?: string;
  language: JobContentLanguage | null;
  fetchImpl?: typeof fetch;
  forceRetry?: boolean;
  /** Operations preview may translate drafts; public detail never should. */
  allowDraft?: boolean;
}): Promise<{
  content: SourceFields;
  source: SourceFields;
  event: JobTranslationLogEvent;
  translateCalls: number;
  stillNeedsTranslation: boolean;
}> {
  const empty = { jobTitle: "", description: "", interviewInstructions: "" };
  const job = await JobModel.findById(input.jobMongoId).select(
    "jobTitle description interviewInstructions contentLanguage contentTranslations status",
  );
  if (!job) {
    return {
      content: empty,
      source: empty,
      event: "TRANSLATION_SKIPPED",
      translateCalls: 0,
      stillNeedsTranslation: false,
    };
  }
  const source = readSource(job);
  const isDraftBlocked = job.status === "draft" && !input.allowDraft;
  if (!input.language || isDraftBlocked) {
    logJobTranslation("TRANSLATION_SKIPPED", {
      jobId: input.publicJobId,
      language: input.language ?? "",
      reason: isDraftBlocked ? "draft" : "no_language",
    });
    return {
      content: source,
      source,
      event: "TRANSLATION_SKIPPED",
      translateCalls: 0,
      stillNeedsTranslation: false,
    };
  }

  return withTranslationInFlight(
    translationInFlightKey(input.jobMongoId, input.language),
    async () => {
      const fresh = await JobModel.findById(input.jobMongoId).select(
        "jobTitle description interviewInstructions contentLanguage contentTranslations",
      );
      const latestSource = fresh ? readSource(fresh) : source;
      const existing = (fresh?.contentTranslations ??
        job.contentTranslations ??
        null) as JobContentTranslations | null;
      const storedSourceLanguage =
        fresh?.contentLanguage ?? job.contentLanguage ?? null;
      const sourceVersionHash = hashJobSource(latestSource);
      const result = await translateRequestedJobLanguage({
        source: latestSource,
        existing,
        language: input.language!,
        contentLanguage: storedSourceLanguage,
        publicJobId: input.publicJobId,
        fetchImpl: input.fetchImpl,
        forceRetry: input.forceRetry,
      });
      const canonicalLanguage =
        parseJobContentLanguage(storedSourceLanguage) ?? result.contentLanguage;
      const persistSets: Record<string, unknown> = {};
      if (!parseJobContentLanguage(storedSourceLanguage)) {
        persistSets.contentLanguage = result.contentLanguage;
      }

      if (result.event === "TRANSLATION_CREATED") {
        const requested = result.contentTranslations[input.language!];
        if (hasUsableTranslatedField(latestSource, requested)) {
          persistSets[`contentTranslations.${input.language}`] = requested;
          await JobModel.updateOne({ _id: job._id }, { $set: persistSets });
          logJobTranslation("TRANSLATION_PERSISTED", {
            jobId: input.publicJobId,
            language: input.language ?? undefined,
            sourceHash: sourceVersionHash,
            calls: result.translateCalls,
          });
          logJobTranslation("TRANSLATION_CREATED", {
            jobId: input.publicJobId,
            language: input.language ?? undefined,
            sourceHash: sourceVersionHash,
            calls: result.translateCalls,
            reason: "mongo",
          });
        } else {
          persistSets[`contentTranslations.${input.language}`] = {
            ...(requested ?? {}),
            lastAttemptAt: new Date().toISOString(),
            status: "failed",
          };
          await JobModel.updateOne({ _id: job._id }, { $set: persistSets });
          logJobTranslation("TRANSLATION_FAILED", {
            jobId: input.publicJobId,
            language: input.language ?? undefined,
            sourceHash: sourceVersionHash,
            calls: result.translateCalls,
            reason: "nothing_persistable",
          });
          return {
            content: result.content,
            source: latestSource,
            event: "TRANSLATION_FAILED" as const,
            translateCalls: result.translateCalls,
            stillNeedsTranslation: true,
          };
        }
      } else if (result.event === "TRANSLATION_FAILED") {
        const failed = result.contentTranslations[input.language!];
        if (failed) {
          persistSets[`contentTranslations.${input.language}`] = {
            ...failed,
            lastAttemptAt: new Date().toISOString(),
          };
        }
        if (Object.keys(persistSets).length > 0) {
          await JobModel.updateOne({ _id: job._id }, { $set: persistSets });
        }
      }

      const persistedTranslations: JobContentTranslations = {
        ...existing,
        ...result.contentTranslations,
      };
      if (persistSets[`contentTranslations.${input.language}`]) {
        persistedTranslations[input.language!] = persistSets[
          `contentTranslations.${input.language}`
        ] as JobFieldTranslation;
      }

      return {
        content: result.content,
        source: latestSource,
        event: result.event,
        translateCalls: result.translateCalls,
        stillNeedsTranslation: languageNeedsTranslation(
          {
            ...latestSource,
            contentLanguage: canonicalLanguage,
            contentTranslations: persistedTranslations,
          },
          input.language!,
        ),
      };
    },
  );
}

/**
 * Publish/submit must not enqueue translations. Source language is persisted
 * at save time; languages are generated only on an explicit detail request.
 */
export function queueJobContentTranslation(jobMongoId: string): void {
  logJobTranslation("TRANSLATION_SKIPPED", {
    jobId: jobMongoId,
    reason: "no_eager_translation",
  });
}

export async function persistJobContentTranslation(
  jobMongoId: string,
  fetchImpl?: typeof fetch,
  languages: readonly JobContentLanguage[] = [],
): Promise<{ translateCalls: number; translationStatus: string } | null> {
  if (languages.length === 0) {
    return { translateCalls: 0, translationStatus: "none" };
  }
  const job = await JobModel.findById(jobMongoId).select(
    "jobTitle description interviewInstructions contentLanguage contentTranslations",
  );
  if (!job) return null;
  const built = await buildJobContentTranslations({
    source: readSource(job),
    existing: (job.contentTranslations ?? null) as JobContentTranslations | null,
    languages,
    contentLanguage: job.contentLanguage,
    fetchImpl,
  });
  const sets: Record<string, unknown> = {};
  if (!parseJobContentLanguage(job.contentLanguage)) {
    sets.contentLanguage = built.contentLanguage;
  }
  for (const language of languages) {
    const entry = built.contentTranslations[language];
    if (entry && language !== built.contentLanguage) {
      sets[`contentTranslations.${language}`] = entry;
    }
  }
  if (Object.keys(sets).length > 0) {
    await JobModel.updateOne({ _id: job._id }, { $set: sets });
  }
  return {
    translateCalls: built.translateCalls,
    translationStatus: built.translationStatus,
  };
}

export async function backfillJobContentTranslations(_input: {
  limit: number;
  fetchImpl?: typeof fetch;
}): Promise<{ processed: number; translateCalls: number }> {
  return { processed: 0, translateCalls: 0 };
}
