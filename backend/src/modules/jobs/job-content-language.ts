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
  hi: "hi",
  hindi: "hi",
  te: "te",
  telugu: "te",
  ta: "ta",
  tamil: "ta",
  kn: "kn",
  kannada: "kn",
  ml: "ml",
  malayalam: "ml",
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
