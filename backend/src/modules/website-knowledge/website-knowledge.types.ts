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
};

export type KnowledgeFaq = {
  question: string;
  answer: string;
  canonicalUrl: string;
  language: KnowledgeLanguage;
  normalizedQuestion: string;
  contentHash: string;
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
};

export type KnowledgeAnswer = {
  text: string;
  sourceUrl: string;
  sourceTitle: string;
  confidence: "high" | "low" | "none";
  usedFaq: boolean;
};
