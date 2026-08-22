import { env } from "../constants/env";

const DEFAULT_DEV_BACKEND_ORIGIN = "http://localhost:5000";

function resolveMediaOrigin(): string {
  const apiUrl = env.apiUrl.trim();

  if (/^https?:\/\//i.test(apiUrl)) {
    return apiUrl.replace(/\/api\/v1\/?$/, "");
  }

  if (import.meta.env.DEV) {
    const configuredOrigin = import.meta.env.VITE_BACKEND_ORIGIN?.trim();
    if (configuredOrigin) {
      return configuredOrigin.replace(/\/+$/, "");
    }

    // Relative `/api/v1` in dev: `/uploads` is proxied by Vite to the backend.
    return "";
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return DEFAULT_DEV_BACKEND_ORIGIN;
}

/**
 * Resolves backend-relative media URLs (e.g. /uploads/...) to absolute URLs
 * against the API host (uploads are served outside /api/v1).
 */
export function resolveMediaUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) {
    return "";
  }

  const trimmed = pathOrUrl.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const origin = resolveMediaOrigin();
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${origin}${path}`;
}
