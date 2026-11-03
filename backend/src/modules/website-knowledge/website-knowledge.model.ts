import { Schema, model, type InferSchemaType } from "mongoose";
import {
  KNOWLEDGE_LANGUAGES,
  KNOWLEDGE_PERSONAS,
  KNOWLEDGE_SOURCE_TYPES,
} from "./website-knowledge.types.js";

const documentSchema = new Schema(
  {
    canonicalUrl: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    sectionHeading: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    sourceType: { type: String, enum: KNOWLEDGE_SOURCE_TYPES, required: true, index: true },
    persona: { type: String, enum: KNOWLEDGE_PERSONAS, required: true, index: true },
    language: { type: String, enum: KNOWLEDGE_LANGUAGES, required: true, index: true },
    contentHash: { type: String, required: true, trim: true },
    fetchedAt: { type: Date, required: true },
    active: { type: Boolean, required: true, default: true, index: true },
    version: { type: Number, required: true, default: 1 },
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
  },
  { timestamps: true, collection: "website_knowledge_faqs" },
);

faqSchema.index(
  { normalizedQuestion: 1, language: 1 },
  { unique: true, name: "website_knowledge_faq_unique" },
);

const syncSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, required: true },
    discovered: { type: Number, required: true, default: 0 },
    updated: { type: Number, required: true, default: 0 },
    failed: { type: Number, required: true, default: 0 },
    lastSuccessAt: { type: Date, required: true },
    syncErrors: { type: [String], default: [] },
    crawlEnabled: { type: Boolean, required: true, default: false },
  },
  { timestamps: true, collection: "website_knowledge_sync", suppressReservedKeysWarning: true },
);

export type WebsiteKnowledgeDocumentLean = InferSchemaType<typeof documentSchema>;
export type WebsiteKnowledgeFaqLean = InferSchemaType<typeof faqSchema>;
export type WebsiteKnowledgeSyncLean = InferSchemaType<typeof syncSchema>;

export const WebsiteKnowledgeDocumentModel = model(
  "WebsiteKnowledgeDocument",
  documentSchema,
);
export const WebsiteKnowledgeFaqModel = model("WebsiteKnowledgeFaq", faqSchema);
export const WebsiteKnowledgeSyncModel = model("WebsiteKnowledgeSync", syncSchema);
