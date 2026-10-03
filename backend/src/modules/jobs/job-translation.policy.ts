import { hashJobField } from "./job-content-translation.js";
import {
  JOB_CONTENT_LANGUAGES,
  parseJobContentLanguage,
  type JobContentLanguage,
} from "./job-content-language.js";

export const JOB_TRANSLATION_QUEUE_NAME = "job-content-translation";

export const JOB_TRANSLATION_TASK_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export type JobTranslationTaskStatus = (typeof JOB_TRANSLATION_TASK_STATUSES)[number];

const enqueueSlots = new Set<string>();

export function jobTranslationSourceHash(source: {
  jobTitle: string;
  description: string;
  interviewInstructions: string;
}): string {
  return hashJobField(
    `${source.jobTitle}\n${source.description}\n${source.interviewInstructions}`,
  );
}

export function jobTranslationTaskKey(
  jobMongoId: string,
  language: string,
  sourceHash: string,
): string {
  return `${jobMongoId}:${language}:${sourceHash}`;
}

export function jobTranslationCacheKey(jobMongoId: string, language: string): string {
  return `job:translation:${jobMongoId}:${language}`;
}

/** BullMQ custom ids cannot contain ":". */
export function jobTranslationQueueJobId(
  jobMongoId: string,
  language: string,
  sourceHash: string,
  attempt: number,
): string {
  return `translation-${jobMongoId}-${language}-${sourceHash.slice(0, 16)}-${attempt}`;
}

export function translationRetryDelayMs(attempt: number): number {
  const safeAttempt = Math.min(Math.max(attempt, 1), 6);
  return 30_000 * 2 ** (safeAttempt - 1);
}

export function parseConfiguredJobLanguages(
  raw: string | undefined,
): JobContentLanguage[] {
  const seen = new Set<JobContentLanguage>();
  for (const part of (raw ?? "").split(",")) {
    const language = parseJobContentLanguage(part);
    if (language && JOB_CONTENT_LANGUAGES.includes(language)) {
      seen.add(language);
    }
  }
  if (seen.size === 0) {
    return [...JOB_CONTENT_LANGUAGES];
  }
  return [...seen];
}

export function claimTranslationEnqueueSlot(key: string): boolean {
  if (enqueueSlots.has(key)) {
    return false;
  }
  enqueueSlots.add(key);
  return true;
}

export function releaseTranslationEnqueueSlot(key: string): void {
  enqueueSlots.delete(key);
}

type ExistingTranslationTask = {
  status: JobTranslationTaskStatus | string;
  attempts: number;
  nextAttemptAt?: Date | string | null;
};

/**
 * One task per job + language + source text.
 * Pending and processing tasks are never duplicated.
 * A failed task can be queued again only after its cooldown.
 */
export function canEnqueueJobTranslation(
  existing: ExistingTranslationTask | null,
  now = Date.now(),
): boolean {
  if (!existing) {
    return true;
  }
  if (
    existing.status === "pending" ||
    existing.status === "processing" ||
    existing.status === "completed"
  ) {
    return false;
  }
  if (existing.status !== "failed") {
    return false;
  }
  if (!existing.nextAttemptAt) {
    return true;
  }
  const next =
    existing.nextAttemptAt instanceof Date
      ? existing.nextAttemptAt.getTime()
      : Date.parse(existing.nextAttemptAt);
  return !Number.isFinite(next) || next <= now;
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

export function safeTranslationErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "translation_failed";
  return message.replace(/api[_-]?key[=:]\s*\S+/gi, "api_key=[redacted]").slice(0, 300);
}
