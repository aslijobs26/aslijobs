/**
 * Normalize API base URL to the canonical AsliJobs prefix: `/api/v1`.
 * Prevents production 404s when Render is set to the host only
 * (e.g. https://aslijobs-backend.onrender.com instead of .../api/v1).
 */
export function resolveApiUrl(rawValue: string | undefined): string {
  const fallback = "http://localhost:5000/api/v1";
  const trimmed = rawValue?.trim().replace(/\/+$/, "") ?? "";

  if (!trimmed) {
    return fallback;
  }

  if (trimmed.endsWith("/api/v1")) {
    return trimmed;
  }

  if (trimmed.endsWith("/api")) {
    return `${trimmed}/v1`;
  }

  return `${trimmed}/api/v1`;
}

function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

/**
 * Private IPv4 ranges (and loopback). Used only to detect Next.js Network URLs
 * such as http://192.168.1.20:3000 — never to open production CORS.
 */
export function isPrivateOrLoopbackHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (!host) {
    return false;
  }

  if (isLoopbackHostname(host)) {
    return true;
  }

  if (/^10(?:\.\d{1,3}){3}$/.test(host)) {
    return true;
  }

  if (/^192\.168(?:\.\d{1,3}){2}$/.test(host)) {
    return true;
  }

  if (/^172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/.test(host)) {
    return true;
  }

  return false;
}

/**
 * When the SPA is opened via a LAN IP but NEXT_PUBLIC_API_URL still points at
 * localhost/127.0.0.1, browsers (and other devices on the LAN) cannot reach the
 * API. Remap the API host to the page hostname and keep the configured port/path.
 *
 * Explicit non-loopback API URLs (staging/production) are never rewritten.
 */
export function adaptApiUrlForPageHost(
  apiUrl: string,
  pageHostname: string | null | undefined,
): string {
  const host = pageHostname?.trim() ?? "";
  if (!host || isLoopbackHostname(host) || !isPrivateOrLoopbackHostname(host)) {
    return apiUrl;
  }

  // Same-origin relative base — already LAN-safe.
  if (apiUrl.startsWith("/")) {
    return apiUrl;
  }

  try {
    const parsed = new URL(apiUrl);
    if (!isLoopbackHostname(parsed.hostname)) {
      return apiUrl;
    }

    parsed.hostname = host;
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return apiUrl;
  }
}

function readBrowserHostname(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.location.hostname || null;
}

/** Resolved API base for the current runtime (LAN-safe in the browser). */
export function getApiUrl(): string {
  return adaptApiUrlForPageHost(
    resolveApiUrl(process.env.NEXT_PUBLIC_API_URL),
    readBrowserHostname(),
  );
}

export const env = {
  get apiUrl(): string {
    return getApiUrl();
  },
} as const;
