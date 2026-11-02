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

const NON_WEBSITE_HOST =
  /(^|\.)((graph\.)?facebook\.com|api\.sarvam\.ai|api\.openai\.com)$/i;

/**
 * Website path plus the conversation language.
 * The public site reads `?lang=` (en, hi, te, ta, kn, ml). There is no
 * `/te/post-job` route. Unknown languages fall back to English.
 * API and webhook hosts are returned unchanged.
 */
export function getLocalizedWebsiteUrl(
  path: string,
  language?: string | null,
  origin?: string | null,
): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      if (NON_WEBSITE_HOST.test(new URL(trimmed).hostname)) return trimmed;
    } catch {
      return trimmed;
    }
    return appendSiteLanguageQuery(trimmed, language);
  }
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const base = (origin ?? "").trim().replace(/\/+$/, "");
  if (!base) {
    const localized = appendSiteLanguageQuery(
      `https://aslijobs.local${normalizedPath}`,
      language,
    );
    return localized.replace(/^https:\/\/aslijobs\.local/i, "");
  }
  return appendSiteLanguageQuery(`${base}${normalizedPath}`, language);
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
