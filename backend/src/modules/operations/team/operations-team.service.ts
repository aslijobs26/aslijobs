import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { buildListPagination } from "../../../utils/pagination.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import { OperationsDepartmentModel } from "../rbac/operations-department.model.js";
import { OperationsRoleModel } from "../rbac/operations-role.model.js";
import { recordOperationsAuditEvent } from "../rbac/operations-audit.service.js";
import {
  getRoleDescendantIds,
  isRoleWithinActorScope,
} from "../rbac/operations-access.service.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import type {
  CreateOperationsTeamMemberBody,
  ListOperationsTeamQuery,
  UpdateOperationsTeamMemberBody,
  UpdateOperationsTeamMemberStatusBody,
} from "./operations-team.validation.js";

function toPublicMember(doc: {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email?: string | null;
  mobileNumber: string;
  role: string;
  roleId?: mongoose.Types.ObjectId | null;
  departmentId?: mongoose.Types.ObjectId | null;
  status: string;
  lastActiveAt?: Date | null;
  invitedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}, extras?: { roleName?: string | null; departmentName?: string | null }) {
  return {
    id: String(doc._id),
    fullName: doc.fullName,
    email: doc.email ?? "",
    mobileNumber: doc.mobileNumber,
    role: doc.role,
    roleId: doc.roleId ? String(doc.roleId) : null,
    roleName: extras?.roleName ?? null,
    departmentId: doc.departmentId ? String(doc.departmentId) : null,
    departmentName: extras?.departmentName ?? null,
    status: doc.status,
    lastActiveAt: doc.lastActiveAt ? doc.lastActiveAt.toISOString() : null,
    invitedAt: doc.invitedAt ? doc.invitedAt.toISOString() : null,
    createdAt: doc.createdAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
  };
}

class OperationsTeamService {
  async overview(actor: OperationsResolvedAccess) {
    const memberFilter = await this.memberScopeFilter(actor);
    const [
      totalMembers,
      activeMembers,
      inactiveMembers,
      pendingInvitations,
      totalRoles,
      totalDepartments,
    ] = await Promise.all([
      OperationsTeamUserModel.countDocuments(memberFilter),
      OperationsTeamUserModel.countDocuments({ ...memberFilter, status: "active" }),
      OperationsTeamUserModel.countDocuments({
        ...memberFilter,
        status: { $in: ["inactive", "suspended"] },
      }),
      OperationsTeamUserModel.countDocuments({
        ...memberFilter,
        lastActiveAt: null,
        invitedAt: { $ne: null },
      }),
      OperationsRoleModel.countDocuments(
        actor.isSuperAdmin
          ? { status: "active" }
          : actor.roleId
            ? {
                status: "active",
                _id: {
                  $in: [actor.roleId, ...(await getRoleDescendantIds(actor.roleId))],
                },
              }
            : { _id: { $in: [] } },
      ),
      OperationsDepartmentModel.countDocuments({ status: "active" }),
    ]);

    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
      pendingInvitations,
      totalRoles,
      totalDepartments,
    };
  }

  async list(actor: OperationsResolvedAccess, query: ListOperationsTeamQuery) {
    const filter: Record<string, unknown> = {
      ...(await this.memberScopeFilter(actor)),
    };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.roleId) {
      filter.roleId = query.roleId;
    }
    if (query.departmentId) {
      filter.departmentId = query.departmentId;
    }
    if (query.search.trim()) {
      const pattern = query.search.trim();
      filter.$or = [
        { fullName: { $regex: pattern, $options: "i" } },
        { email: { $regex: pattern, $options: "i" } },
        { mobileNumber: { $regex: pattern, $options: "i" } },
      ];
    }

    const total = await OperationsTeamUserModel.countDocuments(filter);
    const pagination = buildListPagination(query.page, query.limit, total);
    const members = await OperationsTeamUserModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .lean();

    const [roles, departments] = await Promise.all([
      OperationsRoleModel.find({
        _id: {
          $in: members
            .map((member) => member.roleId)
            .filter((id): id is mongoose.Types.ObjectId => Boolean(id)),
        },
      })
        .select("name")
        .lean(),
      OperationsDepartmentModel.find({
        _id: {
          $in: members
            .map((member) => member.departmentId)
            .filter((id): id is mongoose.Types.ObjectId => Boolean(id)),
        },
      })
        .select("name")
        .lean(),
    ]);

    const roleNameById = new Map(roles.map((role) => [String(role._id), role.name]));
    const departmentNameById = new Map(
      departments.map((department) => [String(department._id), department.name]),
    );

    return {
      members: members.map((member) =>
        toPublicMember(member, {
          roleName:
            member.role === "SUPER_ADMIN"
              ? "Super Admin"
              : member.roleId
                ? roleNameById.get(String(member.roleId)) ?? null
                : member.role,
          departmentName: member.departmentId
            ? departmentNameById.get(String(member.departmentId)) ?? null
            : null,
        }),
      ),
      pagination,
    };
  }

  async create(actor: OperationsResolvedAccess, body: CreateOperationsTeamMemberBody) {
    if (!actor.isSuperAdmin && !actor.canManageUsers) {
      throw new AppError(
        "You are not allowed to create team members.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    await this.assertAssignableRole(actor, body.roleId);

    const email = body.email.trim().toLowerCase();
    const existing = await OperationsTeamUserModel.findOne({
      $or: [{ email }, { mobileNumber: body.mobileNumber }],
    }).lean();
    if (existing) {
      throw new AppError(
        "A team member with this email or mobile number already exists.",
        HTTP_STATUS.CONFLICT,
      );
    }

    const departmentId =
      body.departmentId && body.departmentId !== ""
        ? String(body.departmentId)
        : actor.departmentId;
    if (departmentId) {
      const department = await OperationsDepartmentModel.findOne({
        _id: departmentId,
        status: "active",
      }).lean();
      if (!department) {
        throw new AppError("Department not found.", HTTP_STATUS.BAD_REQUEST);
      }
    }

    const member = await OperationsTeamUserModel.create({
      fullName: body.fullName.trim(),
      email,
      mobileNumber: body.mobileNumber,
      passwordHash: await bcrypt.hash(body.password, 10),
      role: "CUSTOM",
      roleId: body.roleId,
      departmentId: departmentId || null,
      status: body.status,
      invitedAt: new Date(),
      invitedBy: actor.userId,
    });

    await recordOperationsAuditEvent({
      actorUserId: actor.userId,
      actorName: actor.roleName ?? "",
      action: "user.invited",
      targetType: "user",
      targetId: String(member._id),
      targetLabel: member.fullName,
      nextState: {
        email,
        roleId: body.roleId,
        status: member.status,
      },
    });

    return toPublicMember(member);
  }

  async update(
    actor: OperationsResolvedAccess,
    memberId: string,
    body: UpdateOperationsTeamMemberBody,
  ) {
    if (!actor.isSuperAdmin && !actor.canManageUsers) {
      throw new AppError(
        "You are not allowed to update team members.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const member = await OperationsTeamUserModel.findById(memberId).select(
      "+passwordHash",
    );
    if (!member) {
      throw new AppError("Team member not found.", HTTP_STATUS.NOT_FOUND);
    }
    if (member.role === "SUPER_ADMIN" && !actor.isSuperAdmin) {
      throw new AppError(
        "You cannot modify a Super Admin.",
        HTTP_STATUS.FORBIDDEN,
      );
    }
    if (String(member._id) === actor.userId && body.roleId) {
      throw new AppError(
        "You cannot change your own role.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const previous = {
      fullName: member.fullName,
      roleId: member.roleId ? String(member.roleId) : null,
      departmentId: member.departmentId ? String(member.departmentId) : null,
    };

    if (body.roleId) {
      await this.assertAssignableRole(actor, body.roleId);
      member.roleId = new mongoose.Types.ObjectId(body.roleId);
      if (member.role !== "SUPER_ADMIN") {
        member.role = "CUSTOM";
      }
    }

    if (body.fullName) member.fullName = body.fullName.trim();
    if (body.email) member.email = body.email.trim().toLowerCase();
    if (body.mobileNumber) member.mobileNumber = body.mobileNumber;
    if (body.password) {
      member.passwordHash = await bcrypt.hash(body.password, 10);
    }
    if (body.departmentId !== undefined) {
      const departmentId =
        body.departmentId && body.departmentId !== ""
          ? String(body.departmentId)
          : null;
      if (departmentId) {
        const department = await OperationsDepartmentModel.findOne({
          _id: departmentId,
          status: "active",
        }).lean();
        if (!department) {
          throw new AppError("Department not found.", HTTP_STATUS.BAD_REQUEST);
        }
      }
      member.departmentId = departmentId
        ? new mongoose.Types.ObjectId(departmentId)
        : null;
    }

    await member.save();

    await recordOperationsAuditEvent({
      actorUserId: actor.userId,
      actorName: actor.roleName ?? "",
      action: body.roleId ? "role.assigned" : "user.updated",
      targetType: "user",
      targetId: memberId,
      targetLabel: member.fullName,
      previousState: previous,
      nextState: {
        fullName: member.fullName,
        roleId: member.roleId ? String(member.roleId) : null,
        departmentId: member.departmentId ? String(member.departmentId) : null,
      },
    });

    return toPublicMember(member);
  }

  async updateStatus(
    actor: OperationsResolvedAccess,
    memberId: string,
    body: UpdateOperationsTeamMemberStatusBody,
  ) {
    if (!actor.isSuperAdmin && !actor.canManageUsers) {
      throw new AppError(
        "You are not allowed to change member status.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const member = await OperationsTeamUserModel.findById(memberId);
    if (!member) {
      throw new AppError("Team member not found.", HTTP_STATUS.NOT_FOUND);
    }
    if (member.role === "SUPER_ADMIN" && !actor.isSuperAdmin) {
      throw new AppError(
        "You cannot change Super Admin status.",
        HTTP_STATUS.FORBIDDEN,
      );
    }
    if (String(member._id) === actor.userId) {
      throw new AppError(
        "You cannot change your own status.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const previousStatus = member.status;
    member.status = body.status;
    if (body.status !== "active") {
      member.refreshTokenHash = null;
      member.refreshTokenExpiresAt = null;
    }
    await member.save();

    await recordOperationsAuditEvent({
      actorUserId: actor.userId,
      actorName: actor.roleName ?? "",
      action:
        body.status === "active" ? "user.activated" : "user.deactivated",
      targetType: "user",
      targetId: memberId,
      targetLabel: member.fullName,
      previousState: { status: previousStatus },
      nextState: { status: member.status },
      reason: body.reason,
    });

    return toPublicMember(member);
  }

  private async memberScopeFilter(
    actor: OperationsResolvedAccess,
  ): Promise<Record<string, unknown>> {
    if (actor.isSuperAdmin) {
      return {};
    }
    if (!actor.roleId) {
      return { _id: actor.userId };
    }
    const descendantRoleIds = await getRoleDescendantIds(actor.roleId);
    return {
      $or: [
        { _id: actor.userId },
        { roleId: { $in: [actor.roleId, ...descendantRoleIds] } },
      ],
    };
  }

  private async assertAssignableRole(
    actor: OperationsResolvedAccess,
    roleId: string,
  ) {
    const role = await OperationsRoleModel.findOne({
      _id: roleId,
      status: "active",
    }).lean();
    if (!role) {
      throw new AppError(
        "Role not found or archived roles cannot be assigned.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (!actor.isSuperAdmin) {
      if (!actor.canAssignRoles) {
        throw new AppError(
          "You are not allowed to assign roles.",
          HTTP_STATUS.FORBIDDEN,
        );
      }
      if (!(await isRoleWithinActorScope(actor, roleId))) {
        throw new AppError(
          "You can only assign roles inside your hierarchy.",
          HTTP_STATUS.FORBIDDEN,
        );
      }
      const roleKeys = role.grants.map((grant) => grant.key);
      const missing = roleKeys.filter(
        (key) => !actor.delegatableKeys.includes(key),
      );
      if (missing.length > 0) {
        throw new AppError(
          "You cannot assign a role that exceeds your delegation boundary.",
          HTTP_STATUS.FORBIDDEN,
        );
      }
    }
  }
}

export const operationsTeamService = new OperationsTeamService();
