import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { operationsWhatsAppInboxService } from "./operations-whatsapp-inbox.service.js";
import { operationsWhatsAppInboxTranslationService } from "./operations-whatsapp-inbox-translation.service.js";

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

  async sendMedia(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params as { conversationId: string };
    const file = req.file;
    if (!file || file.buffer.length === 0) {
      throw new AppError("Choose a file to send.", HTTP_STATUS.BAD_REQUEST);
    }
    const caption = typeof req.body?.caption === "string" ? req.body.caption : "";
    const clientMessageId =
      typeof req.body?.clientMessageId === "string" ? req.body.clientMessageId : "";
    const data = await operationsWhatsAppInboxService.sendMedia({
      conversationId,
      adminUserId: requireAdminUserId(req),
      bytes: file.buffer,
      mimeType: file.mimetype,
      fileName: file.originalname,
      caption,
      clientMessageId,
    });
    sendSuccess(res, HTTP_STATUS.CREATED, { data });
  },

  async getMessageMedia(req: Request, res: Response): Promise<void> {
    const { conversationId, messageId } = req.params as {
      conversationId: string;
      messageId: string;
    };
    const file = await operationsWhatsAppInboxService.getMessageMedia(
      conversationId,
      messageId,
    );
    const mime = file.mimeType.toLowerCase();
    const inline =
      mime.startsWith("image/") ||
      mime.startsWith("video/") ||
      mime.startsWith("audio/");
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader(
      "Content-Disposition",
      `${inline ? "inline" : "attachment"}; filename="${file.fileName.replace(/"/g, "")}"`,
    );
    res.status(HTTP_STATUS.OK).send(file.bytes);
  },

  async getViewLanguage(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params as { conversationId: string };
    const data = await operationsWhatsAppInboxTranslationService.getViewLanguage({
      conversationId,
      operationsUserId: requireAdminUserId(req),
    });
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async setViewLanguage(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params as { conversationId: string };
    const body = req.body as { language: string };
    const data = await operationsWhatsAppInboxTranslationService.setViewLanguage({
      conversationId,
      operationsUserId: requireAdminUserId(req),
      language: body.language,
    });
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async getRecipientLanguage(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params as { conversationId: string };
    const data =
      await operationsWhatsAppInboxTranslationService.resolveRecipientLanguage(
        conversationId,
      );
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async translateMessages(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params as { conversationId: string };
    const body = req.body as {
      targetLanguage: string;
      messageIds: string[];
    };
    const data = await operationsWhatsAppInboxTranslationService.translateMessages({
      conversationId,
      targetLanguage: body.targetLanguage,
      messageIds: body.messageIds,
    });
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async translateDraft(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params as { conversationId: string };
    const body = req.body as { text: string; targetLanguage?: string };
    const data = await operationsWhatsAppInboxTranslationService.translateDraft({
      conversationId,
      text: body.text,
      targetLanguage: body.targetLanguage,
    });
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },
};
