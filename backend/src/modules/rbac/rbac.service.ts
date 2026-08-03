import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { EmployerModel } from "../employers/employer.model.js";
import { DepartmentModel } from "../team/department.model.js";
import { TeamMemberModel } from "../team/team-member.model.js";
import { TeamRoleModel } from "../team/team-role.model.js";
import {
  getCachedMemberRbacContext,
  invalidateEmployerRbacCache,
  invalidateMemberRbacCache,
  setCachedMemberRbacContext,
} from "./rbac-context.cache.js";
import {
  buildMemberRbacContext,
  buildOwnerRbacContext,
  serializeRbacContext,
  type RbacSessionActor,
  type ResolvedRbacContext,
} from "./rbac.engine.js";

function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

class RbacService {
  resolveOwnerContext(employerId: string): ResolvedRbacContext {
    return buildOwnerRbacContext(employerId);
  }

  async resolveMemberContext(
    employerId: string,
    memberId: string,
  ): Promise<ResolvedRbacContext> {
    if (
      !mongoose.Types.ObjectId.isValid(employerId) ||
      !mongoose.Types.ObjectId.isValid(memberId)
    ) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const cached = getCachedMemberRbacContext<ResolvedRbacContext>(
      employerId,
      memberId,
    );
    if (cached) {
      return cached;
    }

    const member = await TeamMemberModel.findOne({
      _id: memberId,
      employerId: toObjectId(employerId),
      isDeleted: false,
      status: "active",
    }).lean();

    if (!member || !member.roleId) {
      throw new AppError(
        "Your team access is inactive or incomplete.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const role = await TeamRoleModel.findOne({
      _id: member.roleId,
      employerId: toObjectId(employerId),
      isDeleted: false,
    }).lean();

    if (!role || role.status === "archived") {
      throw new AppError(
        "Your assigned role is unavailable. Contact your admin.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const context = buildMemberRbacContext({
      employerId,
      memberId,
      roleId: String(role._id),
      roleName: role.name,
      isSystem: Boolean(role.isSystem),
      permissions: role.permissions,
      fieldAccess: role.fieldAccess,
      accessLevel: role.accessLevel,
    });

    setCachedMemberRbacContext(employerId, memberId, context);
    return context;
  }

  invalidateMember(employerId: string, memberId: string): void {
    invalidateMemberRbacCache(employerId, memberId);
  }

  invalidateEmployer(employerId: string): void {
    invalidateEmployerRbacCache(employerId);
  }

  getSessionPayload(context: ResolvedRbacContext) {
    return serializeRbacContext(context);
  }

  /**
   * RBAC session for UI shells. Includes the authenticated member's own
   * identity (never another member) when principalType is member.
   */
  async getWorkspaceSession(context: ResolvedRbacContext) {
    const base = serializeRbacContext(context);
    if (context.principalType !== "member" || !context.memberId) {
      return base;
    }

    const actor = await this.resolveSessionActor(context);
    return {
      ...base,
      actor,
    };
  }

  private async resolveSessionActor(
    context: ResolvedRbacContext,
  ): Promise<RbacSessionActor | null> {
    if (!context.memberId) {
      return null;
    }

    const [member, employer] = await Promise.all([
      TeamMemberModel.findOne({
        _id: context.memberId,
        employerId: toObjectId(context.employerId),
        isDeleted: false,
      })
        .select("fullName email status lastActiveAt departmentId")
        .lean(),
      EmployerModel.findById(context.employerId)
        .select("companyName establishmentName accountType")
        .lean(),
    ]);

    if (!member) {
      return null;
    }

    let departmentName: string | null = null;
    if (member.departmentId) {
      const department = await DepartmentModel.findOne({
        _id: member.departmentId,
        employerId: toObjectId(context.employerId),
        isDeleted: false,
      })
        .select("name")
        .lean();
      departmentName = department?.name?.trim() || null;
    }

    const companyName =
      employer?.accountType === "individual"
        ? employer.establishmentName?.trim() ||
          employer.companyName?.trim() ||
          ""
        : employer?.companyName?.trim() || "";

    return {
      fullName: member.fullName.trim(),
      email: member.email.trim().toLowerCase(),
      roleName: context.roleName,
      departmentName,
      companyName,
      status: member.status,
      lastActiveAt: member.lastActiveAt
        ? new Date(member.lastActiveAt).toISOString()
        : null,
    };
  }
}

export const rbacService = new RbacService();
