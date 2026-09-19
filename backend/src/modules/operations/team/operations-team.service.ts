import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { buildListPagination } from "../../../utils/pagination.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import { OperationsDepartmentModel } from "../rbac/operations-department.model.js";
import { OperationsRoleModel } from "../rbac/operations-role.model.js";
import { OperationsOrgUnitModel } from "../organization/operations-org-unit.model.js";
import { OperationsTeamModel } from "../teams/operations-teams.model.js";
import { OperationsWorkItemModel } from "../work/operations-work.model.js";
import { OPEN_WORK_STATUSES } from "../work/operations-work-department.js";
import { recordOperationsAuditEvent } from "../rbac/operations-audit.service.js";
import {
  assertFineOrCoarsePermission,
  canViewOperationsMemberMobile,
  getRoleDescendantIds,
  isRoleWithinActorScope,
} from "../rbac/operations-access.service.js";
import {
  assertActorCanAccessDepartment,
  assertActorCanAccessOrgUnit,
  loadActorOrgSubtreeIds,
  loadOrgSubtreeIds,
} from "../rbac/operations-org-scope.js";
import {
  TEAM_MEMBERS_ACTIVATE_KEY,
  TEAM_MEMBERS_ASSIGN_DEPARTMENT_KEY,
  TEAM_MEMBERS_ASSIGN_LOCATION_KEY,
  TEAM_MEMBERS_ASSIGN_ROLE_KEY,
  TEAM_MEMBERS_ASSIGN_TEAM_KEY,
  TEAM_MEMBERS_DEACTIVATE_KEY,
  TEAM_MEMBERS_DELETE_KEY,
  TEAM_MEMBERS_INVITE_KEY,
  TEAM_MEMBERS_UPDATE_KEY,
  TEAM_MEMBERS_VIEW_KEY,
} from "../rbac/operations-permission-catalog.js";
import {
  isDepartmentCompatible,
  isSameOrgBranch,
  TEAM_ERROR_CODES,
} from "../teams/operations-teams-domain.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import {
  generateOrganizationTemporaryPassword,
  sendOrganizationInvitationEmail,
} from "./operations-invitation-email.service.js";
import type {
  CreateOperationsTeamMemberBody,
  ListOperationsTeamQuery,
  UpdateOperationsTeamMemberBody,
  UpdateOperationsTeamMemberStatusBody,
} from "./operations-team.validation.js";

const INVITATION_RESEND_COOLDOWN_MS = 60_000;
const INVITATION_RESEND_MAX_PER_HOUR = 5;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function optionalId(value: string | null | undefined): string | null {
  if (!value || value === "") return null;
  return value;
}

function canViewMobile(access: OperationsResolvedAccess): boolean {
  return canViewOperationsMemberMobile(access);
}

function toPublicMember(
  doc: {
    _id: mongoose.Types.ObjectId;
    fullName: string;
    email?: string | null;
    mobileNumber: string;
    role: string;
    roleId?: mongoose.Types.ObjectId | null;
    departmentId?: mongoose.Types.ObjectId | null;
    orgUnitId?: mongoose.Types.ObjectId | null;
    teamId?: mongoose.Types.ObjectId | null;
    status: string;
    lastActiveAt?: Date | null;
    invitedAt?: Date | null;
    invitationLastSentAt?: Date | null;
    invitationResendCount?: number;
    invitationEmailStatus?: string | null;
    invitationEmailError?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  },
  extras?: {
    roleName?: string | null;
    departmentName?: string | null;
    orgUnitName?: string | null;
    teamName?: string | null;
    includeMobile?: boolean;
    mobileNumber?: string;
    invitationEmailSent?: boolean;
    invitationEmailError?: string | null;
  },
) {
  return {
    id: String(doc._id),
    fullName: doc.fullName,
    email: doc.email ?? "",
    ...(extras?.includeMobile
      ? { mobileNumber: extras.mobileNumber ?? "" }
      : {}),
    role: doc.role,
    roleId: doc.roleId ? String(doc.roleId) : null,
    roleName: extras?.roleName ?? null,
    departmentId: doc.departmentId ? String(doc.departmentId) : null,
    departmentName: extras?.departmentName ?? null,
    orgUnitId: doc.orgUnitId ? String(doc.orgUnitId) : null,
    orgUnitName: extras?.orgUnitName ?? null,
    teamId: doc.teamId ? String(doc.teamId) : null,
    teamName: extras?.teamName ?? null,
    status: doc.status,
    lastActiveAt: doc.lastActiveAt ? doc.lastActiveAt.toISOString() : null,
    invitedAt: doc.invitedAt ? doc.invitedAt.toISOString() : null,
    invitationLastSentAt: doc.invitationLastSentAt
      ? doc.invitationLastSentAt.toISOString()
      : null,
    invitationResendCount: doc.invitationResendCount ?? 0,
    invitationEmailStatus: doc.invitationEmailStatus ?? null,
    invitationEmailError: extras?.invitationEmailError ?? doc.invitationEmailError ?? null,
    invitationEmailSent: extras?.invitationEmailSent,
    createdAt: doc.createdAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
  };
}

class OperationsTeamService {
  async overview(actor: OperationsResolvedAccess) {
    assertFineOrCoarsePermission(actor, TEAM_MEMBERS_VIEW_KEY, "team", "read");
    const memberFilter = await this.memberScopeFilter(actor);
    const teamFilter = await this.teamScopeFilter(actor);
    const [
      totalMembers,
      activeMembers,
      inactiveMembers,
      pendingInvitations,
      totalRoles,
      totalDepartments,
      totalTeams,
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
      OperationsDepartmentModel.countDocuments(
        actor.isSuperAdmin || !actor.departmentId
          ? { status: "active" }
          : { status: "active", _id: actor.departmentId },
      ),
      OperationsTeamModel.countDocuments(teamFilter),
    ]);

    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
      pendingInvitations,
      totalRoles,
      totalDepartments,
      totalTeams,
    };
  }

  async list(actor: OperationsResolvedAccess, query: ListOperationsTeamQuery) {
    assertFineOrCoarsePermission(actor, TEAM_MEMBERS_VIEW_KEY, "team", "read");
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
      assertActorCanAccessDepartment(actor, query.departmentId);
      filter.departmentId = query.departmentId;
    }
    if (query.orgUnitId) {
      await assertActorCanAccessOrgUnit(actor, query.orgUnitId);
      const subtree = await loadOrgSubtreeIds(query.orgUnitId);
      filter.orgUnitId = { $in: subtree };
    }
    if (query.teamId) {
      const team = await OperationsTeamModel.findById(query.teamId)
        .select("departmentId orgUnitId")
        .lean();
      if (!team) {
        throw new AppError("Team not found.", HTTP_STATUS.NOT_FOUND, {
          code: TEAM_ERROR_CODES.TEAM_NOT_FOUND,
        });
      }
      assertActorCanAccessDepartment(actor, String(team.departmentId));
      await assertActorCanAccessOrgUnit(actor, String(team.orgUnitId));
      filter.teamId = query.teamId;
    }
    if (query.search.trim()) {
      const pattern = escapeRegex(query.search.trim());
      const searchFields: Record<string, unknown>[] = [
        { fullName: { $regex: pattern, $options: "i" } },
        { email: { $regex: pattern, $options: "i" } },
      ];
      if (canViewMobile(actor)) {
        searchFields.push({ mobileNumber: { $regex: pattern, $options: "i" } });
      }
      const searchClause = { $or: searchFields };
      if (Array.isArray(filter.$and)) {
        filter.$and.push(searchClause);
      } else if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, searchClause];
        delete filter.$or;
      } else {
        Object.assign(filter, searchClause);
      }
    }

    const total = await OperationsTeamUserModel.countDocuments(filter);
    const pagination = buildListPagination(query.page, query.limit, total);
    const members = await OperationsTeamUserModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .lean();

    const showMobile = canViewMobile(actor);
    const extras = await this.hydrateMemberExtras(members, showMobile);

    return {
      members: members.map((member) =>
        toPublicMember(member, extras.get(String(member._id))),
      ),
      pagination,
    };
  }

  async create(actor: OperationsResolvedAccess, body: CreateOperationsTeamMemberBody) {
    assertFineOrCoarsePermission(actor, TEAM_MEMBERS_INVITE_KEY, "team", "create");

    await this.assertAssignableRole(actor, body.roleId);
    assertFineOrCoarsePermission(
      actor,
      TEAM_MEMBERS_ASSIGN_ROLE_KEY,
      "team",
      "update",
    );

    const email = body.email.trim().toLowerCase();
    const emailClash = await OperationsTeamUserModel.findOne({ email })
      .select("_id")
      .lean();
    if (emailClash) {
      throw new AppError(
        "A team member with this email already exists.",
        HTTP_STATUS.CONFLICT,
      );
    }
    const mobileClash = await OperationsTeamUserModel.findOne({
      mobileNumber: body.mobileNumber,
    })
      .select("_id")
      .lean();
    if (mobileClash) {
      throw new AppError(
        "A team member with this mobile number already exists.",
        HTTP_STATUS.CONFLICT,
      );
    }

    const requestedDepartmentId = optionalId(body.departmentId);
    if (requestedDepartmentId) {
      await this.assertActiveDepartment(actor, requestedDepartmentId);
    }
    const departmentId = requestedDepartmentId ?? actor.departmentId;

    const orgUnitId = optionalId(body.orgUnitId);
    if (orgUnitId) {
      await this.assertActiveOrgUnit(actor, orgUnitId);
    }

    const teamId = optionalId(body.teamId);
    if (teamId) {
      await this.assertTeamAssignment({
        actor,
        teamId,
        departmentId,
        orgUnitId,
        existingTeamId: null,
      });
    }

    const assignedRole = await OperationsRoleModel.findById(body.roleId)
      .select("name")
      .lean();
    const roleName = assignedRole?.name ?? "Organization member";
    const temporaryPassword =
      body.password && body.password.length >= 8
        ? body.password
        : generateOrganizationTemporaryPassword();

    const member = await OperationsTeamUserModel.create({
      fullName: body.fullName.trim(),
      email,
      mobileNumber: body.mobileNumber,
      passwordHash: await bcrypt.hash(temporaryPassword, 10),
      role: "CUSTOM",
      roleId: body.roleId,
      departmentId: departmentId || null,
      orgUnitId: orgUnitId || null,
      teamId: teamId || null,
      status: body.status,
      invitedAt: new Date(),
      invitedBy: actor.userId,
      invitationEmailStatus: "pending",
    });

    await recordOperationsAuditEvent({
      actorUserId: actor.userId,
      actorName: actor.roleName ?? "",
      action: "user.created",
      targetType: "user",
      targetId: String(member._id),
      targetLabel: member.fullName,
      nextState: {
        email,
        roleId: body.roleId,
        roleName,
        departmentId,
        orgUnitId,
        teamId,
        status: member.status,
      },
    });

    if (teamId) {
      await recordOperationsAuditEvent({
        actorUserId: actor.userId,
        actorName: actor.roleName ?? "",
        action: "team.member_added",
        targetType: "team",
        targetId: teamId,
        targetLabel: member.fullName,
        nextState: { userId: String(member._id) },
      });
    }

    const invitation = await this.deliverInvitationEmail({
      actor,
      memberId: String(member._id),
      fullName: member.fullName,
      email,
      roleName,
      temporaryPassword,
      isResend: false,
    });

    const extras = await this.hydrateMemberExtras(
      [member.toObject()],
      canViewMobile(actor),
    );
    const extra = extras.get(String(member._id));
    return toPublicMember(member, {
      ...extra,
      invitationEmailSent: invitation.sent,
      invitationEmailError: invitation.errorMessage,
    });
  }

  async update(
    actor: OperationsResolvedAccess,
    memberId: string,
    body: UpdateOperationsTeamMemberBody,
  ) {
    assertFineOrCoarsePermission(actor, TEAM_MEMBERS_UPDATE_KEY, "team", "update");

    const member = await OperationsTeamUserModel.findById(memberId).select(
      "+passwordHash",
    );
    if (!member) {
      throw new AppError("Team member not found.", HTTP_STATUS.NOT_FOUND);
    }
    await this.assertCanManageMember(actor, member);

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
      orgUnitId: member.orgUnitId ? String(member.orgUnitId) : null,
      teamId: member.teamId ? String(member.teamId) : null,
    };

    if (body.roleId) {
      await this.assertAssignableRole(actor, body.roleId);
      assertFineOrCoarsePermission(
        actor,
        TEAM_MEMBERS_ASSIGN_ROLE_KEY,
        "team",
        "update",
      );
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
      const departmentId = optionalId(body.departmentId);
      if (departmentId) {
        await this.assertActiveDepartment(actor, departmentId);
      }
      member.departmentId = departmentId
        ? new mongoose.Types.ObjectId(departmentId)
        : null;
    }
    if (body.orgUnitId !== undefined) {
      const orgUnitId = optionalId(body.orgUnitId);
      if (orgUnitId) {
        await this.assertActiveOrgUnit(actor, orgUnitId);
      }
      member.orgUnitId = orgUnitId
        ? new mongoose.Types.ObjectId(orgUnitId)
        : null;
    }

    const nextDepartmentId = member.departmentId
      ? String(member.departmentId)
      : null;
    const nextOrgUnitId = member.orgUnitId ? String(member.orgUnitId) : null;
    const existingTeamId = member.teamId ? String(member.teamId) : null;

    if (body.teamId !== undefined) {
      const teamId = optionalId(body.teamId);
      if (teamId) {
        await this.assertTeamAssignment({
          actor,
          teamId,
          departmentId: nextDepartmentId,
          orgUnitId: nextOrgUnitId,
          existingTeamId,
        });
        member.teamId = new mongoose.Types.ObjectId(teamId);
      } else {
        member.teamId = null;
      }
    } else if (existingTeamId) {
      await this.assertTeamAssignment({
        actor,
        teamId: existingTeamId,
        departmentId: nextDepartmentId,
        orgUnitId: nextOrgUnitId,
        existingTeamId,
        skipAssignPermission: true,
      });
    }

    await member.save();

    const nextTeamId = member.teamId ? String(member.teamId) : null;
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
        departmentId: nextDepartmentId,
        orgUnitId: nextOrgUnitId,
        teamId: nextTeamId,
      },
    });

    if (previous.teamId !== nextTeamId) {
      if (previous.teamId) {
        await recordOperationsAuditEvent({
          actorUserId: actor.userId,
          actorName: actor.roleName ?? "",
          action: "team.member_removed",
          targetType: "team",
          targetId: previous.teamId,
          targetLabel: member.fullName,
          nextState: { userId: memberId },
        });
      }
      if (nextTeamId) {
        await recordOperationsAuditEvent({
          actorUserId: actor.userId,
          actorName: actor.roleName ?? "",
          action: "team.member_added",
          targetType: "team",
          targetId: nextTeamId,
          targetLabel: member.fullName,
          nextState: { userId: memberId },
        });
      }
    }

    const extras = await this.hydrateMemberExtras(
      [member.toObject()],
      canViewMobile(actor),
    );
    return toPublicMember(member, extras.get(memberId));
  }

  async updateStatus(
    actor: OperationsResolvedAccess,
    memberId: string,
    body: UpdateOperationsTeamMemberStatusBody,
  ) {
    const fineKey =
      body.status === "active"
        ? TEAM_MEMBERS_ACTIVATE_KEY
        : TEAM_MEMBERS_DEACTIVATE_KEY;
    assertFineOrCoarsePermission(actor, fineKey, "team", "update");

    const member = await OperationsTeamUserModel.findById(memberId);
    if (!member) {
      throw new AppError("Team member not found.", HTTP_STATUS.NOT_FOUND);
    }
    await this.assertCanManageMember(actor, member);
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

    const extras = await this.hydrateMemberExtras(
      [member.toObject()],
      canViewMobile(actor),
    );
    return toPublicMember(member, extras.get(memberId));
  }

  async remove(actor: OperationsResolvedAccess, memberId: string) {
    assertFineOrCoarsePermission(actor, TEAM_MEMBERS_DELETE_KEY, "team", "delete");

    const member = await OperationsTeamUserModel.findById(memberId).select(
      "+passwordHash +refreshTokenHash",
    );
    if (!member) {
      throw new AppError("Team member not found.", HTTP_STATUS.NOT_FOUND);
    }
    await this.assertCanManageMember(actor, member);
    if (String(member._id) === actor.userId) {
      throw new AppError(
        "You cannot delete your own account.",
        HTTP_STATUS.FORBIDDEN,
      );
    }
    if (member.role === "SUPER_ADMIN") {
      throw new AppError(
        "Super Admin accounts cannot be deleted.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const previous = {
      email: member.email ?? "",
      role: member.role,
      roleId: member.roleId ? String(member.roleId) : null,
      departmentId: member.departmentId ? String(member.departmentId) : null,
      orgUnitId: member.orgUnitId ? String(member.orgUnitId) : null,
      teamId: member.teamId ? String(member.teamId) : null,
      status: member.status,
    };

    await Promise.all([
      OperationsTeamModel.updateMany(
        { leadUserId: member._id },
        { $set: { leadUserId: null }, $inc: { revision: 1 } },
      ),
      OperationsDepartmentModel.updateMany(
        { headUserId: member._id },
        { $set: { headUserId: null } },
      ),
      OperationsOrgUnitModel.updateMany(
        { headUserId: member._id },
        { $set: { headUserId: null } },
      ),
      OperationsWorkItemModel.updateMany(
        {
          assignedToUserId: member._id,
          status: { $in: [...OPEN_WORK_STATUSES] },
        },
        {
          $set: {
            assignedToUserId: null,
            assignedByUserId: null,
            assignedAt: null,
          },
          $inc: { revision: 1 },
        },
      ),
    ]);

    await OperationsTeamUserModel.deleteOne({ _id: member._id });

    await recordOperationsAuditEvent({
      actorUserId: actor.userId,
      actorName: actor.roleName ?? "",
      action: "user.deleted",
      targetType: "user",
      targetId: memberId,
      targetLabel: member.fullName,
      previousState: previous,
    });

    return { id: memberId, deleted: true as const };
  }

  async resendInvitation(
    actor: OperationsResolvedAccess,
    memberId: string,
  ) {
    assertFineOrCoarsePermission(actor, TEAM_MEMBERS_INVITE_KEY, "team", "create");

    const member = await OperationsTeamUserModel.findById(memberId).select(
      "+passwordHash +refreshTokenHash",
    );
    if (!member) {
      throw new AppError("Team member not found.", HTTP_STATUS.NOT_FOUND);
    }
    await this.assertCanManageMember(actor, member);
    if (!member.email) {
      throw new AppError(
        "This person does not have an email address.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const lastSent = member.invitationLastSentAt
      ? member.invitationLastSentAt.getTime()
      : 0;
    if (lastSent && Date.now() - lastSent < INVITATION_RESEND_COOLDOWN_MS) {
      throw new AppError(
        "Please wait before resending the invitation.",
        HTTP_STATUS.TOO_MANY_REQUESTS,
      );
    }

    const hourAgo = Date.now() - 60 * 60 * 1000;
    if (
      lastSent >= hourAgo &&
      (member.invitationResendCount ?? 0) >= INVITATION_RESEND_MAX_PER_HOUR
    ) {
      throw new AppError(
        "Invitation resend limit reached. Try again later.",
        HTTP_STATUS.TOO_MANY_REQUESTS,
      );
    }

    const role = member.roleId
      ? await OperationsRoleModel.findById(member.roleId).select("name").lean()
      : null;
    const temporaryPassword = generateOrganizationTemporaryPassword();
    member.passwordHash = await bcrypt.hash(temporaryPassword, 10);
    member.refreshTokenHash = null;
    member.refreshTokenExpiresAt = null;
    await member.save();

    const invitation = await this.deliverInvitationEmail({
      actor,
      memberId,
      fullName: member.fullName,
      email: member.email,
      roleName:
        member.role === "SUPER_ADMIN"
          ? "Super Admin"
          : role?.name ?? "Organization member",
      temporaryPassword,
      isResend: true,
    });

    const extras = await this.hydrateMemberExtras(
      [member.toObject()],
      canViewMobile(actor),
    );
    return toPublicMember(member, {
      ...extras.get(memberId),
      invitationEmailSent: invitation.sent,
      invitationEmailError: invitation.errorMessage,
    });
  }

  private async deliverInvitationEmail(input: {
    actor: OperationsResolvedAccess;
    memberId: string;
    fullName: string;
    email: string;
    roleName: string;
    temporaryPassword: string;
    isResend: boolean;
  }): Promise<{ sent: boolean; errorMessage: string | null }> {
    const result = await sendOrganizationInvitationEmail({
      toEmail: input.email,
      memberName: input.fullName,
      roleName: input.roleName,
      temporaryPassword: input.temporaryPassword,
    });

    const now = new Date();
    const errorMessage = result.errorMessage
      ? result.errorMessage.slice(0, 400)
      : null;
    const resetHourWindow = input.isResend
      ? await OperationsTeamUserModel.findById(input.memberId)
          .select("invitationLastSentAt invitationResendCount")
          .lean()
      : null;
    const lastSent = resetHourWindow?.invitationLastSentAt?.getTime() ?? 0;
    const hourAgo = Date.now() - 60 * 60 * 1000;
    const nextResendCount = input.isResend
      ? lastSent < hourAgo
        ? 1
        : (resetHourWindow?.invitationResendCount ?? 0) + 1
      : 0;

    await OperationsTeamUserModel.updateOne(
      { _id: input.memberId },
      {
        $set: {
          invitationLastSentAt: now,
          invitationEmailStatus: result.sent ? "sent" : "failed",
          invitationEmailError: errorMessage,
          invitationResendCount: nextResendCount,
          invitedAt: now,
        },
      },
    );

    await recordOperationsAuditEvent({
      actorUserId: input.actor.userId,
      actorName: input.actor.roleName ?? "",
      action: input.isResend ? "invitation.resent" : "invitation.sent",
      targetType: "user",
      targetId: input.memberId,
      targetLabel: input.fullName,
      metadata: {
        emailSent: result.sent,
        roleName: input.roleName,
      },
    });

    return { sent: result.sent, errorMessage };
  }

  private async memberScopeFilter(
    actor: OperationsResolvedAccess,
  ): Promise<Record<string, unknown>> {
    if (actor.isSuperAdmin) {
      return {};
    }
    const and: Record<string, unknown>[] = [];
    if (!actor.roleId) {
      and.push({ _id: actor.userId });
    } else {
      const descendantRoleIds = await getRoleDescendantIds(actor.roleId);
      and.push({
        $or: [
          { _id: actor.userId },
          { roleId: { $in: [actor.roleId, ...descendantRoleIds] } },
        ],
      });
    }
    if (actor.departmentId) {
      and.push({ departmentId: actor.departmentId });
    }
    const subtree = await loadActorOrgSubtreeIds(actor);
    if (subtree) {
      and.push({ orgUnitId: { $in: subtree } });
    }
    if (and.length === 1) {
      return and[0]!;
    }
    return { $and: and };
  }

  private async teamScopeFilter(
    actor: OperationsResolvedAccess,
  ): Promise<Record<string, unknown>> {
    const filter: Record<string, unknown> = { status: "active" };
    if (!actor.isSuperAdmin && actor.departmentId) {
      filter.departmentId = actor.departmentId;
    }
    const subtree = await loadActorOrgSubtreeIds(actor);
    if (subtree) {
      filter.orgUnitId = { $in: subtree };
    }
    return filter;
  }

  private async assertCanManageMember(
    actor: OperationsResolvedAccess,
    member: { _id: mongoose.Types.ObjectId; role: string },
  ): Promise<void> {
    if (member.role === "SUPER_ADMIN" && !actor.isSuperAdmin) {
      throw new AppError(
        "You cannot modify a Super Admin.",
        HTTP_STATUS.FORBIDDEN,
      );
    }
    const scope = await this.memberScopeFilter(actor);
    const visible = await OperationsTeamUserModel.exists({
      _id: member._id,
      ...scope,
    });
    if (!visible) {
      throw new AppError(
        "You cannot manage this member.",
        HTTP_STATUS.FORBIDDEN,
        { code: TEAM_ERROR_CODES.ORG_SCOPE_FORBIDDEN },
      );
    }
  }

  private async assertActiveDepartment(
    actor: OperationsResolvedAccess,
    departmentId: string,
  ): Promise<void> {
    assertFineOrCoarsePermission(
      actor,
      TEAM_MEMBERS_ASSIGN_DEPARTMENT_KEY,
      "team",
      "update",
    );
    assertActorCanAccessDepartment(actor, departmentId);
    const department = await OperationsDepartmentModel.findOne({
      _id: departmentId,
      status: "active",
    }).lean();
    if (!department) {
      throw new AppError("Department not found.", HTTP_STATUS.BAD_REQUEST);
    }
  }

  private async assertActiveOrgUnit(
    actor: OperationsResolvedAccess,
    orgUnitId: string,
  ): Promise<void> {
    assertFineOrCoarsePermission(
      actor,
      TEAM_MEMBERS_ASSIGN_LOCATION_KEY,
      "team",
      "update",
    );
    await assertActorCanAccessOrgUnit(actor, orgUnitId);
    const orgUnit = await OperationsOrgUnitModel.findOne({
      _id: orgUnitId,
      status: "active",
    }).lean();
    if (!orgUnit) {
      throw new AppError(
        "Organization unit not found.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  private async assertTeamAssignment(input: {
    actor: OperationsResolvedAccess;
    teamId: string;
    departmentId: string | null;
    orgUnitId: string | null;
    existingTeamId: string | null;
    skipAssignPermission?: boolean;
  }): Promise<void> {
    if (!input.skipAssignPermission) {
      assertFineOrCoarsePermission(
        input.actor,
        TEAM_MEMBERS_ASSIGN_TEAM_KEY,
        "team",
        "update",
      );
    }
    const team = await OperationsTeamModel.findById(input.teamId).lean();
    if (!team) {
      throw new AppError("Team not found.", HTTP_STATUS.BAD_REQUEST, {
        code: TEAM_ERROR_CODES.TEAM_NOT_FOUND,
      });
    }
    if (team.status !== "active") {
      throw new AppError("Cannot assign members to an archived team.", HTTP_STATUS.CONFLICT, {
        code: TEAM_ERROR_CODES.TEAM_INACTIVE,
      });
    }
    assertActorCanAccessDepartment(input.actor, String(team.departmentId));
    await assertActorCanAccessOrgUnit(input.actor, String(team.orgUnitId));

    if (!isDepartmentCompatible(input.departmentId, String(team.departmentId))) {
      throw new AppError(
        "People must belong to the same department as the team.",
        HTTP_STATUS.CONFLICT,
        { code: TEAM_ERROR_CODES.TEAM_DEPARTMENT_MISMATCH },
      );
    }

    if (
      input.existingTeamId &&
      input.existingTeamId !== input.teamId
    ) {
      throw new AppError(
        "This member is already assigned to another team. Remove them first.",
        HTTP_STATUS.CONFLICT,
        { code: TEAM_ERROR_CODES.TEAM_MEMBER_ALREADY_ASSIGNED },
      );
    }

    if (!input.orgUnitId) {
      return;
    }
    const [userUnit, teamUnit] = await Promise.all([
      OperationsOrgUnitModel.findById(input.orgUnitId).select("ancestorIds").lean(),
      OperationsOrgUnitModel.findById(team.orgUnitId).select("ancestorIds").lean(),
    ]);
    const compatible = isSameOrgBranch({
      userOrgUnitId: input.orgUnitId,
      userAncestorIds: (userUnit?.ancestorIds ?? []).map((id) => String(id)),
      teamOrgUnitId: String(team.orgUnitId),
      teamAncestorIds: (teamUnit?.ancestorIds ?? []).map((id) => String(id)),
    });
    if (!compatible) {
      throw new AppError(
        "People must belong to the same geographic branch as the team.",
        HTTP_STATUS.CONFLICT,
        { code: TEAM_ERROR_CODES.TEAM_LOCATION_MISMATCH },
      );
    }
  }

  private async hydrateMemberExtras(
    members: Array<{
      _id: mongoose.Types.ObjectId;
      role: string;
      roleId?: mongoose.Types.ObjectId | null;
      departmentId?: mongoose.Types.ObjectId | null;
      orgUnitId?: mongoose.Types.ObjectId | null;
      teamId?: mongoose.Types.ObjectId | null;
      mobileNumber: string;
    }>,
    showMobile: boolean,
  ): Promise<
    Map<
      string,
      {
        roleName: string | null;
        departmentName: string | null;
        orgUnitName: string | null;
        teamName: string | null;
        includeMobile?: boolean;
        mobileNumber?: string;
      }
    >
  > {
    const [roles, departments, orgUnits, teams] = await Promise.all([
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
      OperationsOrgUnitModel.find({
        _id: {
          $in: members
            .map((member) => member.orgUnitId)
            .filter((id): id is mongoose.Types.ObjectId => Boolean(id)),
        },
      })
        .select("name")
        .lean(),
      OperationsTeamModel.find({
        _id: {
          $in: members
            .map((member) => member.teamId)
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
    const orgUnitNameById = new Map(
      orgUnits.map((unit) => [String(unit._id), unit.name]),
    );
    const teamNameById = new Map(teams.map((team) => [String(team._id), team.name]));

    return new Map(
      members.map((member) => [
        String(member._id),
        {
          roleName:
            member.role === "SUPER_ADMIN"
              ? "Super Admin"
              : member.roleId
                ? roleNameById.get(String(member.roleId)) ?? null
                : member.role,
          departmentName: member.departmentId
            ? departmentNameById.get(String(member.departmentId)) ?? null
            : null,
          orgUnitName: member.orgUnitId
            ? orgUnitNameById.get(String(member.orgUnitId)) ?? null
            : null,
          teamName: member.teamId
            ? teamNameById.get(String(member.teamId)) ?? null
            : null,
          includeMobile: showMobile,
          mobileNumber: showMobile ? member.mobileNumber : undefined,
        },
      ]),
    );
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
