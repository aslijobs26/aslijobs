import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { DepartmentModel } from "./department.model.js";
import type {
  DepartmentDetails,
  DepartmentListItem,
  PaginationMeta,
  TeamMemberOption,
  TeamStats,
} from "./department.types.js";
import type {
  CreateDepartmentInput,
  ListDepartmentsQuery,
  ListMemberOptionsQuery,
  UpdateDepartmentInput,
} from "./department.validation.js";
import {
  DEPARTMENT_DELETE_BLOCKED_MESSAGE,
  type DepartmentColor,
  type DepartmentIcon,
  type DepartmentStatus,
} from "./team.constants.js";
import { recordTeamActivity } from "./team-activity.service.js";
import { TeamMemberModel } from "./team-member.model.js";
import { TeamRoleModel } from "./team-role.model.js";
import { teamRoleService } from "./team-role.service.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

function mapDepartmentListItem(doc: {
  _id: mongoose.Types.ObjectId;
  name: string;
  code?: string;
  description?: string;
  status: DepartmentStatus;
  color?: string;
  icon?: string;
  email?: string;
  phone?: string;
  headMemberId?: mongoose.Types.ObjectId | null;
  headName?: string;
  memberCount?: number;
  createdAt: Date;
  updatedAt: Date;
  head?: {
    _id: mongoose.Types.ObjectId;
    fullName: string;
    email: string;
    status: string;
  } | null;
}): DepartmentListItem {
  const headDoc = doc.head ?? null;
  return {
    id: String(doc._id),
    name: doc.name,
    code: doc.code ?? "",
    description: doc.description ?? "",
    status: doc.status,
    color: (doc.color ?? "primary") as DepartmentColor | "",
    icon: (doc.icon ?? "building") as DepartmentIcon | "",
    email: doc.email ?? "",
    phone: doc.phone ?? "",
    head: headDoc
      ? {
          id: String(headDoc._id),
          fullName: headDoc.fullName,
          email: headDoc.email,
          status: headDoc.status,
        }
      : doc.headMemberId
        ? {
            id: String(doc.headMemberId),
            fullName: doc.headName || "Team Member",
            email: "",
            status: "active",
          }
        : null,
    memberCount: doc.memberCount ?? 0,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

class DepartmentService {
  async getStats(employerId: string): Promise<TeamStats> {
    const employerObjectId = toObjectId(employerId);
    await teamRoleService.ensureDefaultRoles(employerId);

    const [departmentCount, roleCount, memberStats] = await Promise.all([
      DepartmentModel.countDocuments({
        employerId: employerObjectId,
        isDeleted: false,
      }),
      TeamRoleModel.countDocuments({
        employerId: employerObjectId,
        isDeleted: false,
      }),
      TeamMemberModel.aggregate<{
        _id: null;
        totalMembers: number;
        activeMembers: number;
        pendingInvitations: number;
      }>([
        {
          $match: {
            employerId: employerObjectId,
            isDeleted: false,
            status: { $ne: "removed" },
          },
        },
        {
          $group: {
            _id: null,
            totalMembers: { $sum: 1 },
            activeMembers: {
              $sum: {
                $cond: [{ $eq: ["$status", "active"] }, 1, 0],
              },
            },
            pendingInvitations: {
              $sum: {
                $cond: [{ $eq: ["$status", "invited"] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const counts = memberStats[0];

    return {
      totalMembers: counts?.totalMembers ?? 0,
      activeMembers: counts?.activeMembers ?? 0,
      roles: roleCount,
      pendingInvitations: counts?.pendingInvitations ?? 0,
      departments: departmentCount,
    };
  }

  async listMemberOptions(
    employerId: string,
    query: ListMemberOptionsQuery,
  ): Promise<TeamMemberOption[]> {
    const filter: Record<string, unknown> = {
      employerId: toObjectId(employerId),
      isDeleted: false,
      status: query.status,
    };

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), "i");
      filter.$or = [{ fullName: regex }, { email: regex }];
    }

    const members = await TeamMemberModel.find(filter)
      .select("_id fullName email status")
      .sort({ fullName: 1 })
      .limit(100)
      .lean();

    return members.map((member) => ({
      id: String(member._id),
      fullName: member.fullName,
      email: member.email,
      status: member.status,
    }));
  }

  async createDepartment(
    employerId: string,
    input: CreateDepartmentInput,
  ): Promise<DepartmentListItem> {
    const employerObjectId = toObjectId(employerId);
    const name = input.name.trim();
    const nameLower = name.toLowerCase();
    const code = input.code?.trim() ?? "";
    const codeLower = code.toLowerCase();

    await this.assertUniqueName(employerObjectId, nameLower);
    if (codeLower) {
      await this.assertUniqueCode(employerObjectId, codeLower);
    }

    const head = await this.resolveHeadMember(
      employerObjectId,
      input.headMemberId,
    );

    const created = await DepartmentModel.create({
      employerId: employerObjectId,
      name,
      nameLower,
      code,
      codeLower,
      description: input.description?.trim() ?? "",
      headMemberId: head?.id ? toObjectId(head.id) : null,
      headName: head?.fullName ?? "",
      email: input.email?.trim() ?? "",
      phone: input.phone?.trim() ?? "",
      status: input.status,
      color: input.color,
      icon: input.icon,
      createdBy: employerObjectId,
      updatedBy: employerObjectId,
      isDeleted: false,
      deletedAt: null,
    });

    await recordTeamActivity({
      employerId,
      type: "department_created",
      message: `Department "${name}" created`,
      departmentId: created._id,
      actorEmployerId: employerId,
    });

    return mapDepartmentListItem({
      ...created.toObject(),
      memberCount: 0,
      head: head
        ? {
            _id: toObjectId(head.id),
            fullName: head.fullName,
            email: head.email,
            status: head.status,
          }
        : null,
    });
  }

  async listDepartments(
    employerId: string,
    query: ListDepartmentsQuery,
  ): Promise<{ departments: DepartmentListItem[]; pagination: PaginationMeta }> {
    const employerObjectId = toObjectId(employerId);
    const match: Record<string, unknown> = {
      employerId: employerObjectId,
      isDeleted: false,
    };

    if (query.status) {
      match.status = query.status;
    }

    if (query.headMemberId) {
      match.headMemberId = toObjectId(query.headMemberId);
    }

    if (query.createdFrom || query.createdTo) {
      const createdAt: Record<string, Date> = {};
      if (query.createdFrom) {
        createdAt.$gte = new Date(query.createdFrom);
      }
      if (query.createdTo) {
        const end = new Date(query.createdTo);
        end.setHours(23, 59, 59, 999);
        createdAt.$lte = end;
      }
      match.createdAt = createdAt;
    }

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), "i");
      match.$or = [
        { name: regex },
        { code: regex },
        { description: regex },
        { headName: regex },
      ];
    }

    const sortStage = this.buildSortStage(query.sort);
    const skip = (query.page - 1) * query.limit;

    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: "teammembers",
          let: { departmentId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$departmentId", "$$departmentId"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "memberStats",
        },
      },
      {
        $addFields: {
          memberCount: {
            $ifNull: [{ $arrayElemAt: ["$memberStats.count", 0] }, 0],
          },
        },
      },
    ];

    if (
      query.memberCountMin !== undefined ||
      query.memberCountMax !== undefined
    ) {
      const memberCountFilter: Record<string, number> = {};
      if (query.memberCountMin !== undefined) {
        memberCountFilter.$gte = query.memberCountMin;
      }
      if (query.memberCountMax !== undefined) {
        memberCountFilter.$lte = query.memberCountMax;
      }
      pipeline.push({ $match: { memberCount: memberCountFilter } });
    }

    pipeline.push(
      {
        $lookup: {
          from: "teammembers",
          localField: "headMemberId",
          foreignField: "_id",
          as: "headDocs",
        },
      },
      {
        $addFields: {
          head: { $arrayElemAt: ["$headDocs", 0] },
        },
      },
      {
        $facet: {
          items: [
            { $sort: sortStage },
            { $skip: skip },
            { $limit: query.limit },
            {
              $project: {
                memberStats: 0,
                headDocs: 0,
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    );

    const [result] = await DepartmentModel.aggregate<{
      items: Array<{
        _id: mongoose.Types.ObjectId;
        name: string;
        code?: string;
        description?: string;
        status: DepartmentStatus;
        color?: string;
        icon?: string;
        email?: string;
        phone?: string;
        headMemberId?: mongoose.Types.ObjectId | null;
        headName?: string;
        memberCount: number;
        createdAt: Date;
        updatedAt: Date;
        head?: {
          _id: mongoose.Types.ObjectId;
          fullName: string;
          email: string;
          status: string;
        } | null;
      }>;
      totalCount: Array<{ count: number }>;
    }>(pipeline);

    const total = result?.totalCount[0]?.count ?? 0;
    const departments = (result?.items ?? []).map((item) =>
      mapDepartmentListItem(item),
    );

    return {
      departments,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async getDepartment(
    employerId: string,
    departmentId: string,
  ): Promise<DepartmentListItem> {
    const department = await this.findOwnedDepartmentOrThrow(
      employerId,
      departmentId,
    );
    const [memberCount, head] = await Promise.all([
      TeamMemberModel.countDocuments({
        employerId: toObjectId(employerId),
        departmentId: department._id,
        isDeleted: false,
      }),
      department.headMemberId
        ? TeamMemberModel.findOne({
            _id: department.headMemberId,
            employerId: toObjectId(employerId),
            isDeleted: false,
          })
            .select("_id fullName email status")
            .lean()
        : Promise.resolve(null),
    ]);

    return mapDepartmentListItem({
      ...department.toObject(),
      memberCount,
      head: head
        ? {
            _id: head._id,
            fullName: head.fullName,
            email: head.email,
            status: head.status,
          }
        : null,
    });
  }

  async getDepartmentDetails(
    employerId: string,
    departmentId: string,
  ): Promise<DepartmentDetails> {
    const department = await this.findOwnedDepartmentOrThrow(
      employerId,
      departmentId,
    );
    const employerObjectId = toObjectId(employerId);

    const [memberStats, head] = await Promise.all([
      TeamMemberModel.aggregate<{
        _id: null;
        memberCount: number;
        activeMemberCount: number;
        pendingInvitationCount: number;
      }>([
        {
          $match: {
            employerId: employerObjectId,
            departmentId: department._id,
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,
            memberCount: { $sum: 1 },
            activeMemberCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "active"] }, 1, 0],
              },
            },
            pendingInvitationCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "invited"] }, 1, 0],
              },
            },
          },
        },
      ]),
      department.headMemberId
        ? TeamMemberModel.findOne({
            _id: department.headMemberId,
            employerId: employerObjectId,
            isDeleted: false,
          })
            .select("_id fullName email status")
            .lean()
        : Promise.resolve(null),
    ]);

    const counts = memberStats[0];
    const base = mapDepartmentListItem({
      ...department.toObject(),
      memberCount: counts?.memberCount ?? 0,
      head: head
        ? {
            _id: head._id,
            fullName: head.fullName,
            email: head.email,
            status: head.status,
          }
        : null,
    });

    return {
      ...base,
      activeMemberCount: counts?.activeMemberCount ?? 0,
      pendingInvitationCount: counts?.pendingInvitationCount ?? 0,
      createdBy: String(department.createdBy),
      updatedBy: String(department.updatedBy),
    };
  }

  async updateDepartment(
    employerId: string,
    departmentId: string,
    input: UpdateDepartmentInput,
  ): Promise<DepartmentListItem> {
    const department = await this.findOwnedDepartmentOrThrow(
      employerId,
      departmentId,
    );
    const employerObjectId = toObjectId(employerId);

    if (input.name !== undefined) {
      const name = input.name.trim();
      const nameLower = name.toLowerCase();
      if (nameLower !== department.nameLower) {
        await this.assertUniqueName(
          employerObjectId,
          nameLower,
          department._id,
        );
      }
      department.name = name;
      department.nameLower = nameLower;
    }

    if (input.code !== undefined) {
      const code = input.code.trim();
      const codeLower = code.toLowerCase();
      if (codeLower && codeLower !== department.codeLower) {
        await this.assertUniqueCode(
          employerObjectId,
          codeLower,
          department._id,
        );
      }
      department.code = code;
      department.codeLower = codeLower;
    }

    if (input.description !== undefined) {
      department.description = input.description.trim();
    }

    if (input.email !== undefined) {
      department.email = input.email.trim();
    }

    if (input.phone !== undefined) {
      department.phone = input.phone.trim();
    }

    if (input.status !== undefined) {
      department.status = input.status;
    }

    if (input.color !== undefined) {
      department.color = input.color;
    }

    if (input.icon !== undefined) {
      department.icon = input.icon;
    }

    if (input.headMemberId !== undefined) {
      const head = await this.resolveHeadMember(
        employerObjectId,
        input.headMemberId,
      );
      department.headMemberId = head?.id ? toObjectId(head.id) : null;
      department.headName = head?.fullName ?? "";
    }

    department.updatedBy = employerObjectId;
    await department.save();

    await recordTeamActivity({
      employerId,
      type: "department_updated",
      message: `Department "${department.name}" updated`,
      departmentId: department._id,
      actorEmployerId: employerId,
    });

    return this.getDepartment(employerId, departmentId);
  }

  async deactivateDepartment(
    employerId: string,
    departmentId: string,
  ): Promise<DepartmentListItem> {
    const department = await this.findOwnedDepartmentOrThrow(
      employerId,
      departmentId,
    );
    department.status = "inactive";
    department.updatedBy = toObjectId(employerId);
    await department.save();
    return this.getDepartment(employerId, departmentId);
  }

  async deleteDepartment(
    employerId: string,
    departmentId: string,
  ): Promise<{ id: string }> {
    const department = await this.findOwnedDepartmentOrThrow(
      employerId,
      departmentId,
    );

    const memberCount = await TeamMemberModel.countDocuments({
      employerId: toObjectId(employerId),
      departmentId: department._id,
      isDeleted: false,
    });

    if (memberCount > 0) {
      throw new AppError(
        DEPARTMENT_DELETE_BLOCKED_MESSAGE,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    department.isDeleted = true;
    department.deletedAt = new Date();
    department.updatedBy = toObjectId(employerId);
    await department.save();

    await recordTeamActivity({
      employerId,
      type: "department_deleted",
      message: `Department "${department.name}" deleted`,
      departmentId: department._id,
      actorEmployerId: employerId,
    });

    return { id: String(department._id) };
  }

  private buildSortStage(
    sort: ListDepartmentsQuery["sort"],
  ): Record<string, 1 | -1> {
    switch (sort) {
      case "oldest":
        return { createdAt: 1 };
      case "name_asc":
        return { nameLower: 1 };
      case "name_desc":
        return { nameLower: -1 };
      case "members_asc":
        return { memberCount: 1, nameLower: 1 };
      case "members_desc":
        return { memberCount: -1, nameLower: 1 };
      case "newest":
      default:
        return { createdAt: -1 };
    }
  }

  private async assertUniqueName(
    employerId: mongoose.Types.ObjectId,
    nameLower: string,
    excludeId?: mongoose.Types.ObjectId,
  ): Promise<void> {
    const existing = await DepartmentModel.findOne({
      employerId,
      nameLower,
      isDeleted: false,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .select("_id")
      .lean();

    if (existing) {
      throw new AppError(
        "A department with this name already exists.",
        HTTP_STATUS.CONFLICT,
      );
    }
  }

  private async assertUniqueCode(
    employerId: mongoose.Types.ObjectId,
    codeLower: string,
    excludeId?: mongoose.Types.ObjectId,
  ): Promise<void> {
    const existing = await DepartmentModel.findOne({
      employerId,
      codeLower,
      isDeleted: false,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .select("_id")
      .lean();

    if (existing) {
      throw new AppError(
        "A department with this code already exists.",
        HTTP_STATUS.CONFLICT,
      );
    }
  }

  private async resolveHeadMember(
    employerId: mongoose.Types.ObjectId,
    headMemberId: string | null | undefined,
  ): Promise<TeamMemberOption | null> {
    if (!headMemberId) {
      return null;
    }

    const member = await TeamMemberModel.findOne({
      _id: toObjectId(headMemberId),
      employerId,
      isDeleted: false,
    })
      .select("_id fullName email status")
      .lean();

    if (!member) {
      throw new AppError(
        "Department head must be an existing team member.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (member.status !== "active") {
      throw new AppError(
        "Department head must be an active team member.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    return {
      id: String(member._id),
      fullName: member.fullName,
      email: member.email,
      status: member.status,
    };
  }

  private async findOwnedDepartmentOrThrow(
    employerId: string,
    departmentId: string,
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(employerId) ||
      !mongoose.Types.ObjectId.isValid(departmentId)
    ) {
      throw new AppError("Department not found", HTTP_STATUS.NOT_FOUND);
    }

    const department = await DepartmentModel.findOne({
      _id: departmentId,
      employerId: toObjectId(employerId),
      isDeleted: false,
    });

    if (!department) {
      throw new AppError("Department not found", HTTP_STATUS.NOT_FOUND);
    }

    return department;
  }
}

export const departmentService = new DepartmentService();
