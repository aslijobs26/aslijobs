/**
 * Admin/ops CLI: refresh AsliJobs website knowledge from the official corpus
 * (and optionally crawl FRONTEND_URL when crawl is enabled).
 *
 * Usage:
 *   npx tsx scripts/sync-website-knowledge.ts
 *   npx tsx scripts/sync-website-knowledge.ts --crawl
 *   npx tsx scripts/sync-website-knowledge.ts --memory-only
 *   npx tsx scripts/sync-website-knowledge.ts --crawl --semantic
 */
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { syncWebsiteKnowledge } from "../src/modules/website-knowledge/website-knowledge.sync.js";

async function main() {
  const crawl = process.argv.includes("--crawl") || env.WEBSITE_KNOWLEDGE_CRAWL_ENABLED;
  const semantic =
    process.argv.includes("--semantic") || env.WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED;
  const memoryOnly = process.argv.includes("--memory-only");
  if (!memoryOnly) {
    if (!env.MONGO_URI) {
      throw new Error("MONGO_URI is required unless --memory-only is set");
    }
    await mongoose.connect(env.MONGO_URI);
  }
  try {
    const status = await syncWebsiteKnowledge({
      frontendOrigin: env.FRONTEND_URL,
      crawlEnabled: crawl,
      persistMongo: !memoryOnly,
      timeoutMs: env.WEBSITE_KNOWLEDGE_FETCH_TIMEOUT_MS,
      maxPages: env.WEBSITE_KNOWLEDGE_MAX_PAGES,
      maxBytes: env.WEBSITE_KNOWLEDGE_MAX_RESPONSE_BYTES,
      concurrency: env.WEBSITE_KNOWLEDGE_CRAWL_CONCURRENCY,
      maxDurationMs: env.WEBSITE_KNOWLEDGE_MAX_CRAWL_DURATION_MS,
      fetchSitemap: true,
      semanticEnabled: semantic,
      embeddingProvider: env.WEBSITE_KNOWLEDGE_EMBEDDING_PROVIDER,
    });
    console.log(JSON.stringify(status, null, 2));
  } finally {
    if (!memoryOnly && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
