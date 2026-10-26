import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { operationsWhatsAppInboxService } from "./operations-whatsapp-inbox.service.js";

function requireAdminUserId(req: Request): string {
  const userId = req.operationsUserId?.trim();
  if (!userId) {
    throw new AppError("Unauthorized.", HTTP_STATUS.UNAUTHORIZED);
  }
  return userId;
}

export const operationsWhatsAppInboxController = {
  async listConversations(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      search: string;
      participantType: "all" | "job_seeker" | "employer";
    };
    const data = await operationsWhatsAppInboxService.listConversations(query);
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async listContacts(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      search: string;
      participantType: "all" | "job_seeker" | "employer";
    };
    const data = await operationsWhatsAppInboxService.listContacts(query);
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async openConversation(req: Request, res: Response): Promise<void> {
    const body = req.body as {
      participantType: "job_seeker" | "employer";
      accountId: string;
    };
    const data = await operationsWhatsAppInboxService.openConversation(body);
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async getConversation(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params as { conversationId: string };
    const data =
      await operationsWhatsAppInboxService.getConversation(conversationId);
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async listMessages(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params as { conversationId: string };
    const query = req.query as unknown as { limit: number; before?: string };
    const data = await operationsWhatsAppInboxService.listMessages({
      conversationId,
      limit: query.limit,
      before: query.before,
    });
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async setBotPaused(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params as { conversationId: string };
    const body = req.body as { paused: boolean };
    const data = await operationsWhatsAppInboxService.setBotPaused({
      conversationId,
      adminUserId: requireAdminUserId(req),
      paused: body.paused,
    });
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async markRead(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params as { conversationId: string };
    const data =
      await operationsWhatsAppInboxService.markRead(conversationId);
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async getContactDetails(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params as { conversationId: string };
    const data =
      await operationsWhatsAppInboxService.getContactDetails(conversationId);
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async sendMessage(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params as { conversationId: string };
    const body = req.body as { text: string; clientMessageId?: string };
    const data = await operationsWhatsAppInboxService.sendMessage({
      conversationId,
      adminUserId: requireAdminUserId(req),
      text: body.text,
      clientMessageId: body.clientMessageId,
    });
    sendSuccess(res, HTTP_STATUS.CREATED, { data });
  },
};
