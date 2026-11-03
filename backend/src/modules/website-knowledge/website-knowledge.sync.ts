import { getLocalizedWebsiteUrl } from "../../utils/site-language-url.js";
import { OFFICIAL_KNOWLEDGE_PAGES } from "./website-knowledge.catalog.js";
import { CORPUS_FAQS, CORPUS_SECTIONS } from "./website-knowledge.corpus.js";
import { buildKnowledgeAllowlist, fetchPublicKnowledgePage } from "./website-knowledge.crawl.js";
import {
  hashKnowledgeContent,
  normalizeKnowledgeText,
} from "./website-knowledge.normalize.js";
import {
  deactivateMemoryMissing,
  setMemoryKnowledgeSyncStatus,
  shouldReplaceKnowledgeContent,
  upsertMemoryKnowledgeDocuments,
  upsertMemoryKnowledgeFaqs,
} from "./website-knowledge.store.js";
import type {
  KnowledgeDocument,
  KnowledgeFaq,
  KnowledgeSyncStatus,
} from "./website-knowledge.types.js";
import {
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
};

export async function syncWebsiteKnowledge(
  options: SyncWebsiteKnowledgeOptions,
): Promise<KnowledgeSyncStatus> {
  const startedAt = new Date();
  const origin = options.frontendOrigin.replace(/\/+$/, "");
  const crawlEnabled = Boolean(options.crawlEnabled);
  const errors: string[] = [];
  let discovered = 0;
  let updated = 0;
  let failed = 0;

  const docs: KnowledgeDocument[] = [];
  const faqs: KnowledgeFaq[] = [];
  const fetchedAt = startedAt.toISOString();

  for (const section of CORPUS_SECTIONS) {
    discovered += 1;
    const canonicalUrl = getLocalizedWebsiteUrl(section.path, "en", origin);
    const contentHash = hashKnowledgeContent([
      section.path,
      section.sectionHeading,
      section.content,
    ]);
    docs.push({
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
    });
    updated += 1;
  }

  for (const faq of CORPUS_FAQS) {
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
    });
    updated += 1;
  }

  if (crawlEnabled) {
    const allowed = buildKnowledgeAllowlist(origin);
    const uniquePaths = [...new Set(OFFICIAL_KNOWLEDGE_PAGES.map((page) => page.path))];
    for (const path of uniquePaths.slice(0, 40)) {
      discovered += 1;
      const absoluteUrl = getLocalizedWebsiteUrl(path, "en", origin);
      const page = await fetchPublicKnowledgePage({
        absoluteUrl,
        allowed,
        fetchImpl: options.fetchImpl,
        timeoutMs: options.timeoutMs,
      });
      if (!page.ok) {
        failed += 1;
        errors.push(`${path}: ${page.error || "fetch_failed"}`);
        continue;
      }
      const meta = OFFICIAL_KNOWLEDGE_PAGES.find((item) => item.path === path);
      for (const section of page.sections.slice(0, 12)) {
        if (!shouldReplaceKnowledgeContent(undefined, section.content)) continue;
        const contentHash = hashKnowledgeContent([path, section.heading, section.content]);
        docs.push({
          canonicalUrl: page.url.split("?")[0] || absoluteUrl,
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
        });
        updated += 1;
      }
      for (const faq of page.faqs.slice(0, 40)) {
        const normalizedQuestion = normalizeKnowledgeText(faq.question);
        faqs.push({
          question: faq.question,
          answer: faq.answer,
          canonicalUrl: page.url.split("?")[0] || absoluteUrl,
          language: "en",
          normalizedQuestion,
          contentHash: hashKnowledgeContent([faq.question, faq.answer]),
          active: true,
        });
        updated += 1;
      }
    }
  }

  const activePaths = new Set(
    docs.map((doc) => `${doc.path}|${doc.sectionHeading}|${doc.language}`),
  );
  const activeFaqKeys = new Set(
    faqs.map((faq) => `${faq.normalizedQuestion}|${faq.language}`),
  );

  upsertMemoryKnowledgeDocuments(docs);
  upsertMemoryKnowledgeFaqs(faqs);
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
      await WebsiteKnowledgeDocumentModel.updateMany(
        {
          $nor: docs.map((doc) => ({
            path: doc.path,
            sectionHeading: doc.sectionHeading,
            language: doc.language,
          })),
        },
        { $set: { active: false } },
      );
      await WebsiteKnowledgeFaqModel.updateMany(
        {
          $nor: faqs.map((faq) => ({
            normalizedQuestion: faq.normalizedQuestion,
            language: faq.language,
          })),
        },
        { $set: { active: false } },
      );
    } catch (error) {
      failed += 1;
      errors.push(error instanceof Error ? error.message : "mongo_persist_failed");
    }
  }

  const finishedAt = new Date();
  const status: KnowledgeSyncStatus = {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    discovered,
    updated,
    failed,
    lastSuccessAt: failed === discovered ? startedAt.toISOString() : finishedAt.toISOString(),
    errors: errors.slice(0, 40),
    crawlEnabled,
  };
  setMemoryKnowledgeSyncStatus(status);

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
            lastSuccessAt: finishedAt,
            syncErrors: status.errors,
            crawlEnabled,
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
