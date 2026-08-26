import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "./error.middleware.js";
import { jwtService } from "../modules/auth/jwt.service.js";
import { OperationsTeamUserModel } from "../modules/operations/auth/operations-team-user.model.js";
import type {
  OperationsPermissionAction,
  OperationsPermissionMap,
  OperationsPermissionModule,
} from "../modules/operations/auth/operations-rbac.js";
import { canOperationsPermission } from "../modules/operations/auth/operations-rbac.js";
import { resolveOperationsUserPermissions } from "../modules/operations/auth/operations-rbac.service.js";
import type { OperationsTeamRole } from "../modules/operations/operations.constants.js";

declare global {
  namespace Express {
    interface Request {
      operationsUserId?: string;
      operationsTeamRole?: OperationsTeamRole;
      operationsMobileNumber?: string;
      operationsPermissions?: OperationsPermissionMap;
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
    req.operationsPermissions = resolveOperationsUserPermissions(user.role);
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
 * Allow only the listed Operations team roles.
 * Prefer `requireOperationsPermission` for new endpoints.
 */
export function requireOperationsRoles(
  ...allowedRoles: OperationsTeamRole[]
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, _res, next) => {
    const role = req.operationsTeamRole;

    if (!role || !allowedRoles.includes(role)) {
      next(
        new AppError(
          "Access denied. You do not have permission to perform this action.",
          HTTP_STATUS.FORBIDDEN,
        ),
      );
      return;
    }

    next();
  };
}

/**
 * Permission-based API gate. SUPER_ADMIN always has full access via the matrix.
 */
export function requireOperationsPermission(
  module: OperationsPermissionModule,
  action: OperationsPermissionAction,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, _res, next) => {
    const permissions = req.operationsPermissions;
    const role = req.operationsTeamRole;

    if (!role || !permissions) {
      next(new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED));
      return;
    }

    if (!canOperationsPermission(permissions, module, action)) {
      next(
        new AppError(
          "Access denied. You do not have permission to perform this action.",
          HTTP_STATUS.FORBIDDEN,
        ),
      );
      return;
    }

    next();
  };
}

/**
 * Legacy alias — job write routes historically allowed SUPER_ADMIN | OPERATIONS.
 * Implemented via the jobs:update permission so future Team Management stays consistent.
 */
export function requireOperationsJobWriteAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  return requireOperationsPermission("jobs", "update")(req, res, next);
}
