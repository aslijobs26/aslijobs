/**
 * Normalize API base URL to the canonical AsliJobs prefix: `/api/v1`.
 * Prevents production 404s when Render is set to the host only
 * (e.g. https://aslijobs-backend.onrender.com instead of .../api/v1).
 */
function resolveApiUrl(rawValue: string | undefined): string {
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

export const env = {
  apiUrl: resolveApiUrl(process.env.NEXT_PUBLIC_API_URL),
} as const;
