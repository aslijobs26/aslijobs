import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { jwtService } from "../modules/auth/jwt.service.js";
import { EmployerModel } from "../modules/employers/employer.model.js";
import { JobSeekerModel } from "../modules/job-seekers/job-seeker.model.js";
import type { NotificationRecipientType } from "../modules/notifications/notification.types.js";
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
 * Accepts either job-seeker or employer access token for notification APIs.
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
      // Fall through to employer verification.
    }

    const employerPayload = jwtService.verifyAccessToken(token);
    const employer = await EmployerModel.findById(employerPayload.sub);
    if (!employer) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    req.notificationRecipientType = "employer";
    req.notificationRecipientId = employer._id.toString();
    req.employerId = employer._id.toString();
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED),
    );
  }
}
