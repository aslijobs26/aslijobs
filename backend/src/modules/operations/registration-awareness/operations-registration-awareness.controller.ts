import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { canOperationsPermission } from "../auth/operations-rbac.js";
import { operationsRegistrationAwarenessService } from "./operations-registration-awareness.service.js";
import type {
  MarkRegistrationSeenParams,
  MarkRegistrationsSeenBody,
} from "./operations-registration-awareness.validation.js";

function requireUserId(req: Request): string {
  if (!req.operationsUserId) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsUserId;
}

function assertEntityReadPermission(
  req: Request,
  entityType: "employer" | "candidate",
): void {
  const module = entityType === "employer" ? "employers" : "candidates";
  if (!canOperationsPermission(req.operationsPermissions, module, "read")) {
    throw new AppError("Forbidden", HTTP_STATUS.FORBIDDEN);
  }
}

export class OperationsRegistrationAwarenessController {
  getMetrics = async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const data = await operationsRegistrationAwarenessService.getMetrics({
      permissions: req.operationsPermissions,
      userId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Registration awareness metrics loaded.",
      data,
    });
  };

  getBadges = async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const data = await operationsRegistrationAwarenessService.getBadgeCounts({
      permissions: req.operationsPermissions,
      userId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Navigation badge counts loaded.",
      data,
    });
  };

  markSeen = async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const params = req.params as unknown as MarkRegistrationSeenParams;
    assertEntityReadPermission(req, params.entityType);

    const data = await operationsRegistrationAwarenessService.markEntitySeen({
      entityType: params.entityType,
      entityId: params.entityId,
      userId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Registration marked as seen.",
      data,
    });
  };

  markSeenBulk = async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const body = req.body as MarkRegistrationsSeenBody;
    assertEntityReadPermission(req, body.entityType);

    const data = await operationsRegistrationAwarenessService.markEntitiesSeen({
      entityType: body.entityType,
      entityIds: body.entityIds,
      userId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Registrations marked as seen.",
      data,
    });
  };

  listNotifications = async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const limitRaw = req.query.limit;
    const limit =
      typeof limitRaw === "string" || typeof limitRaw === "number"
        ? Number(limitRaw)
        : undefined;

    const data = await operationsRegistrationAwarenessService.listNotifications({
      userId,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations notifications loaded.",
      data,
    });
  };

  markNotificationRead = async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const { notificationId } = req.params as { notificationId: string };

    const data =
      await operationsRegistrationAwarenessService.markNotificationRead({
        notificationId,
        userId,
      });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Notification marked as read.",
      data,
    });
  };
}

export const operationsRegistrationAwarenessController =
  new OperationsRegistrationAwarenessController();
