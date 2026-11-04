import {
  CRAWL_SKIP_PATH_PREFIXES,
  OFFICIAL_KNOWLEDGE_PAGES,
  isPublicKnowledgePath,
} from "./website-knowledge.catalog.js";
import type { KnowledgeDiscoverySource } from "./website-knowledge.types.js";

/**
 * Seeds mirrored from frontend `constants/footer-navigation.ts` + public ROUTES.
 * Discovery merges these with the catalog and optional live sitemap — not a live
 * DOM scrape of the footer, but the same official path set the website publishes.
 */
export const FOOTER_PUBLIC_PATHS: readonly string[] = [
  "/find-jobs",
  "/browse-by-city",
  "/browse-by-state",
  "/job-categories",
  "/job-seeker-guide",
  "/post-a-job",
  "/employer-login-info",
  "/pricing-plans",
  "/employer-guide",
  "/resources?resource=faqs",
  "/terms-and-conditions",
  "/privacy-policy",
  "/guidelines",
  "/resources?page=sitemap",
  "/resources?resource=help-center",
  "/contact",
  "/faqs",
  "/help-center",
];

/** Public informational routes from frontend `constants/routes.ts` (non-auth). */
export const ROUTE_MANIFEST_PUBLIC_PATHS: readonly string[] = [
  "/",
  "/find-jobs",
  "/browse-by-city",
  "/browse-by-state",
  "/job-categories",
  "/job-seeker-guide",
  "/interview-tips",
  "/salary-guide",
  "/career-advice",
  "/post-a-job",
  "/employer-login-info",
  "/pricing-plans",
  "/employer-guide",
  "/resources",
  "/faqs",
  "/help-center",
  "/terms-and-conditions",
  "/privacy-policy",
  "/guidelines",
  "/contact",
];

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "ref",
  "mc_cid",
  "mc_eid",
]);

const KEEP_QUERY_KEYS = new Set(["resource", "page", "lang"]);

export type DiscoveredKnowledgeUrl = {
  path: string;
  canonicalPath: string;
  source: KnowledgeDiscoverySource;
};

export function normalizeKnowledgePath(rawPath: string): string {
  let pathname = "/";
  let search = "";
  try {
    if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
      const url = new URL(rawPath);
      pathname = url.pathname || "/";
      search = url.search;
    } else {
      const url = new URL(rawPath, "https://aslijobs.local");
      pathname = url.pathname || "/";
      search = url.search;
    }
  } catch {
    pathname = rawPath.split("?")[0] || "/";
    search = rawPath.includes("?") ? `?${rawPath.split("?").slice(1).join("?")}` : "";
  }

  pathname = pathname.replace(/\/{2,}/g, "/");
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  const params = new URLSearchParams(search);
  const kept = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    const lower = key.toLowerCase();
    if (TRACKING_PARAMS.has(lower)) continue;
    if (!KEEP_QUERY_KEYS.has(lower)) continue;
    kept.set(lower, value);
  }
  const query = kept.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function isExcludedDiscoveryPath(path: string): boolean {
  const normalized = normalizeKnowledgePath(path);
  const bare = normalized.split("?")[0] || "/";
  if (
    bare === "/employer/login" ||
    bare === "/employer/register" ||
    bare === "/job-seeker/login" ||
    bare === "/job-seeker/register" ||
    bare === "/post-job" ||
    bare.startsWith("/post-job/") ||
    bare.startsWith("/api/") ||
    bare.startsWith("/uploads/")
  ) {
    return true;
  }
  if (CRAWL_SKIP_PATH_PREFIXES.some((prefix) => bare === prefix || bare.startsWith(prefix))) {
    return true;
  }
  return false;
}

export function isCrawlablePublicPath(path: string): boolean {
  const normalized = normalizeKnowledgePath(path);
  if (isExcludedDiscoveryPath(normalized)) return false;
  if (isPublicKnowledgePath(normalized)) return true;
  const bare = normalized.split("?")[0] || "/";
  if (FOOTER_PUBLIC_PATHS.some((p) => normalizeKnowledgePath(p) === normalized || (p.split("?")[0] || p) === bare)) {
    return true;
  }
  if (ROUTE_MANIFEST_PUBLIC_PATHS.includes(bare)) return true;
  return OFFICIAL_KNOWLEDGE_PAGES.some(
    (p) => normalizeKnowledgePath(p.path) === normalized || (p.path.split("?")[0] || p.path) === bare,
  );
}

function pushUnique(
  map: Map<string, DiscoveredKnowledgeUrl>,
  path: string,
  source: KnowledgeDiscoverySource,
): void {
  const normalized = normalizeKnowledgePath(path);
  if (!normalized || isExcludedDiscoveryPath(normalized)) return;
  if (!isCrawlablePublicPath(normalized)) return;
  if (map.has(normalized)) return;
  map.set(normalized, {
    path: normalized,
    canonicalPath: normalized.split("?")[0] || "/",
    source,
  });
}

export function discoverKnowledgePathsFromSeeds(): DiscoveredKnowledgeUrl[] {
  const map = new Map<string, DiscoveredKnowledgeUrl>();
  for (const page of OFFICIAL_KNOWLEDGE_PAGES) {
    pushUnique(map, page.path, "catalog");
  }
  for (const path of FOOTER_PUBLIC_PATHS) {
    pushUnique(map, path, "footer");
  }
  for (const path of ROUTE_MANIFEST_PUBLIC_PATHS) {
    pushUnique(map, path, "route_manifest");
  }
  return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
}

/** Parse loc entries from a sitemap XML document. */
export function parseSitemapLocs(xml: string, allowedHostnames: Set<string>): string[] {
  const locs: string[] = [];
  const regex = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) != null) {
    const raw = (match[1] || "").trim();
    if (!raw) continue;
    try {
      const url = new URL(raw);
      if (!allowedHostnames.has(url.hostname.toLowerCase())) continue;
      locs.push(normalizeKnowledgePath(`${url.pathname}${url.search}`));
    } catch {
      // ignore malformed
    }
  }
  return locs;
}

export async function discoverKnowledgePaths(input: {
  frontendOrigin: string;
  fetchSitemap?: boolean;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<{
  urls: DiscoveredKnowledgeUrl[];
  sitemapFetched: boolean;
  sitemapError?: string;
}> {
  const map = new Map<string, DiscoveredKnowledgeUrl>();
  for (const item of discoverKnowledgePathsFromSeeds()) {
    map.set(item.path, item);
  }

  let sitemapFetched = false;
  let sitemapError: string | undefined;
  if (input.fetchSitemap) {
    const origin = input.frontendOrigin.replace(/\/+$/, "");
    const candidates = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`];
    const allowedHosts = new Set<string>();
    try {
      allowedHosts.add(new URL(origin).hostname.toLowerCase());
    } catch {
      allowedHosts.add("aslijobs.com");
    }
    if (![...allowedHosts][0]?.startsWith("www.")) {
      allowedHosts.add(`www.${[...allowedHosts][0]}`);
    }
    const fetchImpl = input.fetchImpl ?? fetch;
    for (const sitemapUrl of candidates) {
      if (input.signal?.aborted) break;
      try {
        if (input.signal?.aborted) break;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 8_000);
        const onAbort = () => controller.abort();
        input.signal?.addEventListener("abort", onAbort, { once: true });
        const response = await fetchImpl(sitemapUrl, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
          headers: { Accept: "application/xml,text/xml,*/*", "User-Agent": "AsliJobsKnowledgeBot/1.0" },
        });
        clearTimeout(timer);
        if (!response.ok) {
          sitemapError = `http_${response.status}`;
          continue;
        }
        const contentType = response.headers.get("content-type") || "";
        if (contentType && !/xml|text\/plain/i.test(contentType)) {
          sitemapError = "unsupported_sitemap_type";
          continue;
        }
        const xml = await response.text();
        const locs = parseSitemapLocs(xml, allowedHosts);
        sitemapFetched = true;
        for (const loc of locs) {
          if (isExcludedDiscoveryPath(loc)) continue;
          if (!isCrawlablePublicPath(loc)) continue;
          if (!map.has(loc)) {
            map.set(loc, { path: loc, canonicalPath: loc.split("?")[0] || "/", source: "sitemap" });
          }
        }
        break;
      } catch (error) {
        sitemapError = error instanceof Error ? error.message : "sitemap_fetch_failed";
      }
    }
  }

  return {
    urls: [...map.values()].sort((a, b) => a.path.localeCompare(b.path)),
    sitemapFetched,
    sitemapError,
  };
}
