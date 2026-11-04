import { createHash } from "node:crypto";
import { env } from "../../config/env.js";
import { isCrawlablePublicPath, normalizeKnowledgePath } from "./website-knowledge.discover.js";
import {
  embedKnowledgeText,
  embeddingsCompatible,
  expectedEmbeddingModelForProvider,
  resolveEmbeddingProvider,
} from "./website-knowledge.embeddings.js";
import { bumpKnowledgeMetric } from "./website-knowledge.metrics.js";
import { syncWebsiteKnowledge } from "./website-knowledge.sync.js";
import {
  getMemoryKnowledgeChunks,
  getMemoryKnowledgeDocuments,
  upsertMemoryKnowledgeChunks,
} from "./website-knowledge.store.js";
import { WebsiteKnowledgeChunkModel } from "./website-knowledge.model.js";
import mongoose from "mongoose";

export type KnowledgeOpStatus = {
  opId: string;
  type: "refresh_page" | "reindex_one" | "reindex_changed" | "reindex_all" | "refresh_full";
  status: "queued" | "running" | "success" | "failed";
  path?: string;
  startedAt: string;
  finishedAt?: string;
  error?: string;
  result?: Record<string, unknown>;
};

const ops = new Map<string, KnowledgeOpStatus>();
const inflightPaths = new Set<string>();

function newOpId(type: string): string {
  return createHash("sha1").update(`${type}-${Date.now()}-${Math.random()}`).digest("hex").slice(0, 16);
}

export function listKnowledgeOps(limit = 40): KnowledgeOpStatus[] {
  return [...ops.values()]
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);
}

export function getKnowledgeOp(opId: string): KnowledgeOpStatus | null {
  return ops.get(opId) ?? null;
}

export async function refreshKnowledgePage(input: {
  path: string;
  persistMongo?: boolean;
}): Promise<KnowledgeOpStatus> {
  const path = normalizeKnowledgePath(input.path);
  if (!isCrawlablePublicPath(path)) {
    throw new Error("path_not_allowlisted");
  }
  if (inflightPaths.has(path)) {
    throw new Error("page_refresh_already_running");
  }
  const opId = newOpId("refresh_page");
  const op: KnowledgeOpStatus = {
    opId,
    type: "refresh_page",
    status: "running",
    path,
    startedAt: new Date().toISOString(),
  };
  ops.set(opId, op);
  inflightPaths.add(path);
  try {
    const status = await syncWebsiteKnowledge({
      frontendOrigin: env.FRONTEND_URL,
      crawlEnabled: true,
      persistMongo: input.persistMongo !== false,
      onlyPath: path,
      timeoutMs: env.WEBSITE_KNOWLEDGE_FETCH_TIMEOUT_MS,
      maxPages: 1,
      maxBytes: env.WEBSITE_KNOWLEDGE_MAX_RESPONSE_BYTES,
      concurrency: 1,
      maxDurationMs: env.WEBSITE_KNOWLEDGE_MAX_CRAWL_DURATION_MS,
      fetchSitemap: false,
      semanticEnabled: env.WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED,
      embeddingProvider: env.WEBSITE_KNOWLEDGE_EMBEDDING_PROVIDER,
      browserFallbackEnabled: env.WEBSITE_KNOWLEDGE_BROWSER_FALLBACK_ENABLED,
    });
    op.status = status.failed > 0 && status.updated === 0 ? "failed" : "success";
    op.finishedAt = new Date().toISOString();
    op.result = {
      discovered: status.discovered,
      updated: status.updated,
      failed: status.failed,
      errors: status.errors,
    };
    bumpKnowledgeMetric("page_refresh");
  } catch (error) {
    op.status = "failed";
    op.finishedAt = new Date().toISOString();
    op.error = error instanceof Error ? error.message : "refresh_failed";
  } finally {
    inflightPaths.delete(path);
  }
  return op;
}

export async function reindexKnowledgeDocuments(input: {
  mode: "one" | "changed" | "all";
  path?: string;
  sectionHeading?: string;
}): Promise<KnowledgeOpStatus> {
  const opId = newOpId(`reindex_${input.mode}`);
  const op: KnowledgeOpStatus = {
    opId,
    type:
      input.mode === "one"
        ? "reindex_one"
        : input.mode === "changed"
          ? "reindex_changed"
          : "reindex_all",
    status: "running",
    path: input.path,
    startedAt: new Date().toISOString(),
  };
  ops.set(opId, op);

  try {
    if (!env.WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED) {
      throw new Error("semantic_disabled");
    }
    let docs = getMemoryKnowledgeDocuments();
    if (docs.length === 0 && mongoose.connection.readyState === 1) {
      // Memory empty — sync corpus first without crawl.
      await syncWebsiteKnowledge({
        frontendOrigin: env.FRONTEND_URL,
        crawlEnabled: false,
        persistMongo: false,
        semanticEnabled: true,
        embeddingProvider: env.WEBSITE_KNOWLEDGE_EMBEDDING_PROVIDER,
      });
      docs = getMemoryKnowledgeDocuments();
    }
    if (input.mode === "one") {
      const path = normalizeKnowledgePath(input.path || "");
      docs = docs.filter(
        (doc) =>
          doc.path === path
          && (!input.sectionHeading || doc.sectionHeading === input.sectionHeading),
      );
    }
    const provider = resolveEmbeddingProvider(true, env.WEBSITE_KNOWLEDGE_EMBEDDING_PROVIDER);
    const expectedModel = expectedEmbeddingModelForProvider(provider);
    const existing = new Map(
      getMemoryKnowledgeChunks().map((chunk) => [chunk.documentKey, chunk]),
    );
    const chunks = [];
    let indexed = 0;
    let skippedCompatible = 0;
    let droppedIncompatible = 0;
    for (const doc of docs) {
      const documentKey = `${doc.path}|${doc.sectionHeading}|${doc.language}`;
      const prev = existing.get(documentKey);
      if (
        input.mode === "changed"
        && prev
        && prev.contentHash === doc.contentHash
        && embeddingsCompatible({
          embedding: prev.embedding,
          embeddingModel: prev.embeddingModel,
          provider,
        })
      ) {
        chunks.push(prev);
        skippedCompatible += 1;
        continue;
      }
      if (
        prev?.embedding?.length
        && prev.embeddingModel
        && prev.embeddingModel !== expectedModel
      ) {
        droppedIncompatible += 1;
      }
      const embedded = await embedKnowledgeText({
        text: `${doc.title}\n${doc.sectionHeading}\n${doc.content}`,
        enabled: true,
        provider: env.WEBSITE_KNOWLEDGE_EMBEDDING_PROVIDER,
      });
      // Refuse to mix hash and E5 vectors into one active index batch.
      if (embedded && embedded.provider !== provider && provider === "xenova") {
        // Model failed — keep previous compatible chunk if any, else skip embedding.
        if (
          prev
          && embeddingsCompatible({
            embedding: prev.embedding,
            embeddingModel: prev.embeddingModel,
            provider,
          })
        ) {
          chunks.push(prev);
          continue;
        }
      }
      const chunkId = createHash("sha1").update(documentKey).digest("hex");
      chunks.push({
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
        embeddingModel: embedded?.model || "",
        embeddingVersion: embedded?.version || 0,
        active: true,
      });
      indexed += 1;
    }
    upsertMemoryKnowledgeChunks(chunks);
    if (mongoose.connection.readyState === 1) {
      for (const chunk of chunks) {
        await WebsiteKnowledgeChunkModel.findOneAndUpdate(
          { chunkId: chunk.chunkId },
          { $set: chunk },
          { upsert: true },
        );
      }
    }
    op.status = "success";
    op.finishedAt = new Date().toISOString();
    op.result = {
      indexed,
      total: docs.length,
      skippedCompatible,
      droppedIncompatible,
      provider,
      model: expectedModel,
    };
    bumpKnowledgeMetric("reindex_runs");
  } catch (error) {
    op.status = "failed";
    op.finishedAt = new Date().toISOString();
    op.error = error instanceof Error ? error.message : "reindex_failed";
  }
  return op;
}
