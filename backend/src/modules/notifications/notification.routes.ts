import { Router } from "express";
import { requireNotificationRecipientAuth } from "../../middleware/notification-auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { notificationController } from "./notification.controller.js";
import {
  conversationReferenceParamsSchema,
  listConversationTimelineQuerySchema,
  listNotificationConversationsQuerySchema,
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from "./notification.validation.js";

const notificationRouter = Router();

notificationRouter.use(asyncHandler(requireNotificationRecipientAuth));

notificationRouter.get(
  "/me/unread-count",
  asyncHandler(notificationController.unreadCount),
);

notificationRouter.get(
  "/me/conversations",
  validate(listNotificationConversationsQuerySchema, "query"),
  asyncHandler(notificationController.listConversations),
);

notificationRouter.post(
  "/me/conversations/:applicationId/read",
  validate(conversationReferenceParamsSchema, "params"),
  asyncHandler(notificationController.markConversationAsRead),
);

notificationRouter.get(
  "/me/conversations/:applicationId/timeline",
  validate(conversationReferenceParamsSchema, "params"),
  validate(listConversationTimelineQuerySchema, "query"),
  asyncHandler(notificationController.listConversationTimeline),
);

notificationRouter.get(
  "/me",
  validate(listNotificationsQuerySchema, "query"),
  asyncHandler(notificationController.list),
);

notificationRouter.post(
  "/me/read-all",
  asyncHandler(notificationController.markAllAsRead),
);

notificationRouter.post(
  "/me/:notificationId/read",
  validate(notificationIdParamsSchema, "params"),
  asyncHandler(notificationController.markAsRead),
);

export default notificationRouter;
