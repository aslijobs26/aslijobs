import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { notificationService } from "./notification.service.js";
import type {
  ConversationReferenceParamsSchema,
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
      sort: query.sort,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Conversations retrieved.",
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
}

export const notificationController = new NotificationController();
