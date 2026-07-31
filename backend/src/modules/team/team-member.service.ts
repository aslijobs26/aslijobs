import {
  INVITATION_ALREADY_ACCEPTED_MESSAGE,
  INVITATION_CANCELLED_MESSAGE,
  INVITATION_EXPIRED_MESSAGE,
  INVITATION_INVALID_MESSAGE,
  INVITATION_REJECTED_MESSAGE,
  TEAM_INVITATION_EXPIRY_DAYS,
  type TeamAccessLevel,
  type TeamInvitationStatus,
  type TeamMemberStatus,
} from "./team.constants.js";
import {
  generateInvitationToken,
  hashInvitationToken,
  recordTeamActivity,
} from "./team-activity.service.js";
import {
  buildTeamInvitationAcceptUrl,
  sendTeamInvitationEmail,
} from "./team-invitation-email.service.js";
import { TeamActivityModel } from "./team-activity.model.js";
import { TeamInvitationModel } from "./team-invitation.model.js";
import { TeamMemberModel } from "./team-member.model.js";
import { TeamRoleModel } from "./team-role.model.js";
import { teamRoleService } from "./team-role.service.js";
import { EmployerModel } from "../employers/employer.model.js";
import type { TeamInvitationPreview } from "./member.types.js";
import type {
  AcceptInvitationInput,
  ChangeMemberRoleInput,
  InviteMemberInput,
  ListMembersQuery,
  TransferMemberDepartmentInput,
  UpdateMemberInput,
} from "./member.validation.js";
import type {
  RoleDistributionSlice,
  TeamActivityItem,
  TeamInvitationListItem,
  TeamMemberDetails,
  TeamMemberListItem,
  TeamSidebarData,
} from "./member.types.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { DepartmentModel } from "./department.model.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function invitationExpiryDate(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + TEAM_INVITATION_EXPIRY_DAYS);
  return expires;
}

function mapMember(doc: {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  designation?: string;
  status: TeamMemberStatus;
  invitationStatus?: string;
  accessLevel: TeamAccessLevel;
  lastActiveAt?: Date | null;
  joinedAt?: Date | null;
  acceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  department?: { _id: mongoose.Types.ObjectId; name: string; status: string } | null;
  role?: {
    _id: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    accessLevel: TeamAccessLevel;
    status: string;
  } | null;
}): TeamMemberListItem {
  return {
    id: String(doc._id),
    fullName: doc.fullName,
    email: doc.email,
    phone: doc.phone ?? "",
    designation: doc.designation ?? "",
    status: doc.status,
    invitationStatus: (doc.invitationStatus || "") as TeamInvitationStatus | "",
    accessLevel: doc.accessLevel,
    department: doc.department
      ? {
          id: String(doc.department._id),
          name: doc.department.name,
          status: doc.department.status,
        }
      : null,
    role: doc.role
      ? {
          id: String(doc.role._id),
          name: doc.role.name,
          description: doc.role.description ?? "",
          accessLevel: doc.role.accessLevel,
          status: doc.role.status,
        }
      : null,
    lastActiveAt: doc.lastActiveAt ? doc.lastActiveAt.toISOString() : null,
    joinedAt: doc.joinedAt ? doc.joinedAt.toISOString() : null,
    acceptedAt: doc.acceptedAt ? doc.acceptedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

class TeamMemberService {
  async listMembers(
    employerId: string,
    query: ListMembersQuery,
  ): Promise<{
    members: TeamMemberListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    await this.expirePendingInvitations(employerId);
    const employerObjectId = toObjectId(employerId);
    const match: Record<string, unknown> = {
      employerId: employerObjectId,
      isDeleted: false,
      status: { $ne: "removed" },
    };

    if (query.status) {
      match.status = query.status;
    }
    if (query.departmentId) {
      match.departmentId = toObjectId(query.departmentId);
    }
    if (query.roleId) {
      match.roleId = toObjectId(query.roleId);
    }
    if (query.invitationStatus) {
      match.invitationStatus = query.invitationStatus;
    }
    if (query.joinedFrom || query.joinedTo) {
      const joinedAt: Record<string, Date> = {};
      if (query.joinedFrom) joinedAt.$gte = new Date(query.joinedFrom);
      if (query.joinedTo) {
        const end = new Date(query.joinedTo);
        end.setHours(23, 59, 59, 999);
        joinedAt.$lte = end;
      }
      match.joinedAt = joinedAt;
    }
    if (query.lastActiveFrom || query.lastActiveTo) {
      const lastActiveAt: Record<string, Date> = {};
      if (query.lastActiveFrom) lastActiveAt.$gte = new Date(query.lastActiveFrom);
      if (query.lastActiveTo) {
        const end = new Date(query.lastActiveTo);
        end.setHours(23, 59, 59, 999);
        lastActiveAt.$lte = end;
      }
      match.lastActiveAt = lastActiveAt;
    }
    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: "departments",
          localField: "departmentId",
          foreignField: "_id",
          as: "departmentDocs",
        },
      },
      {
        $lookup: {
          from: "teamroles",
          localField: "roleId",
          foreignField: "_id",
          as: "roleDocs",
        },
      },
      {
        $addFields: {
          department: { $arrayElemAt: ["$departmentDocs", 0] },
          role: { $arrayElemAt: ["$roleDocs", 0] },
        },
      },
    ];

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), "i");
      pipeline.push({
        $match: {
          $or: [
            { fullName: regex },
            { email: regex },
            { phone: regex },
            { designation: regex },
            { "department.name": regex },
            { "role.name": regex },
          ],
        },
      });
    }

    const sortStage = this.buildSortStage(query.sort);
    const skip = (query.page - 1) * query.limit;

    pipeline.push({
      $facet: {
        items: [
          { $sort: sortStage },
          { $skip: skip },
          { $limit: query.limit },
          { $project: { departmentDocs: 0, roleDocs: 0, passwordHash: 0 } },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    const [result] = await TeamMemberModel.aggregate<{
      items: Array<Parameters<typeof mapMember>[0]>;
      totalCount: Array<{ count: number }>;
    }>(pipeline);

    const total = result?.totalCount[0]?.count ?? 0;

    return {
      members: (result?.items ?? []).map((item) => mapMember(item)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async getMember(
    employerId: string,
    memberId: string,
  ): Promise<TeamMemberDetails> {
    await this.expirePendingInvitations(employerId);
    const member = await this.findOwnedMemberOrThrow(employerId, memberId);
    const [department, role, invitations] = await Promise.all([
      member.departmentId
        ? DepartmentModel.findOne({
            _id: member.departmentId,
            employerId: toObjectId(employerId),
            isDeleted: false,
          })
            .select("_id name status")
            .lean()
        : null,
      member.roleId
        ? TeamRoleModel.findOne({
            _id: member.roleId,
            employerId: toObjectId(employerId),
            isDeleted: false,
          })
            .select("_id name description accessLevel status")
            .lean()
        : null,
      TeamInvitationModel.find({
        employerId: toObjectId(employerId),
        memberId: member._id,
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const base = mapMember({
      ...member.toObject(),
      department: department ?? null,
      role: role ?? null,
    });

    return {
      ...base,
      invitationHistory: invitations.map((invite) => ({
        id: String(invite._id),
        status: invite.status as TeamInvitationStatus,
        invitedAt: invite.createdAt.toISOString(),
        expiresAt: invite.expiresAt.toISOString(),
        acceptedAt: invite.acceptedAt ? invite.acceptedAt.toISOString() : null,
        cancelledAt: invite.cancelledAt
          ? invite.cancelledAt.toISOString()
          : null,
        resendCount: invite.resendCount ?? 0,
      })),
    };
  }

  async inviteMember(
    employerId: string,
    input: InviteMemberInput,
  ): Promise<{ member: TeamMemberListItem; invitation: TeamInvitationListItem }> {
    await teamRoleService.ensureDefaultRoles(employerId);
    const employerObjectId = toObjectId(employerId);
    const email = input.email.trim().toLowerCase();

    const existingMember = await TeamMemberModel.findOne({
      employerId: employerObjectId,
      email,
      isDeleted: false,
      status: { $ne: "removed" },
    })
      .select("_id status")
      .lean();

    if (existingMember) {
      if (existingMember.status === "invited") {
        throw new AppError(
          "A pending invitation already exists for this email.",
          HTTP_STATUS.CONFLICT,
        );
      }
      throw new AppError(
        "An active team member with this email already exists.",
        HTTP_STATUS.CONFLICT,
      );
    }

    const pendingInvite = await TeamInvitationModel.findOne({
      employerId: employerObjectId,
      email,
      status: "pending",
      isDeleted: false,
    })
      .select("_id")
      .lean();

    if (pendingInvite) {
      throw new AppError(
        "A pending invitation already exists for this email.",
        HTTP_STATUS.CONFLICT,
      );
    }

    const department = await this.findOwnedActiveDepartmentOrThrow(
      employerId,
      input.departmentId,
    );
    const role = await teamRoleService.findActiveOwnedRoleOrThrow(
      employerId,
      input.roleId,
    );

    const token = generateInvitationToken();
    const tokenHash = hashInvitationToken(token);
    const expiresAt = invitationExpiryDate();
    const accessLevel = input.accessLevel ?? role.accessLevel;

    const member = await TeamMemberModel.create({
      employerId: employerObjectId,
      departmentId: department._id,
      roleId: role._id,
      fullName: input.fullName.trim(),
      email,
      phone: input.phone?.trim() ?? "",
      designation: input.designation?.trim() ?? "",
      accessLevel,
      status: "invited",
      invitationStatus: "pending",
      invitedBy: employerObjectId,
      joinedAt: null,
      acceptedAt: null,
      lastActiveAt: null,
      isDeleted: false,
      deletedAt: null,
    });

    const invitation = await TeamInvitationModel.create({
      employerId: employerObjectId,
      memberId: member._id,
      email,
      fullName: member.fullName,
      departmentId: department._id,
      roleId: role._id,
      phone: member.phone,
      designation: member.designation,
      message: input.message?.trim() ?? "",
      tokenHash,
      status: "pending",
      expiresAt,
      invitedBy: employerObjectId,
      resendCount: 0,
      lastSentAt: new Date(),
      isDeleted: false,
      deletedAt: null,
    });

    member.invitationId = invitation._id;
    await member.save();

    await recordTeamActivity({
      employerId,
      type: "invitation_sent",
      message: `Invitation sent to ${member.fullName}`,
      memberId: member._id,
      departmentId: department._id,
      roleId: role._id,
      invitationId: invitation._id,
      actorEmployerId: employerId,
    });

    const emailContext = await this.resolveInvitationEmailContext({
      employerId,
      memberFullName: member.fullName,
      memberEmail: email,
      roleId: role._id,
      departmentId: department._id,
      personalMessage: invitation.message ?? "",
      rawToken: token,
    });

    await sendTeamInvitationEmail({
      toEmail: emailContext.toEmail,
      memberName: emailContext.memberName,
      employerName: emailContext.employerName,
      companyName: emailContext.companyName,
      roleName: emailContext.roleName,
      departmentName: emailContext.departmentName,
      personalMessage: emailContext.personalMessage,
      acceptUrl: emailContext.acceptUrl,
      expiresInDays: TEAM_INVITATION_EXPIRY_DAYS,
    });

    const details = await this.getMember(employerId, String(member._id));
    return {
      member: details,
      invitation: {
        id: String(invitation._id),
        email: invitation.email,
        fullName: invitation.fullName,
        status: invitation.status as TeamInvitationStatus,
        departmentId: String(invitation.departmentId),
        roleId: String(invitation.roleId),
        memberId: String(invitation.memberId),
        expiresAt: invitation.expiresAt.toISOString(),
        lastSentAt: invitation.lastSentAt.toISOString(),
        resendCount: invitation.resendCount,
        createdAt: invitation.createdAt.toISOString(),
      },
    };
  }

  async updateMember(
    employerId: string,
    memberId: string,
    input: UpdateMemberInput,
  ): Promise<TeamMemberListItem> {
    const member = await this.findOwnedMemberOrThrow(employerId, memberId);
    const previousDepartmentId = member.departmentId
      ? String(member.departmentId)
      : null;
    const previousRoleId = member.roleId ? String(member.roleId) : null;
    const previousStatus = member.status;

    if (input.fullName !== undefined) {
      member.fullName = input.fullName.trim();
      if (member._id) {
        await DepartmentModel.updateMany(
          {
            employerId: toObjectId(employerId),
            headMemberId: member._id,
            isDeleted: false,
          },
          { $set: { headName: member.fullName } },
        );
      }
    }
    if (input.phone !== undefined) {
      member.phone = input.phone.trim();
    }
    if (input.designation !== undefined) {
      member.designation = input.designation.trim();
    }
    if (input.accessLevel !== undefined) {
      member.accessLevel = input.accessLevel;
    }
    if (input.departmentId !== undefined) {
      const department = await this.findOwnedActiveDepartmentOrThrow(
        employerId,
        input.departmentId,
      );
      if (department.status !== "active") {
        throw new AppError(
          "Cannot assign members to an inactive department.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      member.departmentId = department._id;
    }
    if (input.roleId !== undefined) {
      const role = await teamRoleService.findActiveOwnedRoleOrThrow(
        employerId,
        input.roleId,
      );
      member.roleId = role._id;
      if (input.accessLevel === undefined) {
        member.accessLevel = role.accessLevel;
      }
    }
    if (input.status !== undefined) {
      member.status = input.status;
      if (input.status === "active" && !member.joinedAt) {
        member.joinedAt = new Date();
      }
    }

    await member.save();

    if (
      input.departmentId &&
      previousDepartmentId &&
      previousDepartmentId !== input.departmentId
    ) {
      await recordTeamActivity({
        employerId,
        type: "department_changed",
        message: `${member.fullName}'s department was updated`,
        memberId: member._id,
        departmentId: input.departmentId,
        actorEmployerId: employerId,
        metadata: { from: previousDepartmentId, to: input.departmentId },
      });
    }

    if (input.roleId && previousRoleId && previousRoleId !== input.roleId) {
      await recordTeamActivity({
        employerId,
        type: "role_changed",
        message: `${member.fullName}'s role was updated`,
        memberId: member._id,
        roleId: input.roleId,
        actorEmployerId: employerId,
        metadata: { from: previousRoleId, to: input.roleId },
      });
    }

    if (input.status && input.status !== previousStatus) {
      const type =
        input.status === "active"
          ? "member_activated"
          : input.status === "suspended"
            ? "member_suspended"
            : "member_deactivated";
      await recordTeamActivity({
        employerId,
        type,
        message: `${member.fullName} was set to ${input.status}`,
        memberId: member._id,
        actorEmployerId: employerId,
      });
    } else if (
      input.fullName !== undefined ||
      input.phone !== undefined ||
      input.designation !== undefined ||
      input.accessLevel !== undefined
    ) {
      await recordTeamActivity({
        employerId,
        type: "member_updated",
        message: `${member.fullName}'s profile was updated`,
        memberId: member._id,
        actorEmployerId: employerId,
      });
    }

    return this.getMember(employerId, memberId);
  }

  async transferDepartment(
    employerId: string,
    memberId: string,
    input: TransferMemberDepartmentInput,
  ): Promise<TeamMemberListItem> {
    return this.updateMember(employerId, memberId, {
      departmentId: input.departmentId,
    });
  }

  async changeRole(
    employerId: string,
    memberId: string,
    input: ChangeMemberRoleInput,
  ): Promise<TeamMemberListItem> {
    return this.updateMember(employerId, memberId, {
      roleId: input.roleId,
    });
  }

  async setMemberStatus(
    employerId: string,
    memberId: string,
    status: "active" | "inactive" | "suspended",
  ): Promise<TeamMemberListItem> {
    return this.updateMember(employerId, memberId, { status });
  }

  async removeMember(
    employerId: string,
    memberId: string,
  ): Promise<{ id: string }> {
    const member = await this.findOwnedMemberOrThrow(employerId, memberId);

    await DepartmentModel.updateMany(
      {
        employerId: toObjectId(employerId),
        headMemberId: member._id,
        isDeleted: false,
      },
      { $set: { headMemberId: null, headName: "" } },
    );

    await TeamInvitationModel.updateMany(
      {
        employerId: toObjectId(employerId),
        memberId: member._id,
        status: "pending",
        isDeleted: false,
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      },
    );

    member.status = "removed";
    member.invitationStatus = member.invitationStatus === "pending" ? "cancelled" : member.invitationStatus;
    member.isDeleted = true;
    member.deletedAt = new Date();
    await member.save();

    await recordTeamActivity({
      employerId,
      type: "member_removed",
      message: `${member.fullName} was removed from the team`,
      memberId: member._id,
      actorEmployerId: employerId,
    });

    return { id: String(member._id) };
  }

  async resendInvitation(
    employerId: string,
    memberId: string,
  ): Promise<TeamInvitationListItem> {
    const member = await this.findOwnedMemberOrThrow(employerId, memberId);
    if (member.status !== "invited") {
      throw new AppError(
        "Only invited members can receive a resent invitation.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    let invitation = await TeamInvitationModel.findOne({
      employerId: toObjectId(employerId),
      memberId: member._id,
      isDeleted: false,
      status: { $in: ["pending", "expired"] },
    }).sort({ createdAt: -1 });

    if (!invitation) {
      throw new AppError("Invitation not found", HTTP_STATUS.NOT_FOUND);
    }

    const token = generateInvitationToken();
    invitation.tokenHash = hashInvitationToken(token);
    invitation.status = "pending";
    invitation.expiresAt = invitationExpiryDate();
    invitation.lastSentAt = new Date();
    invitation.resendCount = (invitation.resendCount ?? 0) + 1;
    invitation.cancelledAt = null;
    await invitation.save();

    member.invitationStatus = "pending";
    member.invitationId = invitation._id;
    await member.save();

    await recordTeamActivity({
      employerId,
      type: "invitation_resent",
      message: `Invitation resent to ${member.fullName}`,
      memberId: member._id,
      invitationId: invitation._id,
      actorEmployerId: employerId,
    });

    const emailContext = await this.resolveInvitationEmailContext({
      employerId,
      memberFullName: member.fullName,
      memberEmail: member.email,
      roleId: invitation.roleId,
      departmentId: invitation.departmentId,
      personalMessage: invitation.message ?? "",
      rawToken: token,
    });

    await sendTeamInvitationEmail({
      toEmail: emailContext.toEmail,
      memberName: emailContext.memberName,
      employerName: emailContext.employerName,
      companyName: emailContext.companyName,
      roleName: emailContext.roleName,
      departmentName: emailContext.departmentName,
      personalMessage: emailContext.personalMessage,
      acceptUrl: emailContext.acceptUrl,
      expiresInDays: TEAM_INVITATION_EXPIRY_DAYS,
    });

    return {
      id: String(invitation._id),
      email: invitation.email,
      fullName: invitation.fullName,
      status: invitation.status as TeamInvitationStatus,
      departmentId: String(invitation.departmentId),
      roleId: String(invitation.roleId),
      memberId: String(invitation.memberId),
      expiresAt: invitation.expiresAt.toISOString(),
      lastSentAt: invitation.lastSentAt.toISOString(),
      resendCount: invitation.resendCount,
      createdAt: invitation.createdAt.toISOString(),
    };
  }

  async cancelInvitation(
    employerId: string,
    memberId: string,
  ): Promise<TeamMemberListItem> {
    const member = await this.findOwnedMemberOrThrow(employerId, memberId);
    if (member.status !== "invited") {
      throw new AppError(
        "Only pending invitations can be cancelled.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    await TeamInvitationModel.updateMany(
      {
        employerId: toObjectId(employerId),
        memberId: member._id,
        status: "pending",
        isDeleted: false,
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      },
    );

    member.invitationStatus = "cancelled";
    member.status = "inactive";
    await member.save();

    await recordTeamActivity({
      employerId,
      type: "invitation_cancelled",
      message: `Invitation cancelled for ${member.fullName}`,
      memberId: member._id,
      actorEmployerId: employerId,
    });

    return this.getMember(employerId, memberId);
  }

  async deleteInvitationHistory(
    employerId: string,
    invitationId: string,
  ): Promise<{ id: string }> {
    const invitation = await TeamInvitationModel.findOne({
      _id: invitationId,
      employerId: toObjectId(employerId),
      isDeleted: false,
    });

    if (!invitation) {
      throw new AppError("Invitation not found", HTTP_STATUS.NOT_FOUND);
    }

    if (invitation.status === "pending") {
      throw new AppError(
        "Cancel the pending invitation before deleting history.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    invitation.isDeleted = true;
    invitation.deletedAt = new Date();
    await invitation.save();
    return { id: String(invitation._id) };
  }

  async previewInvitation(token: string): Promise<TeamInvitationPreview> {
    const tokenHash = hashInvitationToken(token);
    const invitation = await TeamInvitationModel.findOne({
      tokenHash,
      isDeleted: false,
    }).lean();

    if (!invitation) {
      return {
        state: "invalid",
        message: INVITATION_INVALID_MESSAGE,
        fullName: null,
        email: null,
        companyName: null,
        roleName: null,
        departmentName: null,
        expiresAt: null,
      };
    }

    const [employer, role, department, member] = await Promise.all([
      EmployerModel.findById(invitation.employerId)
        .select("companyName establishmentName firstName lastName")
        .lean(),
      TeamRoleModel.findById(invitation.roleId).select("name").lean(),
      DepartmentModel.findById(invitation.departmentId).select("name").lean(),
      TeamMemberModel.findOne({
        _id: invitation.memberId,
        isDeleted: false,
      })
        .select("_id")
        .lean(),
    ]);

    if (!member) {
      return {
        state: "invalid",
        message: INVITATION_INVALID_MESSAGE,
        fullName: null,
        email: null,
        companyName: null,
        roleName: null,
        departmentName: null,
        expiresAt: null,
      };
    }

    const companyName =
      employer?.companyName?.trim() ||
      employer?.establishmentName?.trim() ||
      "your company on AsliJobs";

    const base = {
      fullName: invitation.fullName,
      email: invitation.email,
      companyName,
      roleName: role?.name?.trim() || "Team Member",
      departmentName: department?.name?.trim() || "General",
      expiresAt: invitation.expiresAt.toISOString(),
    };

    if (invitation.status === "accepted") {
      return {
        state: "accepted",
        message: INVITATION_ALREADY_ACCEPTED_MESSAGE,
        ...base,
      };
    }

    if (invitation.status === "cancelled") {
      return {
        state: "cancelled",
        message: INVITATION_CANCELLED_MESSAGE,
        ...base,
      };
    }

    if (invitation.status === "rejected") {
      return {
        state: "rejected",
        message: INVITATION_REJECTED_MESSAGE,
        ...base,
      };
    }

    if (
      invitation.status === "expired" ||
      invitation.expiresAt.getTime() <= Date.now()
    ) {
      if (invitation.status === "pending") {
        await TeamInvitationModel.updateOne(
          { _id: invitation._id, status: "pending" },
          { $set: { status: "expired" } },
        );
        await TeamMemberModel.updateOne(
          { _id: invitation.memberId, status: "invited" },
          { $set: { invitationStatus: "expired" } },
        );
      }

      return {
        state: "expired",
        message: INVITATION_EXPIRED_MESSAGE,
        ...base,
      };
    }

    if (invitation.status !== "pending") {
      return {
        state: "invalid",
        message: INVITATION_INVALID_MESSAGE,
        ...base,
      };
    }

    return {
      state: "valid",
      message: "Invitation is valid.",
      ...base,
    };
  }

  async acceptInvitation(
    input: AcceptInvitationInput,
  ): Promise<{ memberId: string; employerId: string }> {
    const tokenHash = hashInvitationToken(input.token);
    const invitation = await TeamInvitationModel.findOne({
      tokenHash,
      isDeleted: false,
    });

    if (!invitation) {
      throw new AppError(INVITATION_INVALID_MESSAGE, HTTP_STATUS.BAD_REQUEST);
    }

    this.assertInvitationAcceptable({
      status: invitation.status as TeamInvitationStatus,
      expiresAt: invitation.expiresAt,
    });

    if (invitation.expiresAt.getTime() <= Date.now()) {
      invitation.status = "expired";
      await invitation.save();
      await TeamMemberModel.updateOne(
        { _id: invitation.memberId },
        { $set: { invitationStatus: "expired" } },
      );
      throw new AppError(INVITATION_EXPIRED_MESSAGE, HTTP_STATUS.GONE);
    }

    const member = await TeamMemberModel.findOne({
      _id: invitation.memberId,
      employerId: invitation.employerId,
      isDeleted: false,
      status: "invited",
    }).select("+passwordHash");

    if (!member) {
      throw new AppError(INVITATION_INVALID_MESSAGE, HTTP_STATUS.BAD_REQUEST);
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(input.password, 12);
    member.fullName = input.fullName.trim();
    member.passwordHash = passwordHash;
    member.status = "active";
    member.invitationStatus = "accepted";
    member.acceptedAt = now;
    member.joinedAt = now;
    member.lastActiveAt = now;
    await member.save();

    invitation.status = "accepted";
    invitation.acceptedAt = now;
    await invitation.save();

    await recordTeamActivity({
      employerId: invitation.employerId,
      type: "invitation_accepted",
      message: `${member.fullName} accepted the invitation`,
      memberId: member._id,
      invitationId: invitation._id,
      departmentId: invitation.departmentId,
      roleId: invitation.roleId,
    });

    await recordTeamActivity({
      employerId: invitation.employerId,
      type: "member_activated",
      message: `${member.fullName} activated their account`,
      memberId: member._id,
      invitationId: invitation._id,
      departmentId: invitation.departmentId,
      roleId: invitation.roleId,
    });

    return {
      memberId: String(member._id),
      employerId: String(invitation.employerId),
    };
  }

  async getSidebar(employerId: string): Promise<TeamSidebarData> {
    await teamRoleService.ensureDefaultRoles(employerId);
    const employerObjectId = toObjectId(employerId);

    const [distribution, activities] = await Promise.all([
      TeamMemberModel.aggregate<{
        _id: mongoose.Types.ObjectId | null;
        count: number;
      }>([
        {
          $match: {
            employerId: employerObjectId,
            isDeleted: false,
            status: { $in: ["active", "invited", "inactive", "suspended"] },
          },
        },
        { $group: { _id: "$roleId", count: { $sum: 1 } } },
      ]),
      TeamActivityModel.find({ employerId: employerObjectId })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    const roleIds = distribution
      .map((item) => item._id)
      .filter((id): id is mongoose.Types.ObjectId => Boolean(id));
    const roles = await TeamRoleModel.find({
      _id: { $in: roleIds },
      employerId: employerObjectId,
    })
      .select("_id name")
      .lean();
    const roleNameMap = new Map(roles.map((role) => [String(role._id), role.name]));

    const slices: RoleDistributionSlice[] = distribution
      .filter((item) => item._id)
      .map((item) => ({
        roleId: String(item._id),
        roleName: roleNameMap.get(String(item._id)) ?? "Unknown",
        count: item.count,
        percentage:
          total === 0 ? 0 : Math.round((item.count / total) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      roleDistribution: { total, slices },
      recentActivity: activities.map(
        (item): TeamActivityItem => ({
          id: String(item._id),
          type: item.type,
          message: item.message,
          createdAt: item.createdAt.toISOString(),
          memberId: item.memberId ? String(item.memberId) : null,
        }),
      ),
    };
  }

  private buildSortStage(
    sort: ListMembersQuery["sort"],
  ): Record<string, 1 | -1> {
    switch (sort) {
      case "name_asc":
        return { fullName: 1 };
      case "name_desc":
        return { fullName: -1 };
      case "department":
        return { "department.name": 1, fullName: 1 };
      case "role":
        return { "role.name": 1, fullName: 1 };
      case "joined_oldest":
        return { joinedAt: 1, createdAt: 1 };
      case "last_active_newest":
        return { lastActiveAt: -1 };
      case "last_active_oldest":
        return { lastActiveAt: 1 };
      case "status":
        return { status: 1, fullName: 1 };
      case "joined_newest":
      default:
        return { createdAt: -1 };
    }
  }

  private async expirePendingInvitations(employerId: string): Promise<void> {
    const now = new Date();
    const expired = await TeamInvitationModel.find({
      employerId: toObjectId(employerId),
      status: "pending",
      isDeleted: false,
      expiresAt: { $lt: now },
    })
      .select("_id memberId")
      .lean();

    if (expired.length === 0) {
      return;
    }

    const invitationIds = expired.map((item) => item._id);
    const memberIds = expired.map((item) => item.memberId);

    await TeamInvitationModel.updateMany(
      { _id: { $in: invitationIds } },
      { $set: { status: "expired" } },
    );
    await TeamMemberModel.updateMany(
      {
        _id: { $in: memberIds },
        employerId: toObjectId(employerId),
        status: "invited",
        isDeleted: false,
      },
      { $set: { invitationStatus: "expired" } },
    );
  }

  private async findOwnedActiveDepartmentOrThrow(
    employerId: string,
    departmentId: string,
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(employerId) ||
      !mongoose.Types.ObjectId.isValid(departmentId)
    ) {
      throw new AppError(
        "Department not found or inactive.",
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const department = await DepartmentModel.findOne({
      _id: departmentId,
      employerId: toObjectId(employerId),
      status: "active",
      isDeleted: false,
    });

    if (!department) {
      throw new AppError(
        "Department not found or inactive.",
        HTTP_STATUS.NOT_FOUND,
      );
    }

    return department;
  }

  private async resolveInvitationEmailContext(params: {
    employerId: string;
    memberFullName: string;
    memberEmail: string;
    roleId: mongoose.Types.ObjectId | string;
    departmentId: mongoose.Types.ObjectId | string;
    personalMessage: string;
    rawToken: string;
  }) {
    const [employer, role, department] = await Promise.all([
      EmployerModel.findById(params.employerId)
        .select("companyName establishmentName firstName lastName")
        .lean(),
      TeamRoleModel.findById(params.roleId).select("name").lean(),
      DepartmentModel.findById(params.departmentId).select("name").lean(),
    ]);

    const companyName =
      employer?.companyName?.trim() ||
      employer?.establishmentName?.trim() ||
      "your company on AsliJobs";
    const employerName =
      [employer?.firstName, employer?.lastName].filter(Boolean).join(" ").trim() ||
      companyName;

    return {
      toEmail: params.memberEmail,
      memberName: params.memberFullName,
      employerName,
      companyName,
      roleName: role?.name?.trim() || "Team Member",
      departmentName: department?.name?.trim() || "General",
      personalMessage: params.personalMessage,
      acceptUrl: buildTeamInvitationAcceptUrl(params.rawToken),
    };
  }

  private assertInvitationAcceptable(invitation: {
    status: TeamInvitationStatus;
    expiresAt: Date;
  }): void {
    if (invitation.status === "accepted") {
      throw new AppError(
        INVITATION_ALREADY_ACCEPTED_MESSAGE,
        HTTP_STATUS.CONFLICT,
      );
    }

    if (invitation.status === "cancelled") {
      throw new AppError(INVITATION_CANCELLED_MESSAGE, HTTP_STATUS.GONE);
    }

    if (invitation.status === "rejected") {
      throw new AppError(INVITATION_REJECTED_MESSAGE, HTTP_STATUS.GONE);
    }

    if (invitation.status === "expired") {
      throw new AppError(INVITATION_EXPIRED_MESSAGE, HTTP_STATUS.GONE);
    }

    if (invitation.status !== "pending") {
      throw new AppError(INVITATION_INVALID_MESSAGE, HTTP_STATUS.BAD_REQUEST);
    }
  }

  private async findOwnedMemberOrThrow(employerId: string, memberId: string) {
    if (
      !mongoose.Types.ObjectId.isValid(employerId) ||
      !mongoose.Types.ObjectId.isValid(memberId)
    ) {
      throw new AppError("Team member not found", HTTP_STATUS.NOT_FOUND);
    }

    const member = await TeamMemberModel.findOne({
      _id: memberId,
      employerId: toObjectId(employerId),
      isDeleted: false,
    });

    if (!member || member.status === "removed") {
      throw new AppError("Team member not found", HTTP_STATUS.NOT_FOUND);
    }

    return member;
  }
}

export const teamMemberService = new TeamMemberService();
