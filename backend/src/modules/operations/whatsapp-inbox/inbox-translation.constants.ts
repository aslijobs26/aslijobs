import type { BotLanguage } from "../../whatsapp/whatsapp-bot.logic.js";

export const INBOX_TRANSLATION_LANGUAGES = [
  "en",
  "hi",
  "te",
  "ta",
  "kn",
  "ml",
] as const satisfies readonly BotLanguage[];

export type InboxTranslationLanguage =
  (typeof INBOX_TRANSLATION_LANGUAGES)[number];

/** Viewing preference: a target language, or original (no translation). */
export type InboxViewLanguage = InboxTranslationLanguage | "original";

export const INBOX_VIEW_LANGUAGES = [
  ...INBOX_TRANSLATION_LANGUAGES,
  "original",
] as const satisfies readonly InboxViewLanguage[];

/**
 * Bump when translated text is produced differently.
 * inbox-v1 stored provider text that had lost newlines.
 * inbox-v3 batches every structural segment into the fewest Mayura
 * requests and rejects a result whose layout no longer matches.
 */
export const INBOX_TRANSLATION_PIPELINE_VERSION = "inbox-v3";

export const INBOX_TRANSLATION_PROVIDER = "sarvam-mayura-v1";

export const INBOX_TRANSLATE_MESSAGE_BATCH_MAX = 40;

export const INBOX_TRANSLATE_DRAFT_MAX = 4000;

export function isInboxTranslationLanguage(
  value: string,
): value is InboxTranslationLanguage {
  return (INBOX_TRANSLATION_LANGUAGES as readonly string[]).includes(value);
}

export function isInboxViewLanguage(value: string): value is InboxViewLanguage {
  return (INBOX_VIEW_LANGUAGES as readonly string[]).includes(value);
}
