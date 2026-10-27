export const INBOX_TRANSLATION_LANGUAGES = [
  "en",
  "hi",
  "te",
  "ta",
  "kn",
  "ml",
] as const;

export type InboxTranslationLanguage =
  (typeof INBOX_TRANSLATION_LANGUAGES)[number];

export type InboxViewLanguage = InboxTranslationLanguage | "original";

export const INBOX_TRANSLATION_LANGUAGE_OPTIONS: Array<{
  code: InboxTranslationLanguage;
  label: string;
  nativeLabel: string;
}> = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिंदी" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം" },
];

export function isInboxTranslationLanguage(
  value: string,
): value is InboxTranslationLanguage {
  return (INBOX_TRANSLATION_LANGUAGES as readonly string[]).includes(value);
}

export function isInboxViewLanguage(value: string): value is InboxViewLanguage {
  return value === "original" || isInboxTranslationLanguage(value);
}

export function inboxLanguageDisplayName(code: InboxViewLanguage): string {
  if (code === "original") return "Original";
  const option = INBOX_TRANSLATION_LANGUAGE_OPTIONS.find(
    (entry) => entry.code === code,
  );
  return option ? option.label : code;
}
