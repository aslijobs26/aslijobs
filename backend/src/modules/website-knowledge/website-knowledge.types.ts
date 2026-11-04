export const KNOWLEDGE_LANGUAGES = ["en", "hi", "te", "ta", "kn", "ml"] as const;
export type KnowledgeLanguage = (typeof KNOWLEDGE_LANGUAGES)[number];

export const KNOWLEDGE_SOURCE_TYPES = [
  "faq",
  "guide",
  "pricing",
  "policy",
  "help",
  "contact",
  "feature",
  "other",
] as const;
export type KnowledgeSourceType = (typeof KNOWLEDGE_SOURCE_TYPES)[number];

export const KNOWLEDGE_PERSONAS = ["general", "seeker", "employer"] as const;
export type KnowledgePersona = (typeof KNOWLEDGE_PERSONAS)[number];

export const KNOWLEDGE_DISCOVERY_SOURCES = [
  "footer",
  "route_manifest",
  "sitemap",
  "manual_seed",
  "catalog",
  "crawler_discovery",
] as const;
export type KnowledgeDiscoverySource = (typeof KNOWLEDGE_DISCOVERY_SOURCES)[number];

export type KnowledgeDocument = {
  canonicalUrl: string;
  path: string;
  title: string;
  sectionHeading: string;
  content: string;
  sourceType: KnowledgeSourceType;
  persona: KnowledgePersona;
  language: KnowledgeLanguage;
  contentHash: string;
  fetchedAt: string;
  active: boolean;
  version: number;
  discoverySource?: KnowledgeDiscoverySource;
  pageDescription?: string;
  httpStatus?: number;
  lastChangedAt?: string;
  lastSuccessfulSyncAt?: string;
  lastAttemptedSyncAt?: string;
  crawlVersion?: number;
  extractionVersion?: number;
  /** How the page body was obtained: ssr fetch vs Playwright render. */
  extractionMethod?: "ssr" | "browser" | "corpus" | "policy";
  embeddingModel?: string;
  embeddingProvider?: string;
};

export type KnowledgeFaq = {
  question: string;
  answer: string;
  canonicalUrl: string;
  language: KnowledgeLanguage;
  normalizedQuestion: string;
  contentHash: string;
  active: boolean;
  persona?: KnowledgePersona;
  discoverySource?: KnowledgeDiscoverySource;
};

export type KnowledgeChunk = {
  chunkId: string;
  documentKey: string;
  path: string;
  sectionTitle: string;
  text: string;
  sourceUrl: string;
  language: KnowledgeLanguage;
  sourceType: KnowledgeSourceType;
  contentHash: string;
  embedding?: number[];
  embeddingModel?: string;
  embeddingVersion?: number;
  active: boolean;
};

export type KnowledgeSyncStatus = {
  startedAt: string;
  finishedAt: string;
  discovered: number;
  updated: number;
  failed: number;
  lastSuccessAt: string;
  errors: string[];
  crawlEnabled: boolean;
  unchanged?: number;
  removed?: number;
  fetched?: number;
  sitemapFetched?: boolean;
  durationMs?: number;
  status?: "idle" | "running" | "success" | "partial" | "failed";
  lastError?: string;
  semanticIndexed?: number;
  workerStatus?: "idle" | "running" | "disabled";
};

export type KnowledgeHit = {
  score: number;
  title: string;
  sectionHeading: string;
  content: string;
  canonicalUrl: string;
  sourceType: KnowledgeSourceType;
  language: KnowledgeLanguage;
  kind: "faq" | "section";
  retrievalPath?: "faq_exact" | "faq_alias" | "keyword" | "semantic" | "hybrid";
};

export type KnowledgeAnswer = {
  text: string;
  sourceUrl: string;
  sourceTitle: string;
  confidence: "high" | "low" | "none";
  usedFaq: boolean;
};
