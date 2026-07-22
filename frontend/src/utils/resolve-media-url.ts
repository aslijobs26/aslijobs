import { env } from "@/constants/env";

/**
 * Resolves backend-relative media URLs (e.g. /uploads/...) to absolute URLs.
 */
export function resolveMediaUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const apiOrigin = env.apiUrl.replace(/\/api\/v1\/?$/, "");
  return `${apiOrigin}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}
