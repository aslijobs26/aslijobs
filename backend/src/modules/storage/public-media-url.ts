import { env } from "../../config/env.js";

/**
 * Origin that serves public `/uploads` (and API) — PUBLIC_API_URL without `/api/v1`.
 */
export function getPublicMediaOrigin(): string {
  return env.PUBLIC_API_URL.replace(/\/api\/v1\/?$/i, "").replace(/\/+$/, "");
}

/**
 * Turns relative storage paths (`/uploads/...`) into absolute URLs clients can load
 * from any origin (admin on Vercel, frontend on another host).
 * Absolute http(s) URLs (Cloudinary) pass through unchanged.
 */
export function toPublicMediaUrl(
  pathOrUrl: string | null | undefined,
): string {
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

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${getPublicMediaOrigin()}${path}`;
}
