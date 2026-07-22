import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "./error.middleware.js";
import { jwtService } from "../modules/auth/jwt.service.js";
import { EmployerModel } from "../modules/employers/employer.model.js";
import type { EmployerDocumentLean } from "../modules/employers/employer.model.js";

export type AuthenticatedEmployer = EmployerDocumentLean;

declare global {
  namespace Express {
    interface Request {
      employer?: AuthenticatedEmployer;
      employerId?: string;
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

export async function requireEmployerAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const payload = jwtService.verifyAccessToken(token);
    const employer = await EmployerModel.findById(payload.sub);

    if (!employer) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    req.employer = employer.toObject() as AuthenticatedEmployer;
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
