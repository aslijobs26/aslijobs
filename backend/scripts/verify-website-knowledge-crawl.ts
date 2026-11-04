/**
 * Live crawl verification against an allowlisted frontend origin.
 *
 * Usage:
 *   npx tsx scripts/verify-website-knowledge-crawl.ts
 *   npx tsx scripts/verify-website-knowledge-crawl.ts --origin https://www.aslijobs.com
 *   npx tsx scripts/verify-website-knowledge-crawl.ts --origin http://localhost:3000 --persist
 */
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { discoverKnowledgePaths } from "../src/modules/website-knowledge/website-knowledge.discover.js";
import {
  buildKnowledgeAllowlist,
  fetchPublicKnowledgePage,
  loadRobotsRules,
} from "../src/modules/website-knowledge/website-knowledge.crawl.js";
import { getLocalizedWebsiteUrl } from "../src/utils/site-language-url.js";
import { syncWebsiteKnowledge } from "../src/modules/website-knowledge/website-knowledge.sync.js";
import { resetWebsiteKnowledgeMemory, getMemoryKnowledgeDocuments } from "../src/modules/website-knowledge/website-knowledge.store.js";

const MIN_CONTENT = 80;

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  const origin = (argValue("--origin") || env.FRONTEND_URL || "https://www.aslijobs.com").replace(/\/+$/, "");
  const persist = process.argv.includes("--persist");
  const maxPages = Number(argValue("--max-pages") || env.WEBSITE_KNOWLEDGE_MAX_PAGES || 25);
  const startedAt = new Date();
  console.log(JSON.stringify({ event: "crawl_verify_start", origin, startedAt: startedAt.toISOString(), maxPages }));

  const discovery = await discoverKnowledgePaths({
    frontendOrigin: origin,
    fetchSitemap: true,
    timeoutMs: env.WEBSITE_KNOWLEDGE_FETCH_TIMEOUT_MS,
  });
  console.log(
    JSON.stringify({
      event: "discovery",
      count: discovery.urls.length,
      sitemapFetched: discovery.sitemapFetched,
      sitemapError: discovery.sitemapError || null,
      paths: discovery.urls.map((u) => ({ path: u.path, source: u.source })),
    }),
  );

  const allowed = buildKnowledgeAllowlist(origin);
  const robots = await loadRobotsRules({
    origin,
    allowed,
    timeoutMs: env.WEBSITE_KNOWLEDGE_FETCH_TIMEOUT_MS,
  });

  const pages = discovery.urls.slice(0, maxPages);
  const results: Array<Record<string, unknown>> = [];
  for (const item of pages) {
    const absoluteUrl = getLocalizedWebsiteUrl(item.path, "en", origin);
    const page = await fetchPublicKnowledgePage({
      absoluteUrl,
      allowed,
      timeoutMs: env.WEBSITE_KNOWLEDGE_FETCH_TIMEOUT_MS,
      maxBytes: env.WEBSITE_KNOWLEDGE_MAX_RESPONSE_BYTES,
      robots,
    });
    const contentLen = page.sections.reduce((n, s) => n + s.content.length, 0) + page.faqs.reduce((n, f) => n + f.answer.length, 0);
    const thin = page.ok && contentLen < MIN_CONTENT;
    results.push({
      path: item.path,
      url: page.url,
      ok: page.ok,
      status: page.status,
      error: page.error || null,
      title: page.title,
      canonicalUrl: page.canonicalUrl || null,
      sections: page.sections.length,
      faqs: page.faqs.length,
      contentChars: contentLen,
      thin,
      sampleHeading: page.sections[0]?.heading || null,
    });
    console.log(
      JSON.stringify({
        event: "page",
        path: item.path,
        ok: page.ok,
        status: page.status,
        error: page.error || null,
        contentChars: contentLen,
        thin,
        title: page.title,
      }),
    );
  }

  resetWebsiteKnowledgeMemory();
  if (persist && env.MONGO_URI) {
    await mongoose.connect(env.MONGO_URI);
  }
  const syncStatus = await syncWebsiteKnowledge({
    frontendOrigin: origin,
    crawlEnabled: true,
    persistMongo: persist && Boolean(env.MONGO_URI),
    timeoutMs: env.WEBSITE_KNOWLEDGE_FETCH_TIMEOUT_MS,
    maxPages,
    maxBytes: env.WEBSITE_KNOWLEDGE_MAX_RESPONSE_BYTES,
    concurrency: env.WEBSITE_KNOWLEDGE_CRAWL_CONCURRENCY,
    maxDurationMs: env.WEBSITE_KNOWLEDGE_MAX_CRAWL_DURATION_MS,
    fetchSitemap: true,
    semanticEnabled: false,
  });
  const docs = getMemoryKnowledgeDocuments();
  const finishedAt = new Date();
  const summary = {
    event: "crawl_verify_summary",
    origin,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    discovered: discovery.urls.length,
    fetched: results.length,
    ok: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    thin: results.filter((r) => r.thin).length,
    sync: syncStatus,
    memoryDocuments: docs.length,
    persist,
    pages: results,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (persist && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (summary.failed === summary.fetched) process.exitCode = 2;
}

main().catch((error) => {
  console.error(JSON.stringify({ event: "crawl_verify_failed", error: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
});
