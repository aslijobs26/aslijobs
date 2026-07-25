import { Router } from "express";
import { requireNotificationRecipientAuth } from "../../middleware/notification-auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { notificationController } from "./notification.controller.js";
import {
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
