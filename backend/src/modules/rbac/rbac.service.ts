import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { TeamMemberModel } from "../team/team-member.model.js";
import { TeamRoleModel } from "../team/team-role.model.js";
import {
  buildMemberRbacContext,
  buildOwnerRbacContext,
  serializeRbacContext,
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

    return buildMemberRbacContext({
      employerId,
      memberId,
      roleId: String(role._id),
      roleName: role.name,
      isSystem: Boolean(role.isSystem),
      permissions: role.permissions,
      fieldAccess: role.fieldAccess,
      accessLevel: role.accessLevel,
    });
  }

  getSessionPayload(context: ResolvedRbacContext) {
    return serializeRbacContext(context);
  }
}

export const rbacService = new RbacService();
