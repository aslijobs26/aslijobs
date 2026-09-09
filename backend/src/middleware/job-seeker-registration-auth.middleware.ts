import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "./error.middleware.js";
import { jwtService } from "../modules/auth/jwt.service.js";
import {
  JobSeekerModel,
  type JobSeekerDocumentLean,
} from "../modules/job-seekers/job-seeker.model.js";

declare global {
  namespace Express {
    interface Request {
      /** Set by registration continuation middleware only. */
      registrationJobSeeker?: JobSeekerDocumentLean;
      registrationJobSeekerId?: string;
    }
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}

/**
 * Authenticates post-OTP registration steps (preferences / complete).
 * Identity comes from the continuation JWT — never from client jobSeekerId.
 */
export async function requireJobSeekerRegistrationContinuation(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AppError(
        "Registration session required. Please verify OTP again.",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const claims =
      jwtService.verifyJobSeekerRegistrationContinuationToken(token);
    const jobSeeker = await JobSeekerModel.findById(claims.sub).select(
      "+otpHash +otpExpiresAt +otpAttempts +lastOtpSentAt",
    );

    if (!jobSeeker) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    if (jobSeeker.registrationStatus === "COMPLETED") {
      throw new AppError(
        "Registration is already completed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (!jobSeeker.isWhatsappVerified) {
      throw new AppError(
        "WhatsApp number must be verified before continuing",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    if (jobSeeker.whatsappNumber !== claims.whatsappNumber) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    req.registrationJobSeeker = jobSeeker.toObject() as JobSeekerDocumentLean;
    req.registrationJobSeekerId = jobSeeker._id.toString();
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED),
    );
  }
}
