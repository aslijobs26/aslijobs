import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { notificationService } from "./notification.service.js";
import type {
  BulkConversationReadStateBodySchema,
  ConversationFlagParamsSchema,
  ConversationReferenceParamsSchema,
  ExportNotificationConversationsQuerySchema,
  ListConversationTimelineQuerySchema,
  ListNotificationConversationsQuerySchema,
  ListNotificationsQuerySchema,
  NotificationIdParamsSchema,
} from "./notification.validation.js";

function requireRecipient(req: Request) {
  const recipientType = req.notificationRecipientType;
  const recipientId = req.notificationRecipientId?.trim();

  if (!recipientType || !recipientId) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }

  return { recipientType, recipientId };
}

function requireEmployerRecipient(req: Request) {
  const recipient = requireRecipient(req);
  if (recipient.recipientType !== "employer") {
    throw new AppError("Forbidden", HTTP_STATUS.FORBIDDEN);
  }
  return recipient;
}

function resolveClientIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() || null;
  }
  return req.ip ?? null;
}

export class NotificationController {
  list = async (req: Request, res: Response): Promise<void> => {
    const recipient = requireRecipient(req);
    const query = req.query as unknown as ListNotificationsQuerySchema;

    const result = await notificationService.listForRecipient({
      ...recipient,
      page: query.page,
      limit: query.limit,
      search: query.search,
      readStatus: query.readStatus,
      category: query.category,
      referenceId: query.referenceId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Notifications retrieved.",
      data: result,
    });
  };

  listConversations = async (req: Request, res: Response): Promise<void> => {
    const recipient = requireRecipient(req);
    if (recipient.recipientType !== "employer") {
      throw new AppError("Forbidden", HTTP_STATUS.FORBIDDEN);
    }

    const query =
      req.query as unknown as ListNotificationConversationsQuerySchema;

    const result = await notificationService.listConversationsForEmployer({
      employerId: recipient.recipientId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      readStatus: query.readStatus,
      category: query.category,
      publicJobId: query.publicJobId,
      applicationStatus: query.applicationStatus,
      hasType: query.hasType,
      employerAction: query.employerAction,
      candidateAction: query.candidateAction,
      conversationType: query.conversationType,
      quickDate: query.quickDate,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      view: query.view,
      excludeMuted: query.excludeMuted,
      sort: query.sort,
      includeStats: query.includeStats,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Conversations retrieved.",
      data: result,
    });
  };

  exportConversations = async (req: Request, res: Response): Promise<void> => {
    const recipient = requireEmployerRecipient(req);
    const query =
      req.query as unknown as ExportNotificationConversationsQuerySchema;

    const file = await notificationService.exportConversationsCsv({
      employerId: recipient.recipientId,
      search: query.search,
      readStatus: query.readStatus,
      category: query.category,
      publicJobId: query.publicJobId,
      applicationStatus: query.applicationStatus,
      hasType: query.hasType,
      employerAction: query.employerAction,
      candidateAction: query.candidateAction,
      conversationType: query.conversationType,
      quickDate: query.quickDate,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      view: query.view,
      excludeMuted: query.excludeMuted,
      actor: {
        teamMemberId: req.teamMemberId ?? null,
        ip: resolveClientIp(req),
      },
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.fileName}"`,
    );
    res.setHeader("Content-Length", String(file.buffer.length));
    res.setHeader("Cache-Control", "no-store");
    res.status(HTTP_STATUS.OK).send(file.buffer);
  };

  bulkUpdateConversationReadState = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const recipient = requireEmployerRecipient(req);
    const body = req.body as BulkConversationReadStateBodySchema;

    const result = await notificationService.bulkUpdateConversationReadState({
      employerId: recipient.recipientId,
      applicationIds: body.applicationIds,
      action: body.action,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message:
        body.action === "read"
          ? "Conversations marked as read."
          : "Conversations marked as unread.",
      data: result,
    });
  };

  setConversationFlag =
    (value: boolean) =>
    async (req: Request, res: Response): Promise<void> => {
      const recipient = requireEmployerRecipient(req);
      const params = req.params as unknown as ConversationFlagParamsSchema;
      const flag =
        params.flag === "star"
          ? "starred"
          : params.flag === "archive"
            ? "archived"
            : "muted";

      const result = await notificationService.setConversationFlag({
        employerId: recipient.recipientId,
        applicationId: params.applicationId,
        flag,
        value,
      });

      sendSuccess(res, HTTP_STATUS.OK, {
        message: "Conversation updated.",
        data: result,
      });
    };

  unreadCount = async (req: Request, res: Response): Promise<void> => {
    const recipient = requireRecipient(req);
    const result = await notificationService.getUnreadCount(recipient);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Unread count retrieved.",
      data: result,
    });
  };

  summary = async (req: Request, res: Response): Promise<void> => {
    const recipient = requireRecipient(req);
    const result = await notificationService.getSummaryForRecipient(recipient);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Notification summary retrieved.",
      data: result,
    });
  };

  markAsRead = async (req: Request, res: Response): Promise<void> => {
    const recipient = requireRecipient(req);
    const params = req.params as unknown as NotificationIdParamsSchema;

    const result = await notificationService.markAsRead({
      ...recipient,
      notificationId: params.notificationId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Notification marked as read.",
      data: result,
    });
  };

  markConversationAsRead = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const recipient = requireRecipient(req);
    const params = req.params as unknown as ConversationReferenceParamsSchema;

    const result = await notificationService.markConversationAsRead({
      ...recipient,
      applicationId: params.applicationId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Conversation marked as read.",
      data: result,
    });
  };

  markConversationAsUnread = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const recipient = requireRecipient(req);
    if (recipient.recipientType !== "employer") {
      throw new AppError("Forbidden", HTTP_STATUS.FORBIDDEN);
    }
    const params = req.params as unknown as ConversationReferenceParamsSchema;

    const result = await notificationService.markConversationAsUnread({
      employerId: recipient.recipientId,
      applicationId: params.applicationId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Conversation marked as unread.",
      data: result,
    });
  };

  listConversationTimeline = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const recipient = requireRecipient(req);
    if (recipient.recipientType !== "employer") {
      throw new AppError("Forbidden", HTTP_STATUS.FORBIDDEN);
    }

    const params = req.params as unknown as ConversationReferenceParamsSchema;
    const query = req.query as unknown as ListConversationTimelineQuerySchema;

    const result =
      await notificationService.listConversationTimelineForEmployer({
        employerId: recipient.recipientId,
        applicationId: params.applicationId,
        page: query.page,
        limit: query.limit,
        before: query.before,
      });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Conversation timeline retrieved.",
      data: result,
    });
  };

  markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    const recipient = requireRecipient(req);
    const result = await notificationService.markAllAsRead(recipient);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "All notifications marked as read.",
      data: result,
    });
  };

  deleteOne = async (req: Request, res: Response): Promise<void> => {
    const recipient = requireRecipient(req);
    const params = req.params as unknown as NotificationIdParamsSchema;

    const result = await notificationService.deleteForRecipient({
      ...recipient,
      notificationId: params.notificationId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Notification deleted.",
      data: result,
    });
  };

  clearAll = async (req: Request, res: Response): Promise<void> => {
    const recipient = requireRecipient(req);
    const result = await notificationService.clearAllForRecipient(recipient);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "All notifications cleared.",
      data: result,
    });
  };
}

export const notificationController = new NotificationController();
