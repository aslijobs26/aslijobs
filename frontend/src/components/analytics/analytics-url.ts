/**
 * Query parameters Google Analytics may see. Everything else is dropped,
 * including invitation tokens, application ids and selected candidates.
 */
const KEPT_QUERY_PARAMS = new Set([
  "q",
  "search",
  "within",
  "state",
  "city",
  "jobType",
  "experience",
  "workMode",
  "minSalary",
  "maxSalary",
  "sort",
  "page",
  "job",
  "tab",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
]);

const FREE_TEXT_PARAMS = new Set(["q", "search", "within"]);

/** Database ids of candidates, applications, employers and team members. */
const OPAQUE_ID_SEGMENT =
  /^(?:[a-f0-9]{24}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i;

/**
 * Data a URL must not carry when the Google tag reads it unfiltered: database
 * ids, invitation tokens, application ids, email addresses and phone numbers,
 * also when nested in a return URL.
 */
const PRIVATE_URL_DATA = [
  /[a-f0-9]{24}/i,
  /[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}/i,
  /[?&](?:token|application|applicationId|selected)=/i,
  /@/,
  /\d{10,}/,
];

export function hasPrivateUrlData(href: string): boolean {
  let url: URL;
  let decoded: string;
  try {
    url = new URL(href);
    decoded = decodeURIComponent(`${url.pathname}${url.search}`);
  } catch {
    return true;
  }
  return (
    PRIVATE_URL_DATA.some((pattern) => pattern.test(decoded)) ||
    [...FREE_TEXT_PARAMS].some((key) => {
      const value = url.searchParams.get(key);
      return value !== null && !isSafeFreeText(value);
    })
  );
}

/** False for typed text that looks like a phone number or an email address. */
export function isSafeFreeText(value: string): boolean {
  const digits = value.match(/\d/g)?.length ?? 0;
  return !value.includes("@") && digits < 6;
}

/** The URL without its hash, private query parameters or database ids. */
export function sanitizeAnalyticsUrl(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const path = url.pathname
    .split("/")
    .map((segment) => (OPAQUE_ID_SEGMENT.test(segment) ? ":id" : segment))
    .join("/");
  const query = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (
      KEPT_QUERY_PARAMS.has(key) &&
      (!FREE_TEXT_PARAMS.has(key) || isSafeFreeText(value))
    ) {
      query.append(key, value);
    }
  }
  const search = query.toString();
  return `${url.origin}${path}${search ? `?${search}` : ""}`;
}

/** Same-site referrers are sanitized; other sites keep only their origin. */
export function sanitizeAnalyticsReferrer(
  referrer: string,
  origin: string,
): string {
  if (!referrer) {
    return "";
  }
  try {
    const url = new URL(referrer);
    return url.origin === origin
      ? (sanitizeAnalyticsUrl(referrer) ?? "")
      : `${url.origin}/`;
  } catch {
    return "";
  }
}
