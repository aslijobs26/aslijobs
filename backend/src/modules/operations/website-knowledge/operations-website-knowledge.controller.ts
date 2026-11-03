import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { env } from "../../../config/env.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { getWebsiteKnowledgeSyncStatus } from "../../website-knowledge/website-knowledge.service.js";
import { syncWebsiteKnowledge } from "../../website-knowledge/website-knowledge.sync.js";

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
    sendSuccess(res, HTTP_STATUS.OK, {
      data: {
        status,
        crawlEnabled: env.WEBSITE_KNOWLEDGE_CRAWL_ENABLED,
        frontendOrigin: env.FRONTEND_URL,
      },
    });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const adminUserId = requireAdminUserId(req);
    const crawl =
      typeof req.body?.crawl === "boolean"
        ? req.body.crawl
        : env.WEBSITE_KNOWLEDGE_CRAWL_ENABLED;
    const status = await syncWebsiteKnowledge({
      frontendOrigin: env.FRONTEND_URL,
      crawlEnabled: crawl,
      persistMongo: true,
      timeoutMs: env.WEBSITE_KNOWLEDGE_FETCH_TIMEOUT_MS,
    });
    console.info(
      `[website-knowledge] refresh admin=${adminUserId} discovered=${status.discovered} updated=${status.updated} failed=${status.failed} crawl=${status.crawlEnabled}`,
    );
    sendSuccess(res, HTTP_STATUS.OK, { data: { status } });
  },
};
