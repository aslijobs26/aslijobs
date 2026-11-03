import type { KnowledgeHit, KnowledgePersona } from "./website-knowledge.types.js";
import {
  normalizeKnowledgeText,
  tokenizeKnowledgeQuery,
} from "./website-knowledge.normalize.js";

export type RetrievableFaq = {
  question: string;
  answer: string;
  canonicalUrl: string;
  language: KnowledgeHit["language"];
  normalizedQuestion: string;
  persona?: KnowledgePersona;
  active?: boolean;
};

export type RetrievableSection = {
  title: string;
  sectionHeading: string;
  content: string;
  canonicalUrl: string;
  sourceType: KnowledgeHit["sourceType"];
  language: KnowledgeHit["language"];
  persona?: KnowledgePersona;
  keywords?: string[];
  active?: boolean;
};

const EXACT_FAQ_SCORE = 100;
const NEAR_FAQ_SCORE = 88;
const MIN_SECTION_SCORE = 6;

export function scoreFaqMatch(query: string, faq: RetrievableFaq): number {
  if (faq.active === false) return 0;
  const q = normalizeKnowledgeText(query);
  const nq = faq.normalizedQuestion || normalizeKnowledgeText(faq.question);
  if (!q || !nq) return 0;
  if (q === nq) return EXACT_FAQ_SCORE;
  if (nq.includes(q) || q.includes(nq)) return NEAR_FAQ_SCORE;
  const qTokens = new Set(tokenizeKnowledgeQuery(query));
  const fTokens = new Set(tokenizeKnowledgeQuery(`${faq.question} ${faq.answer}`));
  if (qTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of qTokens) {
    if (fTokens.has(token)) overlap += 1;
  }
  const ratio = overlap / qTokens.size;
  let score = 0;
  if (ratio >= 0.7) score = 70 + Math.round(ratio * 20);
  else if (ratio >= 0.45) score = 50 + Math.round(ratio * 20);
  // Prefer dedicated pricing/policy pages over loosely overlapping FAQ blurbs.
  if (
    score > 0 &&
    score < EXACT_FAQ_SCORE &&
    /pricing|price\s*plans?|subscription|hiring plan/.test(q) &&
    !/pricing|price plan|hiring plan|subscription/.test(nq)
  ) {
    score = Math.min(score, 35);
  }
  if (
    score > 0 &&
    score < EXACT_FAQ_SCORE &&
    /privacy|terms|guidelines/.test(q) &&
    !/privacy|terms|guidelines|policy/.test(nq)
  ) {
    score = Math.min(score, 35);
  }
  if (
    score > 0 &&
    score < EXACT_FAQ_SCORE &&
    /(?:post|publish).{0,20}job|job.{0,20}post/.test(q) &&
    !/post a job|how do employers post|employer/.test(nq)
  ) {
    score = Math.min(score, 35);
  }
  return score;
}

export function scoreSectionMatch(
  query: string,
  section: RetrievableSection,
  persona?: KnowledgePersona | null,
): number {
  if (section.active === false) return 0;
  const tokens = tokenizeKnowledgeQuery(query);
  if (tokens.length === 0) return 0;
  const haystack = normalizeKnowledgeText(
    [
      section.title,
      section.sectionHeading,
      section.content,
      ...(section.keywords ?? []),
      section.sourceType,
    ].join(" "),
  );
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 3;
  }
  const heading = normalizeKnowledgeText(section.sectionHeading);
  for (const token of tokens) {
    if (heading.includes(token)) score += 4;
  }
  if (persona && section.persona && section.persona !== "general" && section.persona === persona) {
    score += 4;
  }
  const foldedQuery = normalizeKnowledgeText(query);
  if (/pricing|price|subscription|payment|invoice|hiring plan/.test(foldedQuery)) {
    if (section.sourceType === "pricing") score += 28;
  }
  if (/privacy|policy|terms|guidelines/.test(foldedQuery)) {
    if (section.sourceType === "policy") score += 28;
  }
  if (/contact|support|email|phone|help center/.test(normalizeKnowledgeText(query))) {
    if (section.sourceType === "contact" || section.sourceType === "help") score += 10;
  }
  if (/employer|post|hire|applicant|dashboard|interview/.test(foldedQuery)) {
    if (section.persona === "employer") score += 5;
  }
  if (/seeker|register|apply|job alert|profile/.test(foldedQuery)) {
    if (section.persona === "seeker") score += 5;
  }
  if (
    /(?:post|publish).{0,20}job|job.{0,20}post|employer.{0,20}(?:guide|post|hire)/.test(
      foldedQuery,
    )
  ) {
    if (
      /post a job|post your job|employer guide|register as an employer/i.test(
        `${section.sectionHeading} ${section.content}`,
      )
    ) {
      score += 22;
    }
  }
  if (/(?:applicant|application|candidate).{0,20}(?:where|ekkada|dashboard)/.test(foldedQuery)) {
    if (/receive applications|employer dashboard|track hiring/i.test(section.sectionHeading + section.content)) {
      score += 20;
    }
  }
  return score;
}

export function rankKnowledgeHits(input: {
  query: string;
  faqs: RetrievableFaq[];
  sections: RetrievableSection[];
  persona?: KnowledgePersona | null;
  limit?: number;
}): KnowledgeHit[] {
  const limit = input.limit ?? 5;
  const hits: KnowledgeHit[] = [];

  for (const faq of input.faqs) {
    const score = scoreFaqMatch(input.query, faq);
    if (score < 50) continue;
    hits.push({
      score,
      title: "FAQs",
      sectionHeading: faq.question,
      content: faq.answer,
      canonicalUrl: faq.canonicalUrl,
      sourceType: "faq",
      language: faq.language,
      kind: "faq",
    });
  }

  for (const section of input.sections) {
    const score = scoreSectionMatch(input.query, section, input.persona);
    if (score < MIN_SECTION_SCORE) continue;
    hits.push({
      score,
      title: section.title,
      sectionHeading: section.sectionHeading,
      content: section.content,
      canonicalUrl: section.canonicalUrl,
      sourceType: section.sourceType,
      language: section.language,
      kind: "section",
    });
  }

  hits.sort((a, b) => b.score - a.score || a.sectionHeading.localeCompare(b.sectionHeading));
  const deduped: KnowledgeHit[] = [];
  const seen = new Set<string>();
  for (const hit of hits) {
    const key = `${hit.kind}|${hit.canonicalUrl}|${normalizeKnowledgeText(hit.sectionHeading)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(hit);
    if (deduped.length >= limit) break;
  }
  return deduped;
}

export function confidenceFromHits(hits: KnowledgeHit[]): "high" | "low" | "none" {
  const top = hits[0];
  if (!top) return "none";
  if (top.kind === "faq" && top.score >= NEAR_FAQ_SCORE) return "high";
  if (top.score >= 24) return "high";
  if (top.score >= MIN_SECTION_SCORE) return "low";
  return "none";
}
