/**
 * Canonical public origin of the AsliJobs website. `https://aslijobs.com`
 * 308-redirects here, so search engine URLs must use this host.
 */
export const DEFAULT_SITE_URL = "https://www.aslijobs.com";

function isNonCanonicalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]" ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".onrender.com") ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)
  );
}

/**
 * Resolves `NEXT_PUBLIC_SITE_URL` to a bare https origin. Localhost, IP,
 * preview (`*.vercel.app`) and malformed values fall back to the production
 * domain so crawlers never receive non-canonical URLs.
 */
export function resolveSiteUrl(rawValue: string | undefined): string {
  const trimmed = rawValue?.trim() ?? "";
  if (!trimmed) {
    return DEFAULT_SITE_URL;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" || isNonCanonicalHost(parsed.hostname)) {
      return DEFAULT_SITE_URL;
    }
    return parsed.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function getSiteUrl(): string {
  return resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}
