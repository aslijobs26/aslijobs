import {
  assertPublicKnowledgeUrl,
  assertResolvedAddressPublic,
  parseAllowedOrigin,
  redirectStaysOnAllowlist,
  type AllowedFetchOrigin,
} from "./website-knowledge.ssrf.js";
import { isCrawlablePublicPath, normalizeKnowledgePath } from "./website-knowledge.discover.js";
import { extractKnowledgeFromHtml } from "./website-knowledge.html.js";

export type CrawlFetchResult = {
  url: string;
  ok: boolean;
  status: number;
  title: string;
  description: string;
  canonicalUrl: string;
  language: string;
  sections: Array<{ heading: string; content: string }>;
  faqs: Array<{ question: string; answer: string }>;
  plainText: string;
  links: string[];
  error?: string;
};

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;

export function buildKnowledgeAllowlist(frontendOrigin: string): AllowedFetchOrigin[] {
  const primary = parseAllowedOrigin(frontendOrigin);
  const allowed: AllowedFetchOrigin[] = [];
  if (primary) allowed.push(primary);
  if (primary && !primary.hostname.startsWith("www.")) {
    const www = parseAllowedOrigin(
      `${primary.protocol}//www.${primary.hostname}${primary.port ? `:${primary.port}` : ""}`,
    );
    if (www) allowed.push(www);
  }
  if (primary?.hostname.startsWith("www.")) {
    const apexHost = primary.hostname.slice(4);
    const apex = parseAllowedOrigin(
      `${primary.protocol}//${apexHost}${primary.port ? `:${primary.port}` : ""}`,
    );
    if (apex) allowed.push(apex);
  }
  return allowed;
}

type RobotsRules = { disallow: string[]; allowAll: boolean };

const robotsCache = new Map<string, { at: number; rules: RobotsRules }>();

export function clearKnowledgeRobotsCache(): void {
  robotsCache.clear();
}

export async function loadRobotsRules(input: {
  origin: string;
  allowed: AllowedFetchOrigin[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<RobotsRules> {
  const origin = input.origin.replace(/\/+$/, "");
  const cached = robotsCache.get(origin);
  if (cached && Date.now() - cached.at < 60 * 60_000) return cached.rules;
  const fetchImpl = input.fetchImpl ?? fetch;
  const rules: RobotsRules = { disallow: [], allowAll: true };
  try {
    const robotsUrl = assertPublicKnowledgeUrl(`${origin}/robots.txt`, input.allowed).toString();
    await assertResolvedAddressPublic(new URL(robotsUrl).hostname, input.allowed);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const response = await fetchImpl(robotsUrl, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: { Accept: "text/plain,*/*", "User-Agent": "AsliJobsKnowledgeBot/1.0" },
    });
    clearTimeout(timer);
    if (!response.ok) {
      robotsCache.set(origin, { at: Date.now(), rules });
      return rules;
    }
    const text = await response.text();
    const lines = text.split(/\r?\n/);
    let inStar = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [rawKey, ...rest] = trimmed.split(":");
      const key = (rawKey || "").trim().toLowerCase();
      const value = rest.join(":").trim();
      if (key === "user-agent") {
        inStar = value === "*";
        continue;
      }
      if (!inStar) continue;
      if (key === "disallow" && value) {
        rules.disallow.push(value);
        rules.allowAll = false;
      }
    }
  } catch {
    // Fail open to allowlisted catalog paths when robots unavailable.
  }
  robotsCache.set(origin, { at: Date.now(), rules });
  return rules;
}

export function robotsAllowsPath(rules: RobotsRules, path: string): boolean {
  if (rules.allowAll || rules.disallow.length === 0) return true;
  const bare = (path.split("?")[0] || "/");
  for (const rule of rules.disallow) {
    if (rule === "/") return false;
    if (bare === rule) return false;
    // Prefix match only on path segment boundaries (/employer/…, not /employer-guide).
    if (rule.endsWith("/") && bare.startsWith(rule)) return false;
    if (!rule.endsWith("/") && bare.startsWith(`${rule}/`)) return false;
  }
  return true;
}

export async function fetchPublicKnowledgePage(input: {
  absoluteUrl: string;
  allowed: AllowedFetchOrigin[];
  timeoutMs?: number;
  maxBytes?: number;
  fetchImpl?: typeof fetch;
  robots?: RobotsRules;
  signal?: AbortSignal;
}): Promise<CrawlFetchResult> {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = input.maxBytes ?? DEFAULT_MAX_BYTES;
  const fetchImpl = input.fetchImpl ?? fetch;
  let current = assertPublicKnowledgeUrl(input.absoluteUrl, input.allowed);
  const pathWithSearch = normalizeKnowledgePath(current.pathname + current.search);
  if (!isCrawlablePublicPath(pathWithSearch)) {
    return emptyFail(current.toString(), 0, "path_not_allowlisted");
  }
  if (input.robots && !robotsAllowsPath(input.robots, pathWithSearch)) {
    return emptyFail(current.toString(), 0, "robots_disallow");
  }

  try {
    await assertResolvedAddressPublic(current.hostname, input.allowed);
  } catch (error) {
    return emptyFail(
      current.toString(),
      0,
      error instanceof Error ? error.message : "dns_blocked",
    );
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (input.signal?.aborted) return emptyFail(current.toString(), 0, "cancelled");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    input.signal?.addEventListener("abort", onAbort, { once: true });
    try {
      const response = await fetchImpl(current.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "AsliJobsKnowledgeBot/1.0 (+https://aslijobs.com)",
        },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          return emptyFail(current.toString(), response.status, "redirect_missing_location");
        }
        current = redirectStaysOnAllowlist(current, location, input.allowed);
        const nextPath = normalizeKnowledgePath(current.pathname + current.search);
        if (!isCrawlablePublicPath(nextPath)) {
          return emptyFail(current.toString(), response.status, "redirect_path_forbidden");
        }
        if (input.robots && !robotsAllowsPath(input.robots, nextPath)) {
          return emptyFail(current.toString(), response.status, "robots_disallow");
        }
        await assertResolvedAddressPublic(current.hostname, input.allowed);
        continue;
      }
      if (response.status === 429) {
        return emptyFail(current.toString(), response.status, "http_429");
      }
      if (!response.ok) {
        return emptyFail(current.toString(), response.status, `http_${response.status}`);
      }
      const contentType = response.headers.get("content-type") || "";
      if (!/text\/html|application\/xhtml\+xml/i.test(contentType) && contentType) {
        return emptyFail(current.toString(), response.status, "unsupported_content_type");
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > maxBytes) {
        return emptyFail(current.toString(), response.status, "response_too_large");
      }
      if (buffer.byteLength === 0) {
        return emptyFail(current.toString(), response.status, "empty_response");
      }
      const extracted = extractKnowledgeFromHtml(buffer.toString("utf8"), {
        pageUrl: current.toString(),
      });
      return {
        url: current.toString(),
        ok: true,
        status: response.status,
        title: extracted.title,
        description: extracted.description,
        canonicalUrl: extracted.canonicalUrl || current.toString(),
        language: extracted.language,
        sections: extracted.sections,
        faqs: extracted.faqs,
        plainText: extracted.plainText,
        links: extracted.links,
      };
    } catch (error) {
      return emptyFail(
        current.toString(),
        0,
        error instanceof Error ? error.message : "fetch_failed",
      );
    } finally {
      clearTimeout(timer);
      input.signal?.removeEventListener("abort", onAbort);
    }
  }
  return emptyFail(current.toString(), 0, "too_many_redirects");
}

function emptyFail(url: string, status: number, error: string): CrawlFetchResult {
  return {
    url,
    ok: false,
    status,
    title: "",
    description: "",
    canonicalUrl: "",
    language: "",
    sections: [],
    faqs: [],
    plainText: "",
    links: [],
    error,
  };
}

/** Simple concurrency pool for crawl batches. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  signal?: AbortSignal,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (true) {
      if (signal?.aborted) return;
      const index = next;
      next += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index]!, index);
    }
  });
  await Promise.all(runners);
  return results;
}
