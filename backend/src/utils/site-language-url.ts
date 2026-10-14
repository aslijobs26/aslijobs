import { parseJobContentLanguage } from "../modules/jobs/job-content-language.js";

/** Query key for job-seeker website locale. Validated codes only. */
export const SITE_LANGUAGE_QUERY_PARAM = "lang";

const SUPPORTED_CODES = new Set(["en", "hi", "te", "ta", "kn", "ml"]);

export function parseSiteLanguageQuery(
  value: string | null | undefined,
): string | null {
  const parsed = parseJobContentLanguage(value);
  if (!parsed || !SUPPORTED_CODES.has(parsed)) {
    return null;
  }
  return parsed;
}

/**
 * Adds or replaces `lang` on a same-origin website URL.
 * Invalid or empty language falls back to English. Leaves the URL unchanged
 * when it cannot be parsed. Does not add buttons to WhatsApp templates.
 */
export function appendSiteLanguageQuery(
  url: string,
  language?: string | null,
): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  const code = parseSiteLanguageQuery(language) ?? "en";

  try {
    const parsed = new URL(trimmed);
    parsed.searchParams.set(SITE_LANGUAGE_QUERY_PARAM, code);
    return parsed.toString();
  } catch {
    return trimmed;
  }
}
