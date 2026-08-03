import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { jwtService } from "../modules/auth/jwt.service.js";
import { EmployerModel } from "../modules/employers/employer.model.js";
import { JobSeekerModel } from "../modules/job-seekers/job-seeker.model.js";
import type { NotificationRecipientType } from "../modules/notifications/notification.types.js";
import {
  canPerform,
  type RbacAction,
} from "../modules/rbac/rbac.engine.js";
import { rbacService } from "../modules/rbac/rbac.service.js";
import { recordTeamActivity } from "../modules/team/team-activity.service.js";
import { AppError } from "./error.middleware.js";

declare global {
  namespace Express {
    interface Request {
      notificationRecipientType?: NotificationRecipientType;
      notificationRecipientId?: string;
    }
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || Array.isArray(header)) {
    return null;
  }

  const match = /^Bearer\s+(\S+)/i.exec(header.trim());
  return match?.[1] ?? null;
}

/**
 * Accepts job-seeker, employer owner, or team-member workspace tokens.
 *
 * Employer workspace principals (owner + team member) resolve to the employer
 * recipient id so conversation APIs stay scoped to the employer workspace.
 * Team members also receive req.rbac for Messages permission checks.
 */
export async function requireNotificationRecipientAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    try {
      const seekerPayload = jwtService.verifyJobSeekerAccessToken(token);
      const jobSeeker = await JobSeekerModel.findById(seekerPayload.sub);
      if (!jobSeeker) {
        throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
      }
      req.notificationRecipientType = "job_seeker";
      req.notificationRecipientId = jobSeeker._id.toString();
      req.jobSeekerId = jobSeeker._id.toString();
      next();
      return;
    } catch {
      // Fall through to employer workspace verification.
    }

    const workspacePayload = jwtService.verifyWorkspaceAccessToken(token);

    if (workspacePayload.role === "employer") {
      const employer = await EmployerModel.findById(workspacePayload.sub);
      if (!employer) {
        throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
      }

      const employerId = employer._id.toString();
      req.notificationRecipientType = "employer";
      req.notificationRecipientId = employerId;
      req.employerId = employerId;
      req.teamMemberId = undefined;
      req.workspacePrincipal = "owner";
      req.rbac = rbacService.resolveOwnerContext(employerId);
      next();
      return;
    }

    const employerId = workspacePayload.employerId;
    const employer = await EmployerModel.findById(employerId);
    if (!employer) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const rbac = await rbacService.resolveMemberContext(
      employerId,
      workspacePayload.sub,
    );

    req.notificationRecipientType = "employer";
    req.notificationRecipientId = employerId;
    req.employerId = employerId;
    req.teamMemberId = workspacePayload.sub;
    req.workspacePrincipal = "member";
    req.rbac = rbac;
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED),
    );
  }
}

/**
 * Employer Messages module gate for conversation APIs.
 * Job seekers receive 403 (not employer workspace). Missing Messages permission → 403.
 */
export function requireEmployerMessagesAccess(action: RbacAction = "read") {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (req.notificationRecipientType !== "employer") {
        throw new AppError("Forbidden", HTTP_STATUS.FORBIDDEN);
      }

      const context = req.rbac;
      if (!context) {
        throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
      }

      if (!canPerform(context, "messages", action)) {
        await recordTeamActivity({
          employerId: context.employerId,
          type: "permission_denied",
          message: `Permission denied: messages.${action}`,
          memberId: context.memberId,
          roleId: context.roleId,
          actorEmployerId:
            context.principalType === "owner" ? context.employerId : null,
          metadata: {
            module: "messages",
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
