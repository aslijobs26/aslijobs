import { Router } from "express";
import {
  requireOperationsAuth,
} from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsRegistrationAwarenessController } from "./operations-registration-awareness.controller.js";
import {
  listOperationsNotificationsQuerySchema,
  markNotificationReadParamsSchema,
  markRegistrationSeenParamsSchema,
  markRegistrationsSeenBodySchema,
} from "./operations-registration-awareness.validation.js";

/**
 * Registration awareness + Operations notification inbox.
 * Auth required; entity-specific mutations additionally check module read.
 * Metrics/badges omit unauthorized modules (null counts) rather than 403.
 */
export const operationsRegistrationAwarenessRouter = Router();

operationsRegistrationAwarenessRouter.use(asyncHandler(requireOperationsAuth));

operationsRegistrationAwarenessRouter.get(
  "/metrics",
  asyncHandler(operationsRegistrationAwarenessController.getMetrics),
);

operationsRegistrationAwarenessRouter.get(
  "/badges",
  asyncHandler(operationsRegistrationAwarenessController.getBadges),
);

operationsRegistrationAwarenessRouter.patch(
  "/:entityType/:entityId/seen",
  validate(markRegistrationSeenParamsSchema, "params"),
  asyncHandler(operationsRegistrationAwarenessController.markSeen),
);

operationsRegistrationAwarenessRouter.post(
  "/mark-seen",
  validate(markRegistrationsSeenBodySchema, "body"),
  asyncHandler(operationsRegistrationAwarenessController.markSeenBulk),
);

operationsRegistrationAwarenessRouter.get(
  "/notifications",
  validate(listOperationsNotificationsQuerySchema, "query"),
  asyncHandler(operationsRegistrationAwarenessController.listNotifications),
);

operationsRegistrationAwarenessRouter.patch(
  "/notifications/:notificationId/read",
  validate(markNotificationReadParamsSchema, "params"),
  asyncHandler(operationsRegistrationAwarenessController.markNotificationRead),
);

export default operationsRegistrationAwarenessRouter;
