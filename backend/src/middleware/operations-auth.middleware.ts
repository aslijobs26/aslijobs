import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "./error.middleware.js";
import { jwtService } from "../modules/auth/jwt.service.js";
import { OperationsTeamUserModel } from "../modules/operations/auth/operations-team-user.model.js";
import type { OperationsTeamRole } from "../modules/operations/operations.constants.js";

declare global {
  namespace Express {
    interface Request {
      operationsUserId?: string;
      operationsTeamRole?: OperationsTeamRole;
      operationsMobileNumber?: string;
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

export async function requireOperationsAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const payload = jwtService.verifyOperationsTeamAccessToken(token);

    const user = await OperationsTeamUserModel.findOne({
      _id: payload.sub,
      status: "active",
    }).lean();

    if (!user) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    req.operationsUserId = String(user._id);
    req.operationsTeamRole = user.role;
    req.operationsMobileNumber = user.mobileNumber;
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED),
    );
  }
}

const OPERATIONS_JOB_WRITE_ROLES: OperationsTeamRole[] = [
  "SUPER_ADMIN",
  "OPERATIONS",
];

export function requireOperationsJobWriteAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const role = req.operationsTeamRole;

  if (!role || !OPERATIONS_JOB_WRITE_ROLES.includes(role)) {
    next(
      new AppError(
        "You do not have permission to manage jobs.",
        HTTP_STATUS.FORBIDDEN,
      ),
    );
    return;
  }

  next();
}
