import { resolveApiUrl } from "@/constants/env";
import {
  JOBS_PER_SITEMAP,
  parseSitemapJobsResponse,
  type SitemapJobsPage,
} from "@/utils/sitemap/sitemap-entries";

/** Jobs that go live or leave the public site show up within this window. */
export const SITEMAP_REVALIDATE_SECONDS = 3600;

const SITEMAP_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Server-only: one page of publicly visible jobs (active + verified employer).
 * Only successful responses enter the Next.js data cache, so a failed request
 * is retried on the next sitemap hit.
 */
export async function fetchSitemapJobsPage(
  page: number,
): Promise<SitemapJobsPage> {
  const apiUrl = resolveApiUrl(process.env.NEXT_PUBLIC_API_URL);
  const query = new URLSearchParams({
    page: String(page),
    limit: String(JOBS_PER_SITEMAP),
  });

  const response = await fetch(`${apiUrl}/jobs/public/sitemap?${query}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: SITEMAP_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(SITEMAP_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Public job sitemap request failed with ${response.status}`);
  }

  return parseSitemapJobsResponse(await response.json());
}
