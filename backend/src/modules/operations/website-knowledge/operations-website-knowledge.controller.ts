import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { env } from "../../../config/env.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import {
  answerWebsiteKnowledgeQuestion,
  getWebsiteKnowledgeHealth,
  getWebsiteKnowledgeSyncStatus,
  inferKnowledgePersona,
  listWebsiteKnowledgeDocuments,
} from "../../website-knowledge/website-knowledge.service.js";
import { syncWebsiteKnowledge } from "../../website-knowledge/website-knowledge.sync.js";
import { enqueueWebsiteKnowledgeSync } from "../../website-knowledge/website-knowledge.queue.js";
import { getKnowledgeMetricsSnapshot } from "../../website-knowledge/website-knowledge.metrics.js";
import { getEmbeddingProviderHealth } from "../../website-knowledge/website-knowledge.embeddings.js";
import {
  getKnowledgeOp,
  listKnowledgeOps,
  refreshKnowledgePage,
  reindexKnowledgeDocuments,
} from "../../website-knowledge/website-knowledge.ops.js";
import { loadOfficialPolicyCorpusSections } from "../../website-knowledge/website-knowledge.policy.js";
import { CORPUS_FAQS } from "../../website-knowledge/website-knowledge.corpus.js";
import {
  getMemoryKnowledgeChunks,
  getMemoryKnowledgeDocuments,
  getMemoryKnowledgeFaqs,
} from "../../website-knowledge/website-knowledge.store.js";
import { understandLocally } from "../../whatsapp/whatsapp-bot.logic.js";
import { authorizeWhatsAppRole } from "../../whatsapp/whatsapp-role-policy.js";
import {
  buildKnowledgeWhatsAppPreview,
  executeKnowledgeWhatsAppE2E,
  getWhatsAppE2EEligibility,
  isRecipientAuthorizedForE2E,
  listWhatsAppE2EAudit,
} from "../../website-knowledge/website-knowledge.whatsapp-e2e.js";

function requireAdminUserId(req: Request): string {
  const userId = req.operationsUserId?.trim();
  if (!userId) {
    throw new AppError("Unauthorized.", HTTP_STATUS.UNAUTHORIZED);
  }
  return userId;
}

export const operationsWebsiteKnowledgeController = {
  async status(_req: Request, res: Response): Promise<void> {
    const status = await getWebsiteKnowledgeSyncStatus();
    const docs = getMemoryKnowledgeDocuments();
    const faqs = getMemoryKnowledgeFaqs();
    const chunks = getMemoryKnowledgeChunks();
    sendSuccess(res, HTTP_STATUS.OK, {
      data: {
        status,
        crawlEnabled: env.WEBSITE_KNOWLEDGE_CRAWL_ENABLED,
        autoSyncEnabled: env.WEBSITE_KNOWLEDGE_AUTO_SYNC_ENABLED,
        semanticEnabled: env.WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED,
        browserFallbackEnabled: env.WEBSITE_KNOWLEDGE_BROWSER_FALLBACK_ENABLED,
        whatsappE2E: getWhatsAppE2EEligibility(),
        frontendOrigin: env.FRONTEND_URL,
        health: getWebsiteKnowledgeHealth(),
        embedding: getEmbeddingProviderHealth(),
        metrics: getKnowledgeMetricsSnapshot(),
        counts: {
          documents: docs.length,
          activeDocuments: docs.filter((d) => d.active).length,
          inactiveDocuments: docs.filter((d) => !d.active).length,
          faqs: faqs.length || CORPUS_FAQS.length,
          chunks: chunks.length,
          policySections: loadOfficialPolicyCorpusSections().length,
          indexedChunks: chunks.filter((c) => (c.embedding?.length ?? 0) > 0).length,
          browserExtracted: docs.filter((d) => d.extractionMethod === "browser").length,
        },
        recentOps: listKnowledgeOps(12),
        recentE2EAudit: listWhatsAppE2EAudit(8),
      },
    });
  },

  async documents(req: Request, res: Response): Promise<void> {
    requireAdminUserId(req);
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 20);
    const result = await listWebsiteKnowledgeDocuments({ q, page, pageSize });
    const sourceType = typeof req.query.sourceType === "string" ? req.query.sourceType : "";
    const active =
      typeof req.query.active === "string" ? req.query.active === "true" : undefined;
    const filtered = {
      ...result,
      items: result.items.filter((item) => {
        if (sourceType && item.sourceType !== sourceType) return false;
        if (active !== undefined && item.active !== active) return false;
        return true;
      }),
    };
    sendSuccess(res, HTTP_STATUS.OK, { data: filtered });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const adminUserId = requireAdminUserId(req);
    const crawl =
      typeof req.body?.crawl === "boolean"
        ? req.body.crawl
        : env.WEBSITE_KNOWLEDGE_CRAWL_ENABLED;
    const asyncQueue = Boolean(req.body?.async);
    if (asyncQueue) {
      const queued = await enqueueWebsiteKnowledgeSync({
        crawl,
        reason: `admin:${adminUserId}`,
      });
      sendSuccess(res, HTTP_STATUS.OK, { data: { queued } });
      return;
    }
    const status = await syncWebsiteKnowledge({
      frontendOrigin: env.FRONTEND_URL,
      crawlEnabled: crawl,
      persistMongo: true,
      timeoutMs: env.WEBSITE_KNOWLEDGE_FETCH_TIMEOUT_MS,
      maxPages: env.WEBSITE_KNOWLEDGE_MAX_PAGES,
      maxBytes: env.WEBSITE_KNOWLEDGE_MAX_RESPONSE_BYTES,
      concurrency: env.WEBSITE_KNOWLEDGE_CRAWL_CONCURRENCY,
      maxDurationMs: env.WEBSITE_KNOWLEDGE_MAX_CRAWL_DURATION_MS,
      fetchSitemap: true,
      semanticEnabled: env.WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED,
      embeddingProvider: env.WEBSITE_KNOWLEDGE_EMBEDDING_PROVIDER,
      browserFallbackEnabled: env.WEBSITE_KNOWLEDGE_BROWSER_FALLBACK_ENABLED,
    });
    console.info(
      `[website-knowledge] refresh admin=${adminUserId} discovered=${status.discovered} updated=${status.updated} failed=${status.failed} crawl=${status.crawlEnabled}`,
    );
    sendSuccess(res, HTTP_STATUS.OK, { data: { status } });
  },

  async refreshPage(req: Request, res: Response): Promise<void> {
    requireAdminUserId(req);
    const path = String(req.body?.path || "").trim();
    if (!path) throw new AppError("path is required.", HTTP_STATUS.BAD_REQUEST);
    try {
      const op = await refreshKnowledgePage({ path, persistMongo: true });
      sendSuccess(res, HTTP_STATUS.OK, { data: { op } });
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "refresh_page_failed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  },

  async reindex(req: Request, res: Response): Promise<void> {
    requireAdminUserId(req);
    const mode = String(req.body?.mode || "changed") as "one" | "changed" | "all";
    if (!["one", "changed", "all"].includes(mode)) {
      throw new AppError("mode must be one|changed|all.", HTTP_STATUS.BAD_REQUEST);
    }
    const op = await reindexKnowledgeDocuments({
      mode,
      path: typeof req.body?.path === "string" ? req.body.path : undefined,
      sectionHeading:
        typeof req.body?.sectionHeading === "string" ? req.body.sectionHeading : undefined,
    });
    sendSuccess(res, HTTP_STATUS.OK, { data: { op } });
  },

  async ops(req: Request, res: Response): Promise<void> {
    requireAdminUserId(req);
    const opId = typeof req.query.opId === "string" ? req.query.opId : "";
    if (opId) {
      sendSuccess(res, HTTP_STATUS.OK, { data: { op: getKnowledgeOp(opId) } });
      return;
    }
    sendSuccess(res, HTTP_STATUS.OK, { data: { ops: listKnowledgeOps(50) } });
  },

  /**
   * Admin-only knowledge diagnostic — runs intent + retrieval + grounded answer.
   * Does not send WhatsApp messages unless diagnose-send is used separately.
   */
  async diagnose(req: Request, res: Response): Promise<void> {
    requireAdminUserId(req);
    const query = String(req.body?.query || "").trim();
    if (!query || query.length > 500) {
      throw new AppError("query is required (max 500 chars).", HTTP_STATUS.BAD_REQUEST);
    }
    const account = (String(req.body?.account || "none") as "none" | "seeker" | "employer");
    const local = understandLocally(query);
    const gate = authorizeWhatsAppRole({
      account,
      intent: local.intent,
      activeRole: account === "none" ? "" : account,
    });
    const persona = inferKnowledgePersona({ accountType: account, query });
    const knowledge =
      local.intent === "PLATFORM_KNOWLEDGE" && gate.allowed
        ? await answerWebsiteKnowledgeQuestion({
            query,
            language: local.language,
            frontendOrigin: env.FRONTEND_URL,
            persona,
          })
        : null;
    const messagePreview = knowledge
      ? buildKnowledgeWhatsAppPreview({
          answer: knowledge.text,
          sourceUrl: knowledge.sourceUrl,
          language: local.language,
        })
      : null;
    const eligibility = getWhatsAppE2EEligibility();
    const recipientRaw =
      typeof req.body?.recipient === "string" ? req.body.recipient.trim() : "";
    const recipientCheck = recipientRaw
      ? isRecipientAuthorizedForE2E(recipientRaw)
      : { authorized: false, recipient: null, reason: "recipient_not_provided" };
    sendSuccess(res, HTTP_STATUS.OK, {
      data: {
        query,
        account,
        intent: local.intent,
        language: local.language,
        confidence: local.confidence,
        gateAllowed: gate.allowed,
        gateReason: gate.reason || null,
        knowledge: knowledge
          ? {
              answer: knowledge.text,
              sourceUrl: knowledge.sourceUrl,
              sourceTitle: knowledge.sourceTitle,
              confidence: knowledge.confidence,
              topHitKind: knowledge.topHitKind,
              topHitTitle: knowledge.topHitTitle,
              topHitScore: knowledge.topHitScore,
              retrievalPath: knowledge.retrievalPath,
              usedFaq: knowledge.usedFaq,
            }
          : null,
        messagePreview,
        whatsappE2E: {
          ...eligibility,
          recipientAuthorized: recipientCheck.authorized,
          recipientReason: recipientCheck.reason,
          liveSendButtonEnabled:
            eligibility.liveSendAllowed
            && recipientCheck.authorized
            && Boolean(messagePreview),
        },
        note: "Diagnostic only — no Meta WhatsApp send was performed. Use diagnose-send with explicit confirm.",
      },
    });
  },

  /**
   * Explicit authorized test send (mock or live). Never automatic.
   * Requires WHATSAPP_E2E_ENABLED + allowlisted recipient + confirm=true for live.
   */
  async diagnoseSend(req: Request, res: Response): Promise<void> {
    const adminUserId = requireAdminUserId(req);
    const query = String(req.body?.query || "").trim();
    const recipient = String(req.body?.recipient || "").trim();
    const mode = String(req.body?.mode || "mock") === "live" ? "live" : "mock";
    const confirm = Boolean(req.body?.confirm);
    if (!query || query.length > 500) {
      throw new AppError("query is required (max 500 chars).", HTTP_STATUS.BAD_REQUEST);
    }
    if (!recipient) {
      throw new AppError("recipient is required.", HTTP_STATUS.BAD_REQUEST);
    }
    const local = understandLocally(query);
    const persona = inferKnowledgePersona({ accountType: "none", query });
    const knowledge = await answerWebsiteKnowledgeQuestion({
      query,
      language: local.language,
      frontendOrigin: env.FRONTEND_URL,
      persona,
    });
    if (!knowledge?.text) {
      throw new AppError("No grounded knowledge answer to send.", HTTP_STATUS.BAD_REQUEST);
    }
    const messageBody = buildKnowledgeWhatsAppPreview({
      answer: knowledge.text,
      sourceUrl: knowledge.sourceUrl,
      language: local.language,
    });
    const result = await executeKnowledgeWhatsAppE2E({
      adminUserId,
      recipientRaw: recipient,
      messageBody,
      confirm,
      mode,
    });
    sendSuccess(res, HTTP_STATUS.OK, {
      data: {
        ...result,
        intent: local.intent,
        language: local.language,
        knowledge: {
          answer: knowledge.text,
          sourceUrl: knowledge.sourceUrl,
          confidence: knowledge.confidence,
        },
        messagePreview: messageBody,
      },
    });
  },
};
