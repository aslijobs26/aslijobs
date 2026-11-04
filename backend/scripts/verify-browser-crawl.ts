/**
 * Verify Playwright browser fallback on thin CSR resources pages.
 *
 * Usage:
 *   npx tsx scripts/verify-browser-crawl.ts
 *   npx tsx scripts/verify-browser-crawl.ts --origin https://www.aslijobs.com
 *
 * Requires: npm i -D playwright && npx playwright install chromium
 */
import { env } from "../src/config/env.js";
import {
  buildKnowledgeAllowlist,
  fetchPublicKnowledgePage,
  loadRobotsRules,
} from "../src/modules/website-knowledge/website-knowledge.crawl.js";
import {
  classifyContentQuality,
  extractWithOptionalBrowser,
} from "../src/modules/website-knowledge/website-knowledge.browser.js";
import { getLocalizedWebsiteUrl } from "../src/utils/site-language-url.js";

const PATHS = ["/resources", "/resources?page=sitemap"];

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  const origin = (argValue("--origin") || env.FRONTEND_URL || "https://www.aslijobs.com").replace(
    /\/+$/,
    "",
  );
  const allowed = buildKnowledgeAllowlist(origin);
  const robots = await loadRobotsRules({
    origin,
    allowed,
    timeoutMs: env.WEBSITE_KNOWLEDGE_FETCH_TIMEOUT_MS,
  });

  const rows = [];
  for (const path of PATHS) {
    const absoluteUrl = getLocalizedWebsiteUrl(path, "en", origin);
    const started = Date.now();
    const ssr = await fetchPublicKnowledgePage({
      absoluteUrl,
      allowed,
      timeoutMs: env.WEBSITE_KNOWLEDGE_FETCH_TIMEOUT_MS,
      maxBytes: env.WEBSITE_KNOWLEDGE_MAX_RESPONSE_BYTES,
      robots,
    });
    const ssrChars =
      ssr.sections.reduce((n, s) => n + s.content.length, 0)
      + ssr.faqs.reduce((n, f) => n + f.answer.length, 0);
    const browser = await extractWithOptionalBrowser({
      absoluteUrl,
      allowed,
      enabled: true,
      path,
      ssrContentChars: ssrChars,
      timeoutMs: 25_000,
    });
    const browserChars = browser.extracted
      ? browser.extracted.sections.reduce((n, s) => n + s.content.length, 0)
        + browser.extracted.faqs.reduce((n, f) => n + f.answer.length, 0)
        + (browser.extracted.plainText?.length || 0)
      : 0;
    rows.push({
      path,
      url: absoluteUrl,
      httpStatus: ssr.status,
      ssrOk: ssr.ok,
      ssrChars,
      ssrQuality: classifyContentQuality(ssrChars),
      browserUsed: browser.usedBrowser,
      browserError: browser.error || null,
      browserChars,
      browserQuality: browser.quality || classifyContentQuality(browserChars),
      headings: (browser.extracted?.sections || ssr.sections).slice(0, 8).map((s) => s.heading),
      links: (browser.extracted?.links || ssr.links || []).slice(0, 20),
      linkCount: (browser.extracted?.links || ssr.links || []).length,
      consoleErrors: browser.consoleErrors || [],
      durationMs: Date.now() - started,
      browserDurationMs: browser.durationMs || null,
    });
  }

  console.log(JSON.stringify({ event: "browser_crawl_verify", origin, rows }, null, 2));
  const failed = rows.filter((r) => r.browserUsed && r.browserError && !r.browserChars);
  if (failed.length === rows.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ event: "browser_crawl_crash", error: String(error) }));
  process.exitCode = 1;
});
