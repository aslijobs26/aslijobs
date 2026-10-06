export type SiteLanguageCode = "en" | "hi" | "te" | "ta" | "kn" | "ml";

export type SiteLanguageOption = {
  value: string;
  code: SiteLanguageCode;
  label: string;
};

export const SITE_LANGUAGE_OPTIONS: readonly SiteLanguageOption[] = [
  { value: "english", code: "en", label: "English" },
  { value: "telugu", code: "te", label: "తెలుగు" },
  { value: "hindi", code: "hi", label: "हिंदी" },
  { value: "tamil", code: "ta", label: "தமிழ்" },
  { value: "kannada", code: "kn", label: "ಕನ್ನಡ" },
  { value: "malayalam", code: "ml", label: "മലയാളം" },
] as const;

export const SITE_DEFAULT_LANGUAGE = SITE_LANGUAGE_OPTIONS[0];

export const SITE_LANGUAGE_STORAGE_KEY = "aslijobs_site_language";
export const SITE_LANGUAGE_CHANGE_EVENT = "aslijobs-site-language-change";

export function siteLanguageFromValue(value: string | null | undefined): SiteLanguageOption {
  if (value == null || value.trim() === "") {
    return SITE_DEFAULT_LANGUAGE;
  }

  const normalized = value.trim().toLowerCase();
  return (
    SITE_LANGUAGE_OPTIONS.find(
      (option) => option.value === normalized || option.code === normalized,
    ) ?? SITE_DEFAULT_LANGUAGE
  );
}

/** Query keys and API params must use `te`, never aliases such as `telugu`. */
export function normalizeSiteLanguageCode(
  value: string | null | undefined,
): SiteLanguageCode {
  return siteLanguageFromValue(value).code;
}
