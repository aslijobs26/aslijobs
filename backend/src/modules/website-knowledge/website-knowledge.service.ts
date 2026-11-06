import mongoose from "mongoose";
import { getLocalizedWebsiteUrl } from "../../utils/site-language-url.js";
import { composeGroundedKnowledgeAnswer } from "./website-knowledge.answer.js";
import { CORPUS_FAQS, CORPUS_SECTIONS } from "./website-knowledge.corpus.js";
import { mergePolicySectionsIntoCorpus } from "./website-knowledge.policy.js";
import { embedKnowledgeText } from "./website-knowledge.embeddings.js";
import { bumpKnowledgeMetric, knowledgeHealthSnapshot } from "./website-knowledge.metrics.js";
import {
  hashKnowledgeContent,
  normalizeKnowledgeText,
} from "./website-knowledge.normalize.js";
import {
  blendSemanticHits,
  expandKnowledgeQuery,
  rankKnowledgeHits,
  type RetrievableFaq,
  type RetrievableSection,
  type SemanticChunk,
} from "./website-knowledge.retrieve.js";
import {
  getMemoryKnowledgeChunks,
  getMemoryKnowledgeDocuments,
  getMemoryKnowledgeFaqs,
  getMemoryKnowledgeSyncStatus,
} from "./website-knowledge.store.js";
import type {
  KnowledgeAnswer,
  KnowledgeHit,
  KnowledgePersona,
  KnowledgeSyncStatus,
} from "./website-knowledge.types.js";
import {
  WebsiteKnowledgeChunkModel,
  WebsiteKnowledgeDocumentModel,
  WebsiteKnowledgeFaqModel,
  WebsiteKnowledgeSyncModel,
} from "./website-knowledge.model.js";
import { env } from "../../config/env.js";
import { getWebsiteKnowledgeWorkerStatus } from "./website-knowledge.queue.js";

function mongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}

const faqAnswerCache = new Map<string, { hash: string; answer: KnowledgeAnswer }>();

export function clearWebsiteKnowledgeFaqCache(): void {
  faqAnswerCache.clear();
}

function siteUrl(path: string, origin: string, language: string): string {
  return getLocalizedWebsiteUrl(path, language, origin);
}

function corpusAsFaqs(origin: string): RetrievableFaq[] {
  return CORPUS_FAQS.map((faq) => ({
    question: faq.question,
    answer: faq.answer,
    canonicalUrl: siteUrl(faq.path, origin, "en"),
    language: "en" as const,
    normalizedQuestion: normalizeKnowledgeText(faq.question),
    persona: faq.persona,
    active: true,
  }));
}

function corpusAsSections(origin: string): RetrievableSection[] {
  return mergePolicySectionsIntoCorpus(CORPUS_SECTIONS).map((section) => ({
    title: section.title,
    sectionHeading: section.sectionHeading,
    content: section.content,
    canonicalUrl: siteUrl(section.path, origin, "en"),
    sourceType: section.sourceType,
    language: "en" as const,
    persona: section.persona,
    keywords: section.keywords,
    active: true,
  }));
}

async function loadFaqs(origin: string): Promise<RetrievableFaq[]> {
  const memory = getMemoryKnowledgeFaqs();
  if (memory.length > 0) {
    return memory.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
      canonicalUrl: faq.canonicalUrl || siteUrl("/faqs", origin, "en"),
      language: faq.language,
      normalizedQuestion: faq.normalizedQuestion,
      active: faq.active,
      persona: faq.persona,
    }));
  }
  if (mongoReady()) {
    try {
      const rows = await WebsiteKnowledgeFaqModel.find({ active: true }).lean();
      if (rows.length > 0) {
        return rows.map((faq) => ({
          question: faq.question,
          answer: faq.answer,
          canonicalUrl: faq.canonicalUrl,
          language: faq.language as RetrievableFaq["language"],
          normalizedQuestion: faq.normalizedQuestion,
          active: faq.active,
          persona: faq.persona as KnowledgePersona | undefined,
        }));
      }
    } catch {
      // fall through to corpus
    }
  }
  return corpusAsFaqs(origin);
}

async function loadSections(origin: string): Promise<RetrievableSection[]> {
  const memory = getMemoryKnowledgeDocuments();
  if (memory.length > 0) {
    return memory.map((doc) => ({
      title: doc.title,
      sectionHeading: doc.sectionHeading,
      content: doc.content,
      canonicalUrl: doc.canonicalUrl,
      sourceType: doc.sourceType,
      language: doc.language,
      persona: doc.persona,
      active: doc.active,
    }));
  }
  if (mongoReady()) {
    try {
      const rows = await WebsiteKnowledgeDocumentModel.find({ active: true }).lean();
      if (rows.length > 0) {
        return rows.map((doc) => ({
          title: doc.title,
          sectionHeading: doc.sectionHeading,
          content: doc.content,
          canonicalUrl: doc.canonicalUrl,
          sourceType: doc.sourceType as RetrievableSection["sourceType"],
          language: doc.language as RetrievableSection["language"],
          persona: doc.persona as RetrievableSection["persona"],
          active: doc.active,
        }));
      }
    } catch {
      // fall through to corpus
    }
  }
  return corpusAsSections(origin);
}

async function loadChunks(): Promise<SemanticChunk[]> {
  const memory = getMemoryKnowledgeChunks();
  if (memory.length > 0) {
    return memory.map((chunk) => ({
      sectionTitle: chunk.sectionTitle,
      text: chunk.text,
      sourceUrl: chunk.sourceUrl,
      sourceType: chunk.sourceType,
      language: chunk.language,
      embedding: chunk.embedding,
      path: chunk.path,
    }));
  }
  if (!mongoReady() || !env.WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED) return [];
  try {
    const rows = await WebsiteKnowledgeChunkModel.find({ active: true })
      .select({
        sectionTitle: 1,
        text: 1,
        sourceUrl: 1,
        sourceType: 1,
        language: 1,
        embedding: 1,
        path: 1,
      })
      .limit(500)
      .lean();
    return rows.map((chunk) => ({
      sectionTitle: chunk.sectionTitle,
      text: chunk.text,
      sourceUrl: chunk.sourceUrl,
      sourceType: chunk.sourceType as SemanticChunk["sourceType"],
      language: chunk.language as SemanticChunk["language"],
      embedding: chunk.embedding as number[] | undefined,
      path: chunk.path,
    }));
  } catch {
    return [];
  }
}

export type KnowledgeAnswerTrace = KnowledgeAnswer & {
  intentPath: "platform_knowledge";
  topHitKind: KnowledgeHit["kind"] | "";
  topHitTitle: string;
  topHitScore: number;
  fallbackReason: string;
  retrievalPath?: string;
};

export async function answerWebsiteKnowledgeQuestion(input: {
  query: string;
  language: string;
  frontendOrigin: string;
  persona?: KnowledgePersona | null;
}): Promise<KnowledgeAnswerTrace> {
  const origin = input.frontendOrigin.replace(/\/+$/, "");
  const started = Date.now();
  bumpKnowledgeMetric("knowledge_queries");
  const [faqs, sections, chunks] = await Promise.all([
    loadFaqs(origin),
    loadSections(origin),
    loadChunks(),
  ]);
  const retrievalQuery = expandKnowledgeQuery(input.query);
  const lexicalHits = rankKnowledgeHits({
    query: retrievalQuery,
    faqs,
    sections,
    persona: input.persona,
    limit: env.WEBSITE_KNOWLEDGE_RETRIEVAL_LIMIT,
  });

  let hits = lexicalHits;
  let queryEmbedding: number[] | null = null;
  if (env.WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED) {
    const embedded = await embedKnowledgeText({
      text: input.query,
      enabled: true,
      provider: env.WEBSITE_KNOWLEDGE_EMBEDDING_PROVIDER,
      asQuery: true,
    });
    queryEmbedding = embedded?.vector ?? null;
    if (queryEmbedding) {
      bumpKnowledgeMetric("semantic_retrieval");
      hits = blendSemanticHits({
        queryEmbedding,
        chunks,
        lexicalHits,
        limit: env.WEBSITE_KNOWLEDGE_RETRIEVAL_LIMIT,
      });
    }
  } else if (lexicalHits[0]?.kind === "faq") {
    bumpKnowledgeMetric("faq_exact_or_alias");
  } else if (lexicalHits.length > 0) {
    bumpKnowledgeMetric("keyword_retrieval");
  } else {
    bumpKnowledgeMetric("no_result");
  }

  const top = hits[0];
  const queryCacheKey = `${normalizeKnowledgeText(input.query)}|${input.language}`;
  if (top?.kind === "faq") {
    const contentHash = hashKnowledgeContent([top.sectionHeading, top.content, input.query]);
    const cached = faqAnswerCache.get(queryCacheKey);
    if (cached && cached.hash === contentHash) {
      bumpKnowledgeMetric("answer_cache_hit");
      console.info(
        `[website-knowledge] lang=${input.language} persona=${input.persona ?? "general"} confidence=${cached.answer.confidence} score=${top.score} kind=faq title=${JSON.stringify(top.sectionHeading.slice(0, 80))} source=${cached.answer.sourceUrl} reason=faq_cache_hit`,
      );
      return {
        ...cached.answer,
        intentPath: "platform_knowledge",
        topHitKind: "faq",
        topHitTitle: top.sectionHeading,
        topHitScore: top.score,
        fallbackReason: "faq_cache_hit",
        retrievalPath: top.retrievalPath || "faq_exact",
      };
    }
  }

  const answer = composeGroundedKnowledgeAnswer({
    query: retrievalQuery,
    hits,
    helpCenterUrl: siteUrl("/help-center", origin, input.language),
    contactUrl: siteUrl("/contact", origin, input.language),
    faqsUrl: siteUrl("/faqs", origin, input.language),
  });

  if (answer.sourceUrl) {
    try {
      const parsed = new URL(answer.sourceUrl);
      answer.sourceUrl = siteUrl(
        `${parsed.pathname}${parsed.search}`,
        origin,
        input.language,
      );
      answer.text = answer.text.replace(
        /Details:\s+\S+/i,
        `Details: ${answer.sourceUrl}`,
      );
    } catch {
      // keep original
    }
  }

  if (top?.kind === "faq" && answer.usedFaq) {
    faqAnswerCache.set(queryCacheKey, {
      hash: hashKnowledgeContent([top.sectionHeading, top.content, input.query]),
      answer,
    });
  }

  if (answer.confidence === "low") bumpKnowledgeMetric("low_confidence");
  if (answer.confidence === "none") bumpKnowledgeMetric("no_result");

  const traced: KnowledgeAnswerTrace = {
    ...answer,
    intentPath: "platform_knowledge",
    topHitKind: top?.kind ?? "",
    topHitTitle: top?.sectionHeading || top?.title || "",
    topHitScore: top?.score ?? 0,
    fallbackReason:
      answer.confidence === "none"
        ? "no_confident_hit"
        : answer.confidence === "low"
          ? "low_confidence_hit"
          : top?.kind === "faq"
            ? "faq_match"
            : "section_match",
    retrievalPath: top?.retrievalPath || (top?.kind === "faq" ? "faq_exact" : "keyword"),
  };

  console.info(
    `[website-knowledge] lang=${input.language} persona=${input.persona ?? "general"} confidence=${traced.confidence} score=${traced.topHitScore} kind=${traced.topHitKind || "-"} title=${JSON.stringify(traced.topHitTitle.slice(0, 80))} source=${traced.sourceUrl} reason=${traced.fallbackReason} path=${traced.retrievalPath} ms=${Date.now() - started}`,
  );

  return traced;
}

export async function getWebsiteKnowledgeSyncStatus(): Promise<KnowledgeSyncStatus | null> {
  const memory = getMemoryKnowledgeSyncStatus();
  if (memory) return memory;
  if (!mongoReady()) return null;
  try {
    const row = await WebsiteKnowledgeSyncModel.findOne({ key: "default" }).lean();
    if (!row) return null;
    return {
      startedAt: new Date(row.startedAt).toISOString(),
      finishedAt: new Date(row.finishedAt).toISOString(),
      discovered: row.discovered,
      updated: row.updated,
      failed: row.failed,
      unchanged: row.unchanged ?? 0,
      removed: row.removed ?? 0,
      fetched: row.fetched ?? 0,
      lastSuccessAt: new Date(row.lastSuccessAt).toISOString(),
      errors: (row as { syncErrors?: string[]; errors?: string[] }).syncErrors
        ?? (row as { errors?: string[] }).errors
        ?? [],
      crawlEnabled: Boolean(row.crawlEnabled),
      sitemapFetched: Boolean(row.sitemapFetched),
      durationMs: row.durationMs ?? 0,
      status: (row.status as KnowledgeSyncStatus["status"]) || "idle",
      lastError: row.lastError || "",
      semanticIndexed: row.semanticIndexed ?? 0,
      workerStatus: getWebsiteKnowledgeWorkerStatus(),
    };
  } catch {
    return null;
  }
}

export function inferKnowledgePersona(input: {
  accountType?: string | null;
  query: string;
}): KnowledgePersona {
  if (input.accountType === "employer") return "employer";
  if (input.accountType === "seeker") return "seeker";
  const q = input.query.toLowerCase();
  if (
    /employer|hire|hiring|post(?:\s+a)?\s+job|pricing|plan|applicant|dashboard|recruit|staff/i.test(
      q,
    )
  ) {
    return "employer";
  }
  if (/job\s*seeker|apply|register|job alert|profile|resume/i.test(q)) {
    return "seeker";
  }
  return "general";
}

export async function listWebsiteKnowledgeDocuments(input: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  total: number;
  items: Array<{
    path: string;
    title: string;
    sectionHeading: string;
    sourceType: string;
    language: string;
    active: boolean;
    canonicalUrl: string;
    fetchedAt?: string;
    contentPreview: string;
  }>;
}> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, input.pageSize ?? 20));
  const memory = getMemoryKnowledgeDocuments();
  if (memory.length > 0) {
    const filtered = memory.filter((doc) => {
      if (!input.q) return true;
      const hay = `${doc.title} ${doc.sectionHeading} ${doc.path} ${doc.content}`.toLowerCase();
      return hay.includes(input.q.toLowerCase());
    });
    const start = (page - 1) * pageSize;
    return {
      total: filtered.length,
      items: filtered.slice(start, start + pageSize).map((doc) => ({
        path: doc.path,
        title: doc.title,
        sectionHeading: doc.sectionHeading,
        sourceType: doc.sourceType,
        language: doc.language,
        active: doc.active,
        canonicalUrl: doc.canonicalUrl,
        fetchedAt: doc.fetchedAt,
        contentPreview: doc.content.slice(0, 240),
      })),
    };
  }
  if (!mongoReady()) return { total: 0, items: [] };
  const filter: Record<string, unknown> = {};
  if (input.q?.trim()) {
    filter.$text = { $search: input.q.trim() };
  }
  const total = await WebsiteKnowledgeDocumentModel.countDocuments(filter);
  const rows = await WebsiteKnowledgeDocumentModel.find(filter)
    .sort({ updatedAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();
  return {
    total,
    items: rows.map((doc) => ({
      path: doc.path,
      title: doc.title,
      sectionHeading: doc.sectionHeading,
      sourceType: String(doc.sourceType),
      language: String(doc.language),
      active: Boolean(doc.active),
      canonicalUrl: doc.canonicalUrl,
      fetchedAt: doc.fetchedAt ? new Date(doc.fetchedAt).toISOString() : undefined,
      contentPreview: String(doc.content || "").slice(0, 240),
    })),
  };
}

export function getWebsiteKnowledgeHealth(): Record<string, unknown> {
  return knowledgeHealthSnapshot({
    mongoReady: mongoReady(),
    syncWorker: getWebsiteKnowledgeWorkerStatus(),
    semanticEnabled: env.WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED,
    lastSyncStatus: getMemoryKnowledgeSyncStatus()?.status ?? null,
    documentCount: getMemoryKnowledgeDocuments().length,
    faqCount: getMemoryKnowledgeFaqs().length,
  });
}
