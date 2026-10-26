import { env } from "@/constants/env";

/**
 * Resolves backend-relative media URLs (e.g. /uploads/...) to absolute URLs
 * against the API host. Absolute Cloudinary URLs pass through unchanged.
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

  const apiOrigin = env.apiUrl.replace(/\/api\/v1\/?$/i, "").replace(/\/+$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${apiOrigin}${path}`;
}
