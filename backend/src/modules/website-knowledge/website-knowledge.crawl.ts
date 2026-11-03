import {
  assertPublicKnowledgeUrl,
  assertResolvedAddressPublic,
  parseAllowedOrigin,
  redirectStaysOnAllowlist,
  type AllowedFetchOrigin,
} from "./website-knowledge.ssrf.js";
import { isPublicKnowledgePath } from "./website-knowledge.catalog.js";
import { extractKnowledgeFromHtml } from "./website-knowledge.html.js";

export type CrawlFetchResult = {
  url: string;
  ok: boolean;
  status: number;
  title: string;
  sections: Array<{ heading: string; content: string }>;
  faqs: Array<{ question: string; answer: string }>;
  error?: string;
};

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;

export function buildKnowledgeAllowlist(frontendOrigin: string): AllowedFetchOrigin[] {
  const primary = parseAllowedOrigin(frontendOrigin);
  const allowed: AllowedFetchOrigin[] = [];
  if (primary) allowed.push(primary);
  // Production sites often alternate www / apex.
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

export async function fetchPublicKnowledgePage(input: {
  absoluteUrl: string;
  allowed: AllowedFetchOrigin[];
  timeoutMs?: number;
  maxBytes?: number;
  fetchImpl?: typeof fetch;
}): Promise<CrawlFetchResult> {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = input.maxBytes ?? DEFAULT_MAX_BYTES;
  const fetchImpl = input.fetchImpl ?? fetch;
  let current = assertPublicKnowledgeUrl(input.absoluteUrl, input.allowed);
  if (!isPublicKnowledgePath(current.pathname + current.search)) {
    return {
      url: current.toString(),
      ok: false,
      status: 0,
      title: "",
      sections: [],
      faqs: [],
      error: "path_not_allowlisted",
    };
  }

  try {
    await assertResolvedAddressPublic(current.hostname, input.allowed);
  } catch (error) {
    return {
      url: current.toString(),
      ok: false,
      status: 0,
      title: "",
      sections: [],
      faqs: [],
      error: error instanceof Error ? error.message : "dns_blocked",
    };
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
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
        if (!isPublicKnowledgePath(current.pathname + current.search)) {
          return emptyFail(current.toString(), response.status, "redirect_path_forbidden");
        }
        await assertResolvedAddressPublic(current.hostname, input.allowed);
        continue;
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
      const extracted = extractKnowledgeFromHtml(buffer.toString("utf8"));
      return {
        url: current.toString(),
        ok: true,
        status: response.status,
        title: extracted.title,
        sections: extracted.sections,
        faqs: extracted.faqs,
      };
    } catch (error) {
      return emptyFail(
        current.toString(),
        0,
        error instanceof Error ? error.message : "fetch_failed",
      );
    } finally {
      clearTimeout(timer);
    }
  }
  return emptyFail(current.toString(), 0, "too_many_redirects");
}

function emptyFail(url: string, status: number, error: string): CrawlFetchResult {
  return { url, ok: false, status, title: "", sections: [], faqs: [], error };
}
