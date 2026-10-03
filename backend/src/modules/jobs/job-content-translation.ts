import { createHash } from "node:crypto";
import { JobModel } from "./job.model.js";
import {
  detectJobContentLanguage,
  JOB_CONTENT_LANGUAGES,
  type JobContentLanguage,
} from "./job-content-language.js";
import { translateText } from "../whatsapp/sarvam-translate.client.js";

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
  | "TRANSLATION_CREATED"
  | "TRANSLATION_SKIPPED"
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
export const TRANSLATION_RETRY_COOLDOWN_MS = 10 * 60_000;

const inFlightTranslations = new Map<string, Promise<unknown>>();

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
  },
): void {
  console.info(
    `[JOB-TRANSLATE] event=${event} jobId=${details.jobId ?? "-"} language=${details.language ?? "-"} field=${details.field ?? "job"} sourceHash=${details.sourceHash ?? "-"} reason=${details.reason ?? "-"} calls=${details.calls ?? 0}`,
  );
}

export function hashJobField(value: string): string {
  return createHash("sha256").update(value.trim()).digest("hex");
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
}): Promise<{ text: string; failed: boolean; calls: number }> {
  const chunks = splitForTranslation(input.text);
  if (chunks.length === 0 || input.sourceLanguage === input.targetLanguage) {
    return { text: input.text, failed: false, calls: 0 };
  }
  const translated: string[] = [];
  for (const chunk of chunks) {
    const result = await translateText({
      text: chunk,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      cache: false,
      fetchImpl: input.fetchImpl,
    });
    if (result.failed || !result.translated) {
      return { text: input.text, failed: true, calls: translated.length + 1 };
    }
    translated.push(result.text);
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

/**
 * Translates only the text between tags and copies every tag verbatim.
 * Segments are sent as one newline-joined batch; if the provider does not
 * return one line per segment, each segment is translated individually.
 */
export async function translateJobHtmlField(input: {
  html: string;
  sourceLanguage: JobContentLanguage;
  targetLanguage: JobContentLanguage;
  fetchImpl?: typeof fetch;
}): Promise<{ text: string; failed: boolean; calls: number }> {
  const tokens = input.html.split(HTML_TAG_SPLIT_PATTERN);
  const textIndexes = tokens.flatMap((token, index) =>
    !token.startsWith("<") && token.trim() ? [index] : [],
  );
  if (textIndexes.length === 0 || input.sourceLanguage === input.targetLanguage) {
    return { text: input.html, failed: false, calls: 0 };
  }

  const segments = textIndexes.map((index) => tokens[index].replace(/\s+/g, " ").trim());
  const translate = (text: string) =>
    translateJobField({
      text,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      fetchImpl: input.fetchImpl,
    });

  let calls = 0;
  let translatedSegments: string[] | null = null;

  const batch = await translate(segments.join("\n"));
  calls += batch.calls;
  if (batch.failed) {
    return { text: input.html, failed: true, calls };
  }
  const lines = batch.text.split("\n").map((line) => line.trim());
  if (lines.length === segments.length && lines.every(Boolean)) {
    translatedSegments = lines;
  } else {
    translatedSegments = [];
    for (const segment of segments) {
      const result = await translate(segment);
      calls += result.calls;
      if (result.failed) {
        return { text: input.html, failed: true, calls };
      }
      translatedSegments.push(result.text.replace(/\s+/g, " ").trim());
    }
  }

  textIndexes.forEach((tokenIndex, segmentIndex) => {
    const original = tokens[tokenIndex];
    const leading = original.match(/^\s*/)?.[0] ?? "";
    const trailing = original.match(/\s*$/)?.[0] ?? "";
    tokens[tokenIndex] = `${leading}${translatedSegments[segmentIndex]}${trailing}`;
  });

  return { text: tokens.join(""), failed: false, calls };
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

export async function buildJobContentTranslations(input: {
  source: SourceFields;
  existing?: JobContentTranslations | null;
  languages?: readonly JobContentLanguage[];
  fetchImpl?: typeof fetch;
}): Promise<{
  contentLanguage: JobContentLanguage;
  contentTranslations: JobContentTranslations;
  translationStatus: "complete" | "partial" | "failed" | "none";
  translateCalls: number;
}> {
  const sample = `${input.source.jobTitle}\n${input.source.description}\n${input.source.interviewInstructions}`;
  if (!sample.trim()) {
    return {
      contentLanguage: "en",
      contentTranslations: {},
      translationStatus: "none",
      translateCalls: 0,
    };
  }
  const contentLanguage = detectJobContentLanguage(sample);
  const next: JobContentTranslations = { ...(input.existing ?? {}) };
  next[contentLanguage] = entryFromSource(input.source);
  const targets = (input.languages ?? []).filter(
    (language) => language !== contentLanguage,
  );
  if (targets.length === 0) {
    return {
      contentLanguage,
      contentTranslations: next,
      translationStatus: "none",
      translateCalls: 0,
    };
  }

  let calls = 0;
  let failedTargets = 0;

  await Promise.all(
    targets.map(async (target) => {
      const previous = next[target];
      const translated: JobFieldTranslation = previous
        ? { ...previous }
        : entryFromSource({
            jobTitle: "",
            description: "",
            interviewInstructions: "",
          });
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
        if (
          previous &&
          previous[hashKey] === hash &&
          previous[field].trim() &&
          hasMatchingHtmlStructure(value, previous[field])
        ) {
          continue;
        }
        const result = looksLikeHtmlContent(value)
          ? await translateJobHtmlField({
              html: value,
              sourceLanguage: contentLanguage,
              targetLanguage: target,
              fetchImpl: input.fetchImpl,
            })
          : await translateJobField({
              text: value,
              sourceLanguage: contentLanguage,
              targetLanguage: target,
              fetchImpl: input.fetchImpl,
            });
        calls += result.calls;
        if (result.failed) {
          targetFailed = true;
          if (!hasMatchingHtmlStructure(value, translated[field])) {
            translated[field] = "";
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

  return { contentLanguage, contentTranslations: next, translationStatus, translateCalls: calls };
}

export function resolveJobContent<T extends SourceFields & {
  contentLanguage?: string;
  contentTranslations?: JobContentTranslations | null;
}>(job: T, language: JobContentLanguage | null): SourceFields {
  if (!language) {
    return readSource(job);
  }
  const stored = job.contentTranslations?.[language];
  const source = readSource(job);
  if (!stored) return source;
  const usable = (field: JobTranslatableField): string =>
    isUsableFieldTranslation(source[field], stored, field)
      ? (stored[field]?.trim() ?? "")
      : source[field];
  return {
    jobTitle: usable("jobTitle"),
    description: usable("description"),
    interviewInstructions: usable("interviewInstructions"),
  };
}

/**
 * A stored translation is shown only when it was produced from the current
 * source text (hash match) and kept the source HTML structure. Stale entries
 * (e.g. after an approved live edit) fall back to the original text.
 */
function isUsableFieldTranslation(
  sourceValue: string,
  stored: JobFieldTranslation | undefined,
  field: JobTranslatableField,
): boolean {
  const translated = stored?.[field]?.trim() ?? "";
  return (
    Boolean(translated) &&
    stored?.[`${field}Hash`] === hashJobField(sourceValue) &&
    hasMatchingHtmlStructure(sourceValue, translated)
  );
}

type TranslatableJob = {
  jobTitle?: string;
  description?: string;
  interviewInstructions?: string;
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
  const sourceLanguage = detectJobContentLanguage(sample);
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
    return Boolean(value) && stored[`${field}Hash`] !== hashJobField(value);
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
  const job = { ...input.source, contentTranslations: input.existing };
  const sample = `${input.source.jobTitle}\n${input.source.description}\n${input.source.interviewInstructions}`;
  const sourceLanguage = detectJobContentLanguage(sample);

  if (!sample.trim() || input.language === sourceLanguage) {
    logJobTranslation("TRANSLATION_SKIPPED", {
      jobId: input.publicJobId,
      language: input.language,
      reason: input.language === sourceLanguage ? "same_language" : "empty",
    });
    return {
      content: input.source,
      event: "TRANSLATION_SKIPPED",
      translateCalls: 0,
      contentTranslations: input.existing ?? {},
      contentLanguage: sourceLanguage,
    };
  }

  if (!languageNeedsTranslation(job, input.language)) {
    logJobTranslation("CACHE_HIT", {
      jobId: input.publicJobId,
      language: input.language,
      sourceHash: hashJobField(input.source.jobTitle),
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
      sourceHash: hashJobField(input.source.jobTitle),
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
    sourceHash: hashJobField(input.source.jobTitle),
  });

  const built = await buildJobContentTranslations({
    source: input.source,
    existing: input.existing,
    languages: [input.language],
    fetchImpl: input.fetchImpl,
  });
  const event: JobTranslationLogEvent =
    built.translationStatus === "failed" ? "TRANSLATION_FAILED" : "TRANSLATION_CREATED";
  logJobTranslation(event, {
    jobId: input.publicJobId,
    language: input.language,
    sourceHash: hashJobField(input.source.jobTitle),
    calls: built.translateCalls,
    reason: built.translationStatus,
  });

  return {
    content: resolveJobContent(
      { ...input.source, contentTranslations: built.contentTranslations },
      input.language,
    ),
    event,
    translateCalls: built.translateCalls,
    contentTranslations: built.contentTranslations,
    contentLanguage: built.contentLanguage,
  };
}

/**
 * Single Sarvam boundary for job content. List pages must not call this in a loop.
 * Detail pages call it once for the requested language.
 */
export type PublicJobTranslationStatus = "pending" | "completed" | "failed" | "none";

/**
 * Decides what a job-detail request may return without calling a translation
 * provider. Missing translations stay on the original text and can be queued.
 */
export function resolvePublicJobTranslationView(
  job: TranslatableJob,
  language: JobContentLanguage | null,
): {
  content: SourceFields;
  language: JobContentLanguage | null;
  translationStatus: PublicJobTranslationStatus;
  isTranslated: boolean;
  shouldEnqueue: boolean;
} {
  const source = readSource(job);
  if (!language) {
    return {
      content: source,
      language: null,
      translationStatus: "none",
      isTranslated: false,
      shouldEnqueue: false,
    };
  }

  const sample = `${source.jobTitle}\n${source.description}\n${source.interviewInstructions}`;
  const sourceLanguage = detectJobContentLanguage(sample);
  if (!sample.trim() || language === sourceLanguage) {
    return {
      content: source,
      language,
      translationStatus: "none",
      isTranslated: false,
      shouldEnqueue: false,
    };
  }

  if (!languageNeedsTranslation(job, language)) {
    return {
      content: resolveJobContent({ ...job, ...source }, language),
      language,
      translationStatus: "completed",
      isTranslated: true,
      shouldEnqueue: false,
    };
  }

  if (shouldSkipFailedTranslationRetry(job.contentTranslations?.[language], source)) {
    return {
      content: source,
      language,
      translationStatus: "failed",
      isTranslated: false,
      shouldEnqueue: false,
    };
  }

  return {
    content: source,
    language,
    translationStatus: "pending",
    isTranslated: false,
    shouldEnqueue: true,
  };
}

export async function translateJobContentOnDemand(input: {
  jobMongoId: string;
  publicJobId?: string;
  language: JobContentLanguage | null;
  fetchImpl?: typeof fetch;
  forceRetry?: boolean;
}): Promise<{
  content: SourceFields;
  event: JobTranslationLogEvent;
  translateCalls: number;
}> {
  const job = await JobModel.findById(input.jobMongoId).select(
    "jobTitle description interviewInstructions contentTranslations status",
  );
  if (!job) {
    return {
      content: { jobTitle: "", description: "", interviewInstructions: "" },
      event: "TRANSLATION_SKIPPED",
      translateCalls: 0,
    };
  }
  const source = readSource(job);
  if (!input.language || job.status === "draft") {
    logJobTranslation("TRANSLATION_SKIPPED", {
      jobId: input.publicJobId,
      language: input.language ?? "",
      reason: job.status === "draft" ? "draft" : "no_language",
    });
    return { content: source, event: "TRANSLATION_SKIPPED", translateCalls: 0 };
  }

  return withTranslationInFlight(
    translationInFlightKey(input.jobMongoId, input.language),
    async () => {
      const fresh = await JobModel.findById(input.jobMongoId).select(
        "jobTitle description interviewInstructions contentTranslations",
      );
      const latestSource = fresh ? readSource(fresh) : source;
      const existing = (fresh?.contentTranslations ??
        job.contentTranslations ??
        null) as JobContentTranslations | null;
      const result = await translateRequestedJobLanguage({
        source: latestSource,
        existing,
        language: input.language!,
        publicJobId: input.publicJobId,
        fetchImpl: input.fetchImpl,
        forceRetry: input.forceRetry,
      });
      if (result.event === "TRANSLATION_CREATED" || result.event === "TRANSLATION_FAILED") {
        await JobModel.updateOne(
          { _id: job._id },
          {
            $set: {
              contentLanguage: result.contentLanguage,
              [`contentTranslations.${result.contentLanguage}`]:
                result.contentTranslations[result.contentLanguage],
              [`contentTranslations.${input.language}`]:
                result.contentTranslations[input.language!],
            },
          },
        );
      }
      return {
        content: result.content,
        event: result.event,
        translateCalls: result.translateCalls,
      };
    },
  );
}

/**
 * Queues background translation for configured languages.
 * Never translates inside the caller’s request.
 */
export function queueJobContentTranslation(jobMongoId: string): void {
  void import("./job-translation.queue.js")
    .then((queue) => {
      queue.scheduleJobContentTranslations(jobMongoId);
    })
    .catch((error: unknown) => {
      console.error("[JOB-TRANSLATE] event=TRANSLATION_FAILED", {
        jobId: jobMongoId,
        language: "-",
        attempt: 0,
        error: error instanceof Error ? error.message : "enqueue_failed",
        timestamp: new Date().toISOString(),
      });
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
    "jobTitle description interviewInstructions contentTranslations",
  );
  if (!job) return null;
  const built = await buildJobContentTranslations({
    source: readSource(job),
    existing: (job.contentTranslations ?? null) as JobContentTranslations | null,
    languages,
    fetchImpl,
  });
  const sets: Record<string, unknown> = {
    contentLanguage: built.contentLanguage,
    translationStatus: built.translationStatus,
  };
  for (const language of [built.contentLanguage, ...languages]) {
    if (built.contentTranslations[language]) {
      sets[`contentTranslations.${language}`] = built.contentTranslations[language];
    }
  }
  await JobModel.updateOne({ _id: job._id }, { $set: sets });
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
