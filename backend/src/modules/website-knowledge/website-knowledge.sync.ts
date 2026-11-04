import { createHash } from "node:crypto";
import { getLocalizedWebsiteUrl } from "../../utils/site-language-url.js";
import { OFFICIAL_KNOWLEDGE_PAGES } from "./website-knowledge.catalog.js";
import { CORPUS_FAQS, CORPUS_SECTIONS } from "./website-knowledge.corpus.js";
import {
  buildKnowledgeAllowlist,
  fetchPublicKnowledgePage,
  loadRobotsRules,
  mapWithConcurrency,
} from "./website-knowledge.crawl.js";
import { discoverKnowledgePaths } from "./website-knowledge.discover.js";
import {
  embedKnowledgeText,
  HASH_EMBEDDING_MODEL,
  HASH_EMBEDDING_VERSION,
} from "./website-knowledge.embeddings.js";
import { bumpKnowledgeMetric } from "./website-knowledge.metrics.js";
import { mergePolicySectionsIntoCorpus } from "./website-knowledge.policy.js";
import { extractWithOptionalBrowser } from "./website-knowledge.browser.js";
import {
  hashKnowledgeContent,
  normalizeKnowledgeText,
} from "./website-knowledge.normalize.js";
import {
  deactivateMemoryMissing,
  setMemoryKnowledgeSyncStatus,
  shouldReplaceKnowledgeContent,
  upsertMemoryKnowledgeChunks,
  upsertMemoryKnowledgeDocuments,
  upsertMemoryKnowledgeFaqs,
} from "./website-knowledge.store.js";
import type {
  KnowledgeChunk,
  KnowledgeDocument,
  KnowledgeFaq,
  KnowledgeSyncStatus,
} from "./website-knowledge.types.js";
import {
  WebsiteKnowledgeChunkModel,
  WebsiteKnowledgeDocumentModel,
  WebsiteKnowledgeFaqModel,
  WebsiteKnowledgeSyncModel,
} from "./website-knowledge.model.js";

export type SyncWebsiteKnowledgeOptions = {
  frontendOrigin: string;
  crawlEnabled?: boolean;
  persistMongo?: boolean;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxPages?: number;
  maxBytes?: number;
  concurrency?: number;
  maxDurationMs?: number;
  fetchSitemap?: boolean;
  semanticEnabled?: boolean;
  embeddingProvider?: string;
  browserFallbackEnabled?: boolean;
  signal?: AbortSignal;
  /** When set, only crawl/refresh this allowlisted path (single-page ops). */
  onlyPath?: string;
};

let syncInFlight: Promise<KnowledgeSyncStatus> | null = null;

export function isWebsiteKnowledgeSyncRunning(): boolean {
  return Boolean(syncInFlight);
}

export async function syncWebsiteKnowledge(
  options: SyncWebsiteKnowledgeOptions,
): Promise<KnowledgeSyncStatus> {
  if (syncInFlight) {
    return syncInFlight;
  }
  syncInFlight = runSync(options).finally(() => {
    syncInFlight = null;
  });
  return syncInFlight;
}

async function runSync(options: SyncWebsiteKnowledgeOptions): Promise<KnowledgeSyncStatus> {
  const startedAt = new Date();
  const origin = options.frontendOrigin.replace(/\/+$/, "");
  const crawlEnabled = Boolean(options.crawlEnabled);
  const errors: string[] = [];
  let discovered = 0;
  let updated = 0;
  let failed = 0;
  let unchanged = 0;
  let removed = 0;
  let fetched = 0;
  let semanticIndexed = 0;
  let sitemapFetched = false;

  const docs: KnowledgeDocument[] = [];
  const faqs: KnowledgeFaq[] = [];
  const chunks: KnowledgeChunk[] = [];
  const fetchedAt = startedAt.toISOString();
  const deadline = Date.now() + (options.maxDurationMs ?? 120_000);

  const corpusSections = mergePolicySectionsIntoCorpus(CORPUS_SECTIONS);
  for (const section of corpusSections) {
    if (options.onlyPath && section.path !== options.onlyPath) continue;
    discovered += 1;
    const canonicalUrl = getLocalizedWebsiteUrl(section.path, "en", origin);
    const contentHash = hashKnowledgeContent([
      section.path,
      section.sectionHeading,
      section.content,
    ]);
    const doc: KnowledgeDocument = {
      canonicalUrl,
      path: section.path,
      title: section.title,
      sectionHeading: section.sectionHeading,
      content: section.content,
      sourceType: section.sourceType,
      persona: section.persona,
      language: "en",
      contentHash,
      fetchedAt,
      active: true,
      version: 1,
      discoverySource: "manual_seed",
      lastChangedAt: fetchedAt,
      lastSuccessfulSyncAt: fetchedAt,
      lastAttemptedSyncAt: fetchedAt,
      crawlVersion: 1,
      extractionVersion: 2,
    };
    docs.push(doc);
    updated += 1;
    const chunk = await maybeChunkFromDoc(doc, options);
    if (chunk) {
      chunks.push(chunk);
      if (chunk.embedding?.length) semanticIndexed += 1;
    }
  }

  for (const faq of CORPUS_FAQS) {
    if (options.onlyPath && faq.path !== options.onlyPath) continue;
    discovered += 1;
    const canonicalUrl = getLocalizedWebsiteUrl(faq.path, "en", origin);
    const normalizedQuestion = normalizeKnowledgeText(faq.question);
    const contentHash = hashKnowledgeContent([faq.question, faq.answer]);
    faqs.push({
      question: faq.question,
      answer: faq.answer,
      canonicalUrl,
      language: "en",
      normalizedQuestion,
      contentHash,
      active: true,
      persona: faq.persona,
      discoverySource: "manual_seed",
    });
    updated += 1;
  }

  if (crawlEnabled && !options.signal?.aborted) {
    const discovery = await discoverKnowledgePaths({
      frontendOrigin: origin,
      fetchSitemap: options.fetchSitemap !== false,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      signal: options.signal,
    });
    sitemapFetched = discovery.sitemapFetched;
    if (discovery.sitemapError) {
      errors.push(`sitemap: ${discovery.sitemapError}`);
    }

    const allowed = buildKnowledgeAllowlist(origin);
    const robots = await loadRobotsRules({
      origin,
      allowed,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
    });
    const maxPages = options.maxPages ?? 40;
    let uniquePaths = discovery.urls.map((u) => u.path).slice(0, maxPages);
    if (options.onlyPath) {
      uniquePaths = uniquePaths.filter((path) => path === options.onlyPath);
      if (uniquePaths.length === 0) uniquePaths = [options.onlyPath];
    }
    discovered += uniquePaths.length;

    const crawlResults = await mapWithConcurrency(
      uniquePaths,
      options.concurrency ?? 2,
      async (path) => {
        if (options.signal?.aborted || Date.now() > deadline) {
          return { path, page: null as Awaited<ReturnType<typeof fetchPublicKnowledgePage>> | null, skipped: true };
        }
        const absoluteUrl = getLocalizedWebsiteUrl(path, "en", origin);
        let page = await fetchPublicKnowledgePage({
          absoluteUrl,
          allowed,
          fetchImpl: options.fetchImpl,
          timeoutMs: options.timeoutMs,
          maxBytes: options.maxBytes,
          robots,
          signal: options.signal,
        });
        let extractionMethod: "ssr" | "browser" = "ssr";
        if (page.ok) {
          const contentChars =
            page.sections.reduce((n, s) => n + s.content.length, 0)
            + page.faqs.reduce((n, f) => n + f.answer.length, 0);
          const browser = await extractWithOptionalBrowser({
            absoluteUrl,
            allowed,
            enabled: Boolean(options.browserFallbackEnabled),
            path,
            ssrContentChars: contentChars,
            timeoutMs: options.timeoutMs,
          });
          if (browser.usedBrowser && browser.extracted) {
            const nextChars =
              browser.extracted.sections.reduce((n, s) => n + s.content.length, 0)
              + browser.extracted.faqs.reduce((n, f) => n + f.answer.length, 0);
            if (nextChars > contentChars) {
              page = {
                ...page,
                title: browser.extracted.title || page.title,
                description: browser.extracted.description || page.description,
                canonicalUrl: browser.extracted.canonicalUrl || page.canonicalUrl,
                sections: browser.extracted.sections,
                faqs: browser.extracted.faqs,
                plainText: browser.extracted.plainText,
                links: browser.extracted.links,
              };
              extractionMethod = "browser";
              bumpKnowledgeMetric("browser_fallback_used");
            }
          } else if (browser.usedBrowser && browser.error) {
            errors.push(`${path}: browser_${browser.error}`);
          }
          if (contentChars < 80 && (!browser.extracted || browser.extracted.plainText.length < 80)) {
            errors.push(`${path}: thin_content`);
            bumpKnowledgeMetric("thin_pages");
          }
        }
        return { path, page, skipped: false, extractionMethod };
      },
      options.signal,
    );

    for (const result of crawlResults) {
      if (!result || result.skipped) {
        failed += 1;
        errors.push(`${result?.path || "?"}: cancelled_or_timeout`);
        continue;
      }
      fetched += 1;
      const { path, page } = result;
      if (!page?.ok) {
        failed += 1;
        errors.push(`${path}: ${page?.error || "fetch_failed"}`);
        // Preserve last-known-good: do not wipe existing docs for transient failures.
        continue;
      }
      const meta = OFFICIAL_KNOWLEDGE_PAGES.find((item) => item.path === path)
        || OFFICIAL_KNOWLEDGE_PAGES.find((item) => (item.path.split("?")[0] || "") === (path.split("?")[0] || ""));
      const discoverySource = discovery.urls.find((u) => u.path === path)?.source || "crawler_discovery";
      let pageUpdated = 0;
      for (const section of page.sections.slice(0, 12)) {
        if (!shouldReplaceKnowledgeContent(undefined, section.content)) continue;
        const contentHash = hashKnowledgeContent([path, section.heading, section.content]);
        const existing = docs.find(
          (d) => d.path === path && d.sectionHeading === section.heading && d.language === "en",
        );
        if (existing?.contentHash === contentHash) {
          unchanged += 1;
          continue;
        }
        const doc: KnowledgeDocument = {
          canonicalUrl: (page.canonicalUrl || page.url).split("?")[0] || absoluteUrlSafe(origin, path),
          path,
          title: page.title || meta?.sourceType || "AsliJobs",
          sectionHeading: section.heading,
          content: section.content,
          sourceType: meta?.sourceType || "other",
          persona: meta?.persona || "general",
          language: "en",
          contentHash,
          fetchedAt,
          active: true,
          version: 1,
          discoverySource,
          pageDescription: page.description,
          httpStatus: page.status,
          lastChangedAt: fetchedAt,
          lastSuccessfulSyncAt: fetchedAt,
          lastAttemptedSyncAt: fetchedAt,
          crawlVersion: 1,
          extractionVersion: 2,
          extractionMethod: result.extractionMethod || "ssr",
        };
        docs.push(doc);
        updated += 1;
        pageUpdated += 1;
        const chunk = await maybeChunkFromDoc(doc, options);
        if (chunk) {
          chunks.push(chunk);
          if (chunk.embedding?.length) semanticIndexed += 1;
        }
      }
      for (const faq of page.faqs.slice(0, 40)) {
        const normalizedQuestion = normalizeKnowledgeText(faq.question);
        const contentHash = hashKnowledgeContent([faq.question, faq.answer]);
        faqs.push({
          question: faq.question,
          answer: faq.answer,
          canonicalUrl: (page.canonicalUrl || page.url).split("?")[0] || absoluteUrlSafe(origin, path),
          language: "en",
          normalizedQuestion,
          contentHash,
          active: true,
          discoverySource,
        });
        updated += 1;
        pageUpdated += 1;
      }
      if (pageUpdated === 0) unchanged += 1;
      bumpKnowledgeMetric("crawl_pages_ok");
    }
  }

  const activePaths = new Set(
    docs.map((doc) => `${doc.path}|${doc.sectionHeading}|${doc.language}`),
  );
  const activeFaqKeys = new Set(
    faqs.map((faq) => `${faq.normalizedQuestion}|${faq.language}`),
  );
  const activeChunkIds = new Set(chunks.map((c) => c.chunkId));

  upsertMemoryKnowledgeDocuments(docs);
  upsertMemoryKnowledgeFaqs(faqs);
  upsertMemoryKnowledgeChunks(chunks);
  deactivateMemoryMissing(activePaths, activeFaqKeys);

  if (options.persistMongo) {
    try {
      for (const doc of docs) {
        const existing = await WebsiteKnowledgeDocumentModel.findOne({
          path: doc.path,
          sectionHeading: doc.sectionHeading,
          language: doc.language,
        }).lean();
        if (
          existing &&
          !shouldReplaceKnowledgeContent(String(existing.content || ""), doc.content)
        ) {
          unchanged += 1;
          continue;
        }
        if (existing && existing.contentHash === doc.contentHash) {
          unchanged += 1;
          await WebsiteKnowledgeDocumentModel.updateOne(
            { _id: existing._id },
            {
              $set: {
                lastAttemptedSyncAt: new Date(fetchedAt),
                lastSuccessfulSyncAt: new Date(fetchedAt),
                active: true,
              },
            },
          );
          continue;
        }
        await WebsiteKnowledgeDocumentModel.findOneAndUpdate(
          {
            path: doc.path,
            sectionHeading: doc.sectionHeading,
            language: doc.language,
          },
          {
            $set: {
              ...doc,
              fetchedAt: new Date(doc.fetchedAt),
              lastChangedAt: new Date(doc.lastChangedAt || doc.fetchedAt),
              lastSuccessfulSyncAt: new Date(doc.lastSuccessfulSyncAt || doc.fetchedAt),
              lastAttemptedSyncAt: new Date(doc.lastAttemptedSyncAt || doc.fetchedAt),
              version: (existing?.version ?? 0) + 1,
            },
          },
          { upsert: true },
        );
      }
      for (const faq of faqs) {
        await WebsiteKnowledgeFaqModel.findOneAndUpdate(
          { normalizedQuestion: faq.normalizedQuestion, language: faq.language },
          { $set: faq },
          { upsert: true },
        );
      }
      for (const chunk of chunks) {
        await WebsiteKnowledgeChunkModel.findOneAndUpdate(
          { chunkId: chunk.chunkId },
          { $set: chunk },
          { upsert: true },
        );
      }
      const deactivateDocs = await WebsiteKnowledgeDocumentModel.updateMany(
        {
          $nor: docs.map((doc) => ({
            path: doc.path,
            sectionHeading: doc.sectionHeading,
            language: doc.language,
          })),
        },
        { $set: { active: false } },
      );
      removed += deactivateDocs.modifiedCount || 0;
      await WebsiteKnowledgeFaqModel.updateMany(
        {
          $nor: faqs.map((faq) => ({
            normalizedQuestion: faq.normalizedQuestion,
            language: faq.language,
          })),
        },
        { $set: { active: false } },
      );
      if (activeChunkIds.size > 0) {
        await WebsiteKnowledgeChunkModel.updateMany(
          { chunkId: { $nin: [...activeChunkIds] } },
          { $set: { active: false } },
        );
      }
    } catch (error) {
      failed += 1;
      errors.push(error instanceof Error ? error.message : "mongo_persist_failed");
    }
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const statusLabel =
    failed === 0
      ? "success"
      : updated > 0 || unchanged > 0
        ? "partial"
        : "failed";
  const status: KnowledgeSyncStatus = {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    discovered,
    updated,
    failed,
    unchanged,
    removed,
    fetched,
    lastSuccessAt:
      statusLabel === "failed" ? startedAt.toISOString() : finishedAt.toISOString(),
    errors: errors.slice(0, 40),
    crawlEnabled,
    sitemapFetched,
    durationMs,
    status: statusLabel,
    lastError: errors[0] || "",
    semanticIndexed,
    workerStatus: "idle",
  };
  setMemoryKnowledgeSyncStatus(status);
  bumpKnowledgeMetric("sync_runs");
  bumpKnowledgeMetric(statusLabel === "success" ? "sync_success" : "sync_partial_or_failed");

  if (options.persistMongo) {
    try {
      await WebsiteKnowledgeSyncModel.findOneAndUpdate(
        { key: "default" },
        {
          $set: {
            key: "default",
            startedAt,
            finishedAt,
            discovered,
            updated,
            failed,
            unchanged,
            removed,
            fetched,
            lastSuccessAt: finishedAt,
            syncErrors: status.errors,
            crawlEnabled,
            sitemapFetched,
            durationMs,
            status: statusLabel,
            lastError: status.lastError,
            semanticIndexed,
            workerStatus: "idle",
          },
        },
        { upsert: true },
      );
    } catch (error) {
      status.errors.push(error instanceof Error ? error.message : "sync_status_persist_failed");
    }
  }

  return status;
}

function absoluteUrlSafe(origin: string, path: string): string {
  return getLocalizedWebsiteUrl(path, "en", origin);
}

async function maybeChunkFromDoc(
  doc: KnowledgeDocument,
  options: SyncWebsiteKnowledgeOptions,
): Promise<KnowledgeChunk | null> {
  const documentKey = `${doc.path}|${doc.sectionHeading}|${doc.language}`;
  const chunkId = createHash("sha1").update(documentKey).digest("hex");
  const embedded = await embedKnowledgeText({
    text: `${doc.title}\n${doc.sectionHeading}\n${doc.content}`,
    enabled: Boolean(options.semanticEnabled),
    provider: options.embeddingProvider,
  });
  return {
    chunkId,
    documentKey,
    path: doc.path,
    sectionTitle: doc.sectionHeading,
    text: doc.content,
    sourceUrl: doc.canonicalUrl,
    language: doc.language,
    sourceType: doc.sourceType,
    contentHash: doc.contentHash,
    embedding: embedded?.vector,
    embeddingModel: embedded?.model || HASH_EMBEDDING_MODEL,
    embeddingVersion: embedded?.version || HASH_EMBEDDING_VERSION,
    active: true,
  };
}
