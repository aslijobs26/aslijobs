import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "./error.middleware.js";
import {
  canAccessField,
  canPerform,
  type RbacAction,
  type ResolvedRbacContext,
} from "../modules/rbac/rbac.engine.js";
import type { TeamPermissionModule } from "../modules/team/team-permissions.js";
import { recordTeamActivity } from "../modules/team/team-activity.service.js";

declare global {
  namespace Express {
    interface Request {
      rbac?: ResolvedRbacContext;
    }
  }
}

export function requirePermission(
  moduleKey: TeamPermissionModule,
  action: RbacAction,
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const context = req.rbac;
      if (!context) {
        throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
      }

      if (!canPerform(context, moduleKey, action)) {
        await recordTeamActivity({
          employerId: context.employerId,
          type: "permission_denied",
          message: `Permission denied: ${moduleKey}.${action}`,
          memberId: context.memberId,
          roleId: context.roleId,
          actorEmployerId:
            context.principalType === "owner" ? context.employerId : null,
          metadata: {
            module: moduleKey,
            action,
            principalType: context.principalType,
            memberId: context.memberId,
            path: req.originalUrl,
            method: req.method,
          },
        }).catch(() => undefined);

        throw new AppError(
          "You do not have permission to perform this action.",
          HTTP_STATUS.FORBIDDEN,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireFieldAccess(
  moduleKey: TeamPermissionModule,
  fieldKey: string,
  mode: "read" | "write" = "read",
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const context = req.rbac;
      if (!context) {
        throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
      }

      if (!canAccessField(context, moduleKey, fieldKey, mode)) {
        throw new AppError(
          "You do not have permission to access this field.",
          HTTP_STATUS.FORBIDDEN,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
