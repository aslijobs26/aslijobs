import { env } from "../constants/env";

const DEFAULT_DEV_BACKEND_ORIGIN = "http://127.0.0.1:5000";

/**
 * Origin that serves public `/uploads` (outside `/api/v1`).
 * Never use the Admin SPA origin — on Vercel that returns index.html for
 * `/uploads/*` and breaks every employer logo.
 */
function resolveMediaOrigin(): string {
  const apiUrl = env.apiUrl.trim();

  if (/^https?:\/\//i.test(apiUrl)) {
    return apiUrl.replace(/\/api\/v1\/?$/i, "").replace(/\/+$/, "");
  }

  const configuredOrigin = import.meta.env.VITE_BACKEND_ORIGIN?.trim();
  if (configuredOrigin && /^https?:\/\//i.test(configuredOrigin)) {
    return configuredOrigin.replace(/\/+$/, "");
  }

  if (import.meta.env.DEV) {
    // Prefer hitting the API host directly so <img> does not depend on the
    // Vite proxy alone (still proxied for same-origin /uploads requests).
    return DEFAULT_DEV_BACKEND_ORIGIN;
  }

  // Production with relative VITE_API_URL: rely on vercel.json /uploads rewrite
  // to the Render API. Same-origin relative paths are intentional here.
  return "";
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

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  const origin = resolveMediaOrigin();
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${origin}${path}`;
}
