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

export type JobFieldTranslation = {
  jobTitle: string;
  description: string;
  interviewInstructions: string;
  jobTitleHash: string;
  descriptionHash: string;
  interviewInstructionsHash: string;
};

export type JobContentTranslations = Partial<
  Record<JobContentLanguage, JobFieldTranslation>
>;

const CHUNK = 900;

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

function entryFromSource(
  source: SourceFields,
): JobFieldTranslation {
  return {
    jobTitle: source.jobTitle,
    description: source.description,
    interviewInstructions: source.interviewInstructions,
    jobTitleHash: hashJobField(source.jobTitle),
    descriptionHash: hashJobField(source.description),
    interviewInstructionsHash: hashJobField(source.interviewInstructions),
  };
}

export async function buildJobContentTranslations(input: {
  source: SourceFields;
  existing?: JobContentTranslations | null;
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
  let calls = 0;
  let failedTargets = 0;
  const targets = JOB_CONTENT_LANGUAGES.filter((language) => language !== contentLanguage);

  await Promise.all(
    targets.map(async (target) => {
      const previous = next[target];
      const translated: JobFieldTranslation = previous
        ? { ...previous }
        : entryFromSource({ jobTitle: "", description: "", interviewInstructions: "" });
      let targetFailed = false;
      for (const field of JOB_TRANSLATABLE_FIELDS) {
        const value = input.source[field];
        const hash = hashJobField(value);
        const hashKey = `${field}Hash` as const;
        if (!value) {
          translated[field] = "";
          translated[hashKey] = hash;
          continue;
        }
        if (previous && previous[hashKey] === hash && previous[field].trim()) {
          continue;
        }
        const result = await translateJobField({
          text: value,
          sourceLanguage: contentLanguage,
          targetLanguage: target,
          fetchImpl: input.fetchImpl,
        });
        calls += result.calls;
        if (result.failed) {
          targetFailed = true;
          continue;
        }
        translated[field] = result.text;
        translated[hashKey] = hash;
      }
      if (targetFailed) failedTargets += 1;
      next[target] = translated;
    }),
  );

  const translationStatus =
    failedTargets === 0 ? "complete" : failedTargets === targets.length ? "failed" : "partial";

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
  return {
    jobTitle: stored.jobTitle?.trim() || source.jobTitle,
    description: stored.description?.trim() || source.description,
    interviewInstructions:
      stored.interviewInstructions?.trim() || source.interviewInstructions,
  };
}

const pending = new Set<string>();

/** Translate once after save. Failures never overwrite original job fields. */
export function queueJobContentTranslation(
  jobMongoId: string,
  fetchImpl?: typeof fetch,
): void {
  if (!jobMongoId || pending.has(jobMongoId)) return;
  pending.add(jobMongoId);
  void persistJobContentTranslation(jobMongoId, fetchImpl).finally(() => {
    pending.delete(jobMongoId);
  });
}

export async function persistJobContentTranslation(
  jobMongoId: string,
  fetchImpl?: typeof fetch,
): Promise<{ translateCalls: number; translationStatus: string } | null> {
  const job = await JobModel.findById(jobMongoId).select(
    "jobTitle description interviewInstructions contentTranslations",
  );
  if (!job) return null;
  const built = await buildJobContentTranslations({
    source: readSource(job),
    existing: (job.contentTranslations ?? null) as JobContentTranslations | null,
    fetchImpl,
  });
  await JobModel.updateOne(
    { _id: job._id },
    {
      $set: {
        contentLanguage: built.contentLanguage,
        contentTranslations: built.contentTranslations,
        translationStatus: built.translationStatus,
      },
    },
  );
  return {
    translateCalls: built.translateCalls,
    translationStatus: built.translationStatus,
  };
}

export async function backfillJobContentTranslations(input: {
  limit: number;
  fetchImpl?: typeof fetch;
}): Promise<{ processed: number; translateCalls: number }> {
  const jobs = await JobModel.find({
    translationStatus: { $in: ["none", "failed", "partial", null] },
    status: { $ne: "draft" },
  })
    .select("_id")
    .limit(Math.min(Math.max(input.limit, 1), 20));
  let translateCalls = 0;
  for (const job of jobs) {
    const result = await persistJobContentTranslation(job._id.toString(), input.fetchImpl);
    translateCalls += result?.translateCalls ?? 0;
  }
  return { processed: jobs.length, translateCalls };
}
