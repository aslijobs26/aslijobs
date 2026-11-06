import type { KnowledgeHit, KnowledgePersona } from "./website-knowledge.types.js";
import {
  normalizeKnowledgeText,
  softNormalizeKnowledgeText,
  tokenizeKnowledgeQuery,
} from "./website-knowledge.normalize.js";

const FAQ_QUERY_ALIASES: Array<{ pattern: RegExp; questionNeedle: string }> = [
  {
    pattern:
      /what\s+is\s+aslijobs|about\s+aslijobs|aslijobs\s+(?:ante|అంటే|enti|enna|क्या|என்ன|ಏನು|എന്ത്)/i,
    questionNeedle: "what is aslijobs",
  },
  {
    pattern:
      /how\s+(?:does|do)\s+aslijobs\s+work|aslijobs\s+(?:ela|epdi|kaise|hege|engane)\s+work|aslijobs\s+work\s+(?:ela|epdi|kaise)|aslijobs\s+(?:ఎలా|कैसे|எப்படி|ಹೇಗೆ|എങ്ങനെ)\s*(?:work|పని|काम)/i,
    questionNeedle: "how does aslijobs work",
  },
  {
    pattern:
      /(?:need|have)\s+to\s+download\s+(?:an?\s+)?app|download\s+(?:an?\s+)?app|app\s+download\s+(?:avala|కావాలా|चाहिए)|any\s+app\s+needed/i,
    questionNeedle: "do i need to download an app",
  },
  {
    pattern: /job\s+categor|categor(?:y|ies).{0,24}available|which\s+job\s+categor/i,
    questionNeedle: "which job categories are available",
  },
  {
    pattern:
      /employer\s+services?\s+(?:free|paid)|(?:free|paid).{0,24}employer|are\s+employer\s+services/i,
    questionNeedle: "are employer services free or paid",
  },
  {
    pattern: /how\s+(?:do\s+(?:i|employers)\s+|can\s+i\s+|to\s+)?post\s+(?:a\s+)?jobs?/i,
    questionNeedle: "how do employers post a job",
  },
  {
    pattern:
      /^(phone|email|support|contact|call|mobile|number|helpline)\b|contact\s+aslijobs(?:\s+support)?|how\s+(?:can|do)\s+i\s+contact\s+aslijobs/i,
    questionNeedle: "how can users contact aslijobs support",
  },
  {
    pattern: /is\s+(?:job\s+)?posting\s+free|job\s+posting\s+free|posting\s+(?:a\s+)?job\s+cost|how\s+much.{0,30}post/i,
    questionNeedle: "are employer services free or paid",
  },
  {
    pattern: /job\s*seeker\s+regist|how\s+(?:do\s+i\s+|to\s+|can\s+i\s+)?register|register\s+ela|registration\s+ela/i,
    questionNeedle: "how can users update their profile details",
  },
  {
    pattern: /interview\s+tips?|salary\s+guide|career\s+advice/i,
    questionNeedle: "where can users get more help",
  },
];

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
  const softQ = softNormalizeKnowledgeText(query);
  const softNq = softNormalizeKnowledgeText(faq.question);
  if (softQ && softNq && softQ === softNq) return EXACT_FAQ_SCORE;
  // "AsliJobs ante enti?" collapses to softQ "aslijobs" — only the about FAQ may win.
  const aboutQuery =
    /(?:what\s+is\s+aslijobs|about\s+aslijobs|aslijobs\s+(?:ante|అంటే|enti|enna))/i.test(query) ||
    (softQ === "aslijobs" &&
      /ante|enti|enna|అంటే|क्या|என்ன|ಏನು|എന്ത്/.test(normalizeKnowledgeText(query)));
  if (aboutQuery) {
    if (/^what is aslijobs/.test(softNq)) return EXACT_FAQ_SCORE;
    return 0;
  }
  // Avoid treating a lone brand token as a near-exact match against every FAQ.
  if (softQ === "aslijobs") {
    if (/^what is aslijobs/.test(softNq)) return EXACT_FAQ_SCORE;
  } else if (nq.includes(q) || q.includes(nq) || softNq.includes(softQ) || softQ.includes(softNq)) {
    return NEAR_FAQ_SCORE;
  }
  for (const alias of FAQ_QUERY_ALIASES) {
    if (alias.pattern.test(query) && softNq.includes(softNormalizeKnowledgeText(alias.questionNeedle))) {
      return EXACT_FAQ_SCORE;
    }
  }
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
  // A lone "aslijobs" token matches almost every FAQ answer — keep it weak.
  if (qTokens.size === 1 && qTokens.has("aslijobs") && !/^what is aslijobs/.test(softNq)) {
    score = Math.min(score, 25);
  }
  if (/^employer guide$/.test(softQ) && !/employer guide/.test(softNq)) {
    return 0;
  }
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
  if (/employer\s+guide/.test(foldedQuery)) {
    if (/employer guide/i.test(`${section.title} ${section.sectionHeading}`)) {
      score += 30;
    }
  }
  if (/job\s+categor/.test(foldedQuery)) {
    if (/job categor|industries such as/i.test(`${section.sectionHeading} ${section.content}`)) {
      score += 18;
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

export type SemanticChunk = {
  sectionTitle: string;
  text: string;
  sourceUrl: string;
  sourceType: KnowledgeHit["sourceType"];
  language: KnowledgeHit["language"];
  embedding?: number[];
  path?: string;
};

/** Blend lexical ranks with optional dense cosine scores (hybrid retrieval). */
export function blendSemanticHits(input: {
  queryEmbedding: number[] | null;
  chunks: SemanticChunk[];
  lexicalHits: KnowledgeHit[];
  limit?: number;
}): KnowledgeHit[] {
  const limit = input.limit ?? 5;
  const byKey = new Map<string, KnowledgeHit>();
  for (const hit of input.lexicalHits) {
    const key = `${hit.kind}|${hit.canonicalUrl}|${normalizeKnowledgeText(hit.sectionHeading)}`;
    byKey.set(key, {
      ...hit,
      retrievalPath: hit.kind === "faq" ? (hit.score >= EXACT_FAQ_SCORE ? "faq_exact" : "faq_alias") : "keyword",
    });
  }

  if (input.queryEmbedding && input.queryEmbedding.length > 0) {
    const { cosineSimilarity } = requireCosine();
    for (const chunk of input.chunks) {
      if (!chunk.embedding?.length) continue;
      if (chunk.embedding.length !== input.queryEmbedding.length) continue;
      const sim = cosineSimilarity(input.queryEmbedding, chunk.embedding);
      if (sim < 0.22) continue;
      const semanticScore = Math.round(sim * 70);
      const key = `section|${chunk.sourceUrl}|${normalizeKnowledgeText(chunk.sectionTitle)}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.score = Math.max(existing.score, existing.score * 0.7 + semanticScore * 0.45);
        existing.retrievalPath = "hybrid";
      } else if (semanticScore >= 18) {
        byKey.set(key, {
          score: semanticScore,
          title: chunk.sectionTitle,
          sectionHeading: chunk.sectionTitle,
          content: chunk.text,
          canonicalUrl: chunk.sourceUrl,
          sourceType: chunk.sourceType,
          language: chunk.language,
          kind: "section",
          retrievalPath: "semantic",
        });
      }
    }
  }

  return [...byKey.values()]
    .sort((a, b) => b.score - a.score || a.sectionHeading.localeCompare(b.sectionHeading))
    .slice(0, limit);
}

function requireCosine(): { cosineSimilarity: (a: number[], b: number[]) => number } {
  // Local import keeps retrieve usable in tests without circular init issues.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return {
    cosineSimilarity: (a: number[], b: number[]) => {
      const n = Math.min(a.length, b.length);
      let dot = 0;
      let na = 0;
      let nb = 0;
      for (let i = 0; i < n; i += 1) {
        const x = a[i] ?? 0;
        const y = b[i] ?? 0;
        dot += x * y;
        na += x * x;
        nb += y * y;
      }
      if (na <= 0 || nb <= 0) return 0;
      return dot / (Math.sqrt(na) * Math.sqrt(nb));
    },
  };
}
