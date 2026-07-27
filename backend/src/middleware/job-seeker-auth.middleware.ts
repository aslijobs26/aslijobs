import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "./error.middleware.js";
import { jwtService } from "../modules/auth/jwt.service.js";
import {
  JobSeekerModel,
  type JobSeekerDocumentLean,
} from "../modules/job-seekers/job-seeker.model.js";

export type AuthenticatedJobSeeker = JobSeekerDocumentLean;

declare global {
  namespace Express {
    interface Request {
      jobSeeker?: AuthenticatedJobSeeker;
      jobSeekerId?: string;
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

export async function requireJobSeekerAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const payload = jwtService.verifyJobSeekerAccessToken(token);
    const jobSeeker = await JobSeekerModel.findById(payload.sub);

    if (!jobSeeker) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    req.jobSeeker = jobSeeker.toObject() as AuthenticatedJobSeeker;
    req.jobSeekerId = jobSeeker._id.toString();
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
 * Attaches job seeker identity when a valid seeker token is present.
 * Does not fail for anonymous or non-seeker requests.
 */
export async function optionalJobSeekerAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      next();
      return;
    }

    const payload = jwtService.verifyJobSeekerAccessToken(token);
    const jobSeeker = await JobSeekerModel.findById(payload.sub).select("_id");

    if (jobSeeker) {
      req.jobSeekerId = jobSeeker._id.toString();
    }
  } catch {
    // Ignore invalid/non-seeker tokens for public routes.
  }

  next();
}
