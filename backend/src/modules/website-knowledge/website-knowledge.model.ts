import { Schema, model, type InferSchemaType } from "mongoose";
import {
  KNOWLEDGE_DISCOVERY_SOURCES,
  KNOWLEDGE_LANGUAGES,
  KNOWLEDGE_PERSONAS,
  KNOWLEDGE_SOURCE_TYPES,
} from "./website-knowledge.types.js";

const documentSchema = new Schema(
  {
    canonicalUrl: { type: String, required: true, trim: true, index: true },
    path: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    sectionHeading: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    sourceType: { type: String, enum: KNOWLEDGE_SOURCE_TYPES, required: true, index: true },
    persona: { type: String, enum: KNOWLEDGE_PERSONAS, required: true, index: true },
    language: { type: String, enum: KNOWLEDGE_LANGUAGES, required: true, index: true },
    contentHash: { type: String, required: true, trim: true, index: true },
    fetchedAt: { type: Date, required: true },
    active: { type: Boolean, required: true, default: true, index: true },
    version: { type: Number, required: true, default: 1 },
    discoverySource: { type: String, enum: KNOWLEDGE_DISCOVERY_SOURCES, required: false },
    pageDescription: { type: String, required: false, default: "" },
    httpStatus: { type: Number, required: false },
    lastChangedAt: { type: Date, required: false },
    lastSuccessfulSyncAt: { type: Date, required: false },
    lastAttemptedSyncAt: { type: Date, required: false },
    crawlVersion: { type: Number, required: false, default: 1 },
    extractionVersion: { type: Number, required: false, default: 2 },
    extractionMethod: {
      type: String,
      enum: ["ssr", "browser", "corpus", "policy"],
      required: false,
    },
    embeddingModel: { type: String, required: false, default: "" },
    embeddingProvider: { type: String, required: false, default: "" },
  },
  { timestamps: true, collection: "website_knowledge_documents" },
);

documentSchema.index(
  { path: 1, sectionHeading: 1, language: 1 },
  { unique: true, name: "website_knowledge_doc_unique" },
);
documentSchema.index(
  { content: "text", title: "text", sectionHeading: "text" },
  { name: "website_knowledge_doc_text", weights: { title: 8, sectionHeading: 6, content: 2 } },
);

const faqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    canonicalUrl: { type: String, required: true, trim: true },
    language: { type: String, enum: KNOWLEDGE_LANGUAGES, required: true, index: true },
    normalizedQuestion: { type: String, required: true, trim: true, index: true },
    contentHash: { type: String, required: true, trim: true },
    active: { type: Boolean, required: true, default: true, index: true },
    persona: { type: String, enum: KNOWLEDGE_PERSONAS, required: true, default: "general" },
    discoverySource: { type: String, enum: KNOWLEDGE_DISCOVERY_SOURCES, required: false },
  },
  { timestamps: true, collection: "website_knowledge_faqs" },
);

faqSchema.index(
  { normalizedQuestion: 1, language: 1 },
  { unique: true, name: "website_knowledge_faq_unique" },
);

const chunkSchema = new Schema(
  {
    chunkId: { type: String, required: true, unique: true, trim: true },
    documentKey: { type: String, required: true, trim: true, index: true },
    path: { type: String, required: true, trim: true, index: true },
    sectionTitle: { type: String, required: true, trim: true },
    text: { type: String, required: true },
    sourceUrl: { type: String, required: true, trim: true },
    language: { type: String, enum: KNOWLEDGE_LANGUAGES, required: true, index: true },
    sourceType: { type: String, enum: KNOWLEDGE_SOURCE_TYPES, required: true, index: true },
    contentHash: { type: String, required: true, trim: true, index: true },
    embedding: { type: [Number], required: false, default: undefined },
    embeddingModel: { type: String, required: false, default: "" },
    embeddingVersion: { type: Number, required: false, default: 0 },
    active: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: true, collection: "website_knowledge_chunks" },
);

chunkSchema.index({ path: 1, sectionTitle: 1, language: 1 }, { name: "website_knowledge_chunk_path" });

const syncSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, required: true },
    discovered: { type: Number, required: true, default: 0 },
    updated: { type: Number, required: true, default: 0 },
    failed: { type: Number, required: true, default: 0 },
    unchanged: { type: Number, required: false, default: 0 },
    removed: { type: Number, required: false, default: 0 },
    fetched: { type: Number, required: false, default: 0 },
    lastSuccessAt: { type: Date, required: true },
    syncErrors: { type: [String], default: [] },
    crawlEnabled: { type: Boolean, required: true, default: false },
    sitemapFetched: { type: Boolean, required: false, default: false },
    durationMs: { type: Number, required: false, default: 0 },
    status: {
      type: String,
      enum: ["idle", "running", "success", "partial", "failed"],
      required: false,
      default: "idle",
    },
    lastError: { type: String, required: false, default: "" },
    semanticIndexed: { type: Number, required: false, default: 0 },
    workerStatus: {
      type: String,
      enum: ["idle", "running", "disabled"],
      required: false,
      default: "disabled",
    },
  },
  { timestamps: true, collection: "website_knowledge_sync", suppressReservedKeysWarning: true },
);

export type WebsiteKnowledgeDocumentLean = InferSchemaType<typeof documentSchema>;
export type WebsiteKnowledgeFaqLean = InferSchemaType<typeof faqSchema>;
export type WebsiteKnowledgeChunkLean = InferSchemaType<typeof chunkSchema>;
export type WebsiteKnowledgeSyncLean = InferSchemaType<typeof syncSchema>;

export const WebsiteKnowledgeDocumentModel = model(
  "WebsiteKnowledgeDocument",
  documentSchema,
);
export const WebsiteKnowledgeFaqModel = model("WebsiteKnowledgeFaq", faqSchema);
export const WebsiteKnowledgeChunkModel = model("WebsiteKnowledgeChunk", chunkSchema);
export const WebsiteKnowledgeSyncModel = model("WebsiteKnowledgeSync", syncSchema);
