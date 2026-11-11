/** CDN-cached for an hour, then served stale while a fresh copy is built. */
const FRESH_CACHE_CONTROL =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

/** Partial sitemap after a backend failure: retry soon instead of pinning it. */
const DEGRADED_CACHE_CONTROL = "public, max-age=0, s-maxage=300";

const RETRY_AFTER_SECONDS = "600";

export function sitemapXmlResponse(
  xml: string,
  options: { degraded?: boolean } = {},
): Response {
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": options.degraded
        ? DEGRADED_CACHE_CONTROL
        : FRESH_CACHE_CONTROL,
    },
  });
}

/** Crawlers retry a 503 later without dropping previously known URLs. */
export function sitemapUnavailableResponse(): Response {
  return new Response("Sitemap temporarily unavailable", {
    status: 503,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Retry-After": RETRY_AFTER_SECONDS,
    },
  });
}

export function sitemapNotFoundResponse(): Response {
  return new Response("Not found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}

export function logSitemapFailure(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[sitemap] ${context}: ${message}`);
}
