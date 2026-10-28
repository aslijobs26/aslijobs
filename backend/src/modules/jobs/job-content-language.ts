import type { BotLanguage } from "../whatsapp/whatsapp-bot.logic.js";

export const JOB_CONTENT_LANGUAGES = [
  "en",
  "hi",
  "te",
  "ta",
  "kn",
  "ml",
] as const satisfies readonly BotLanguage[];

export type JobContentLanguage = (typeof JOB_CONTENT_LANGUAGES)[number];

const SITE_LANGUAGE_ALIASES: Record<string, JobContentLanguage> = {
  en: "en",
  english: "en",
  "en-us": "en",
  en_us: "en",
  "en-in": "en",
  hi: "hi",
  hindi: "hi",
  "hi-in": "hi",
  hi_in: "hi",
  te: "te",
  telugu: "te",
  "te-in": "te",
  te_in: "te",
  ta: "ta",
  tamil: "ta",
  "ta-in": "ta",
  ta_in: "ta",
  kn: "kn",
  kannada: "kn",
  "kn-in": "kn",
  kn_in: "kn",
  ml: "ml",
  malayalam: "ml",
  "ml-in": "ml",
  ml_in: "ml",
};

/** Script detection. Latin text stays English; romanized Indic is not guessed. */
export function detectJobContentLanguage(text: string): JobContentLanguage {
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn";
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml";
  return "en";
}

export function parseJobContentLanguage(
  value: string | null | undefined,
): JobContentLanguage | null {
  if (!value) return null;
  return SITE_LANGUAGE_ALIASES[value.trim().toLowerCase()] ?? null;
}

export function detectCanonicalSourceLanguage(fields: {
  jobTitle?: string | null;
  description?: string | null;
  interviewInstructions?: string | null;
}): JobContentLanguage {
  return detectJobContentLanguage(
    `${fields.jobTitle ?? ""}\n${fields.description ?? ""}\n${fields.interviewInstructions ?? ""}`,
  );
}

/**
 * Prefer Indic script in the canonical text over a stale default `en`.
 * Stored `contentLanguage` is used when the source is Latin (English or romanized).
 */
export function resolveJobSourceLanguage(job: {
  contentLanguage?: string | null;
  jobTitle?: string | null;
  description?: string | null;
  interviewInstructions?: string | null;
}): JobContentLanguage {
  const detected = detectCanonicalSourceLanguage(job);
  if (detected !== "en") {
    return detected;
  }
  return parseJobContentLanguage(job.contentLanguage) ?? "en";
}
