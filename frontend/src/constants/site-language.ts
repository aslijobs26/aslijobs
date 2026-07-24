export type SiteLanguageOption = {
  value: string;
  label: string;
};

export const SITE_LANGUAGE_OPTIONS: readonly SiteLanguageOption[] = [
  { value: "english", label: "English" },
  { value: "telugu", label: "తెలుగు" },
  { value: "hindi", label: "हिंदी" },
  { value: "tamil", label: "தமிழ்" },
  { value: "kannada", label: "ಕನ್ನಡ" },
  { value: "malayalam", label: "മലയാളം" },
] as const;

export const SITE_DEFAULT_LANGUAGE = SITE_LANGUAGE_OPTIONS[0];
