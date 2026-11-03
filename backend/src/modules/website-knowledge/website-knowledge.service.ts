import { getLocalizedWebsiteUrl } from "../../utils/site-language-url.js";
import { composeGroundedKnowledgeAnswer } from "./website-knowledge.answer.js";
import { CORPUS_FAQS, CORPUS_SECTIONS } from "./website-knowledge.corpus.js";
import {
  hashKnowledgeContent,
  normalizeKnowledgeText,
} from "./website-knowledge.normalize.js";
import {
  rankKnowledgeHits,
  type RetrievableFaq,
  type RetrievableSection,
} from "./website-knowledge.retrieve.js";
import {
  getMemoryKnowledgeDocuments,
  getMemoryKnowledgeFaqs,
  getMemoryKnowledgeSyncStatus,
} from "./website-knowledge.store.js";
import type {
  KnowledgeAnswer,
  KnowledgePersona,
  KnowledgeSyncStatus,
} from "./website-knowledge.types.js";
import {
  WebsiteKnowledgeDocumentModel,
  WebsiteKnowledgeFaqModel,
  WebsiteKnowledgeSyncModel,
} from "./website-knowledge.model.js";

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
  return CORPUS_SECTIONS.map((section) => ({
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
    }));
  }
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
      }));
    }
  } catch {
    // Mongo may be unavailable in unit tests — fall back to bundled corpus.
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
  return corpusAsSections(origin);
}

export async function answerWebsiteKnowledgeQuestion(input: {
  query: string;
  language: string;
  frontendOrigin: string;
  persona?: KnowledgePersona | null;
}): Promise<KnowledgeAnswer> {
  const origin = input.frontendOrigin.replace(/\/+$/, "");
  const [faqs, sections] = await Promise.all([loadFaqs(origin), loadSections(origin)]);
  const hits = rankKnowledgeHits({
    query: input.query,
    faqs,
    sections,
    persona: input.persona,
    limit: 5,
  });

  const top = hits[0];
  if (top?.kind === "faq") {
    const cacheKey = `${normalizeKnowledgeText(top.sectionHeading)}|${input.language}`;
    const contentHash = hashKnowledgeContent([top.sectionHeading, top.content]);
    const cached = faqAnswerCache.get(cacheKey);
    if (cached && cached.hash === contentHash) {
      return cached.answer;
    }
  }

  const answer = composeGroundedKnowledgeAnswer({
    query: input.query,
    hits,
    helpCenterUrl: siteUrl("/help-center", origin, input.language),
    contactUrl: siteUrl("/contact", origin, input.language),
    faqsUrl: siteUrl("/faqs", origin, input.language),
  });

  // Prefer localized official page links while keeping English evidence text
  // (outbound WhatsApp translation localizes the reply when needed).
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
    const cacheKey = `${normalizeKnowledgeText(top.sectionHeading)}|${input.language}`;
    faqAnswerCache.set(cacheKey, {
      hash: hashKnowledgeContent([top.sectionHeading, top.content]),
      answer,
    });
  }

  return answer;
}

export async function getWebsiteKnowledgeSyncStatus(): Promise<KnowledgeSyncStatus | null> {
  const memory = getMemoryKnowledgeSyncStatus();
  if (memory) return memory;
  try {
    const row = await WebsiteKnowledgeSyncModel.findOne({ key: "default" }).lean();
    if (!row) return null;
    return {
      startedAt: new Date(row.startedAt).toISOString(),
      finishedAt: new Date(row.finishedAt).toISOString(),
      discovered: row.discovered,
      updated: row.updated,
      failed: row.failed,
      lastSuccessAt: new Date(row.lastSuccessAt).toISOString(),
      errors: (row as { syncErrors?: string[]; errors?: string[] }).syncErrors
        ?? (row as { errors?: string[] }).errors
        ?? [],
      crawlEnabled: Boolean(row.crawlEnabled),
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
