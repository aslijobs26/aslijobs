import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "./error.middleware.js";
import { jwtService } from "../modules/auth/jwt.service.js";
import { EmployerModel } from "../modules/employers/employer.model.js";
import type { EmployerDocumentLean } from "../modules/employers/employer.model.js";
import { rbacService } from "../modules/rbac/rbac.service.js";
import type { ResolvedRbacContext } from "../modules/rbac/rbac.engine.js";

export type AuthenticatedEmployer = EmployerDocumentLean;

declare global {
  namespace Express {
    interface Request {
      employer?: AuthenticatedEmployer;
      employerId?: string;
      teamMemberId?: string;
      rbac?: ResolvedRbacContext;
      workspacePrincipal?: "owner" | "member";
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
 * Authenticates employer workspace access for:
 * - Account owner (JWT role employer) → full RBAC bypass
 * - Active team member (JWT role team_member) → role permission matrix
 *
 * Always attaches req.employerId, req.employer, and req.rbac.
 */
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

    const payload = jwtService.verifyWorkspaceAccessToken(token);

    if (payload.role === "employer") {
      const employer = await EmployerModel.findById(payload.sub);

      if (!employer) {
        throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
      }

      const employerId = employer._id.toString();
      req.employer = employer.toObject() as AuthenticatedEmployer;
      req.employerId = employerId;
      req.teamMemberId = undefined;
      req.workspacePrincipal = "owner";
      req.rbac = rbacService.resolveOwnerContext(employerId);
      next();
      return;
    }

    const employerId = payload.employerId;
    const employer = await EmployerModel.findById(employerId);

    if (!employer) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const rbac = await rbacService.resolveMemberContext(
      employerId,
      payload.sub,
    );

    req.employer = employer.toObject() as AuthenticatedEmployer;
    req.employerId = employerId;
    req.teamMemberId = payload.sub;
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
 * Attaches an employer workspace id when a valid employer or team token is
 * present. Anonymous and job-seeker requests continue without it.
 */
export async function optionalWorkspaceAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.employerId || req.jobSeekerId) {
      next();
      return;
    }

    const token = extractBearerToken(req);
    if (!token) {
      next();
      return;
    }

    const payload = jwtService.verifyWorkspaceAccessToken(token);
    const employerId =
      payload.role === "employer" ? payload.sub : payload.employerId;
    if (!employerId || !mongooseIdLooksValid(employerId)) {
      next();
      return;
    }

    const employer = await EmployerModel.findById(employerId).select("_id");
    if (employer) {
      req.employerId = employer._id.toString();
    }
  } catch {
    // Ignore invalid or non-workspace tokens on public routes.
  }

  next();
}

function mongooseIdLooksValid(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}
