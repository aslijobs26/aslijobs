import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import type { PaginationMeta } from "./department.types.js";
import type { TeamRoleSummary } from "./member.types.js";
import {
  DEFAULT_TEAM_ROLES,
  ROLE_DELETE_BLOCKED_MESSAGE,
  SYSTEM_ROLE_DELETE_BLOCKED_MESSAGE,
  type TeamAccessLevel,
  type TeamRoleColor,
  type TeamRoleIcon,
  type TeamRoleListSort,
  type TeamRoleStatus,
} from "./team.constants.js";
import { TeamActivityModel } from "./team-activity.model.js";
import { recordTeamActivity } from "./team-activity.service.js";
import { TeamMemberModel } from "./team-member.model.js";
import {
  createPermissionsForAccessLevel,
  normalizePermissionsMatrix,
  TEAM_PERMISSION_ACTIONS,
  TEAM_PERMISSION_MODULE_LABELS,
  TEAM_PERMISSION_MODULES,
  type RoleFieldAccessMap,
  type RolePermissionsMatrix,
} from "./team-permissions.js";
import { TeamRoleModel } from "./team-role.model.js";
import type {
  PermissionMatrixMeta,
  RolesListResponse,
  TeamRoleDetails,
  TeamRoleListItem,
  TeamRoleStats,
} from "./team-role.types.js";
import type {
  CreateRoleInput,
  DuplicateRoleInput,
  ListRolesQuery,
  UpdateRoleInput,
  UpdateRolePermissionsInput,
} from "./team-role.validation.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

const SYSTEM_ROLE_NAME_SET = new Set(
  DEFAULT_TEAM_ROLES.map((role) => role.name.toLowerCase()),
);

function mapRoleListItem(
  role: {
    _id: mongoose.Types.ObjectId;
    name: string;
    description?: string | null;
    accessLevel: TeamAccessLevel;
    status: TeamRoleStatus;
    isSystem?: boolean;
    color?: string | null;
    icon?: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  memberCount = 0,
): TeamRoleListItem {
  return {
    id: String(role._id),
    name: role.name,
    description: role.description ?? "",
    accessLevel: role.accessLevel,
    status: role.status,
    isSystem: Boolean(role.isSystem),
    color: (role.color || "primary") as TeamRoleColor | "",
    icon: (role.icon || "shield") as TeamRoleIcon | "",
    memberCount,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

function buildPagination(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

class TeamRoleService {
  async ensureDefaultRoles(employerId: string): Promise<void> {
    const employerObjectId = toObjectId(employerId);
    const existingRoles = await TeamRoleModel.find({
      employerId: employerObjectId,
      isDeleted: false,
    }).lean();

    const existingByName = new Map(
      existingRoles.map((role) => [role.nameLower, role]),
    );

    const toInsert = [];
    for (const role of DEFAULT_TEAM_ROLES) {
      const key = role.name.toLowerCase();
      if (existingByName.has(key)) {
        continue;
      }
      toInsert.push({
        employerId: employerObjectId,
        name: role.name,
        nameLower: key,
        description: role.description,
        accessLevel: role.accessLevel,
        status: "active" as const,
        isSystem: true,
        color: role.color,
        icon: role.icon,
        permissions: createPermissionsForAccessLevel(role.accessLevel),
        fieldAccess: null,
        createdBy: employerObjectId,
        updatedBy: employerObjectId,
        isDeleted: false,
        deletedAt: null,
      });
    }

    if (toInsert.length > 0) {
      await TeamRoleModel.insertMany(toInsert);
    }

    const needsBackfill = existingRoles.filter(
      (role) =>
        role.permissions == null ||
        role.color == null ||
        role.color === "" ||
        role.icon == null ||
        role.icon === "",
    );

    await Promise.all(
      needsBackfill.map(async (role) => {
        const defaults = DEFAULT_TEAM_ROLES.find(
          (item) => item.name.toLowerCase() === role.nameLower,
        );
        const accessLevel = (role.accessLevel ??
          defaults?.accessLevel ??
          "limited") as TeamAccessLevel;
        await TeamRoleModel.updateOne(
          { _id: role._id },
          {
            $set: {
              permissions:
                role.permissions ??
                createPermissionsForAccessLevel(accessLevel),
              color: role.color || defaults?.color || "primary",
              icon: role.icon || defaults?.icon || "shield",
              isSystem: SYSTEM_ROLE_NAME_SET.has(role.nameLower)
                ? true
                : Boolean(role.isSystem),
            },
          },
        );
      }),
    );
  }

  /** Module 2 compatible list — all non-deleted roles with member counts. */
  async listRoles(employerId: string): Promise<TeamRoleSummary[]> {
    await this.ensureDefaultRoles(employerId);
    const employerObjectId = toObjectId(employerId);

    const roles = await TeamRoleModel.find({
      employerId: employerObjectId,
      isDeleted: false,
    })
      .sort({ nameLower: 1 })
      .lean();

    const countMap = await this.getMemberCountMap(employerObjectId);

    return roles.map((role) => ({
      id: String(role._id),
      name: role.name,
      description: role.description ?? "",
      accessLevel: role.accessLevel as TeamAccessLevel,
      status: role.status,
      isSystem: Boolean(role.isSystem),
      color: (role.color || "primary") as string,
      icon: (role.icon || "shield") as string,
      memberCount: countMap.get(String(role._id)) ?? 0,
    }));
  }

  async listRolesPaged(
    employerId: string,
    query: ListRolesQuery,
  ): Promise<RolesListResponse> {
    await this.ensureDefaultRoles(employerId);
    const employerObjectId = toObjectId(employerId);

    const match: Record<string, unknown> = {
      employerId: employerObjectId,
      isDeleted: false,
    };

    if (query.status) {
      match.status = query.status;
    }
    if (query.roleType === "system") {
      match.isSystem = true;
    } else if (query.roleType === "custom") {
      match.isSystem = false;
    }
    if (query.accessLevel) {
      match.accessLevel = query.accessLevel;
    }
    if (query.createdFrom) {
      match.createdAt = {
        ...((match.createdAt as object) ?? {}),
        $gte: new Date(query.createdFrom),
      };
    }
    if (query.createdTo) {
      const end = new Date(query.createdTo);
      end.setHours(23, 59, 59, 999);
      match.createdAt = {
        ...((match.createdAt as object) ?? {}),
        $lte: end,
      };
    }
    if (query.search) {
      const pattern = escapeRegex(query.search);
      match.$or = [
        { name: { $regex: pattern, $options: "i" } },
        { description: { $regex: pattern, $options: "i" } },
        { accessLevel: { $regex: pattern, $options: "i" } },
      ];
    }

    const countMap = await this.getMemberCountMap(employerObjectId);
    const sort = this.resolveSort(query.sort);
    const skip = (query.page - 1) * query.limit;

    const needsMemberSort =
      query.sort === "members_asc" || query.sort === "members_desc";

    let roles: Array<{
      _id: mongoose.Types.ObjectId;
      name: string;
      description?: string | null;
      accessLevel: TeamAccessLevel;
      status: TeamRoleStatus;
      isSystem?: boolean;
      color?: string | null;
      icon?: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    let total: number;

    if (needsMemberSort) {
      const allRoles = await TeamRoleModel.find(match).lean();
      total = allRoles.length;
      const decorated = allRoles
        .map((role) => ({
          role,
          memberCount: countMap.get(String(role._id)) ?? 0,
        }))
        .sort((a, b) =>
          query.sort === "members_asc"
            ? a.memberCount - b.memberCount
            : b.memberCount - a.memberCount,
        );
      roles = decorated
        .slice(skip, skip + query.limit)
        .map((item) => item.role as (typeof roles)[number]);
    } else {
      [roles, total] = await Promise.all([
        TeamRoleModel.find(match)
          .sort(sort)
          .skip(skip)
          .limit(query.limit)
          .lean() as Promise<typeof roles>,
        TeamRoleModel.countDocuments(match),
      ]);
    }

    const stats = await this.getRoleStats(employerObjectId);

    return {
      roles: roles.map((role) =>
        mapRoleListItem(role, countMap.get(String(role._id)) ?? 0),
      ),
      pagination: buildPagination(query.page, query.limit, total),
      stats,
    };
  }

  async getRole(employerId: string, roleId: string): Promise<TeamRoleListItem> {
    await this.ensureDefaultRoles(employerId);
    const role = await this.findOwnedRoleOrThrow(employerId, roleId);
    const count = await this.countMembersForRole(employerId, roleId);
    return mapRoleListItem(role, count);
  }

  async getRoleDetails(
    employerId: string,
    roleId: string,
  ): Promise<TeamRoleDetails> {
    await this.ensureDefaultRoles(employerId);
    const role = await this.findOwnedRoleOrThrow(employerId, roleId);
    const employerObjectId = toObjectId(employerId);

    const [members, recentChanges, memberCount] = await Promise.all([
      TeamMemberModel.find({
        employerId: employerObjectId,
        roleId: role._id,
        isDeleted: false,
        status: { $ne: "removed" },
      })
        .populate("departmentId", "name")
        .sort({ fullName: 1 })
        .limit(50)
        .lean(),
      TeamActivityModel.find({
        employerId: employerObjectId,
        roleId: role._id,
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      this.countMembersForRole(employerId, roleId),
    ]);

    const permissions = normalizePermissionsMatrix(
      role.permissions as RolePermissionsMatrix | null,
      role.accessLevel as TeamAccessLevel,
    );

    return {
      ...mapRoleListItem(role, memberCount),
      permissions,
      fieldAccess: (role.fieldAccess as RoleFieldAccessMap | null) ?? null,
      createdBy: String(role.createdBy),
      updatedBy: String(role.updatedBy),
      members: members.map((member) => {
        const department = member.departmentId as
          | { name?: string }
          | null
          | undefined;
        return {
          id: String(member._id),
          fullName: member.fullName,
          email: member.email,
          status: member.status,
          departmentName:
            department && typeof department === "object" && "name" in department
              ? (department.name ?? null)
              : null,
        };
      }),
      recentChanges: recentChanges.map((activity) => ({
        id: String(activity._id),
        type: activity.type,
        message: activity.message,
        createdAt: activity.createdAt.toISOString(),
      })),
    };
  }

  async createRole(
    employerId: string,
    input: CreateRoleInput,
  ): Promise<TeamRoleListItem> {
    await this.ensureDefaultRoles(employerId);
    const employerObjectId = toObjectId(employerId);
    const name = input.name.trim();
    const nameLower = normalizeName(name);

    if (SYSTEM_ROLE_NAME_SET.has(nameLower)) {
      throw new AppError(
        "Cannot create a role with a reserved system role name.",
        HTTP_STATUS.CONFLICT,
      );
    }

    await this.assertUniqueName(employerId, nameLower);

    let permissions: RolePermissionsMatrix;
    let fieldAccess: RoleFieldAccessMap | null = input.fieldAccess ?? null;
    let accessLevel = input.accessLevel;
    let color = input.color;
    let icon = input.icon;
    let description = input.description;

    if (input.cloneRoleId) {
      const source = await this.findOwnedRoleOrThrow(
        employerId,
        input.cloneRoleId,
      );
      permissions = normalizePermissionsMatrix(
        (input.permissions as RolePermissionsMatrix | undefined) ??
          (source.permissions as RolePermissionsMatrix | null),
        (source.accessLevel as TeamAccessLevel) ?? accessLevel,
      );
      fieldAccess =
        input.fieldAccess !== undefined
          ? (input.fieldAccess ?? null)
          : ((source.fieldAccess as RoleFieldAccessMap | null) ?? null);
      accessLevel = input.accessLevel || (source.accessLevel as TeamAccessLevel);
      color = input.color || ((source.color || "primary") as TeamRoleColor);
      icon = input.icon || ((source.icon || "shield") as TeamRoleIcon);
      if (!description) {
        description = source.description ?? "";
      }
    } else if (input.permissions) {
      permissions = normalizePermissionsMatrix(
        input.permissions,
        accessLevel,
      );
    } else {
      permissions = createPermissionsForAccessLevel(accessLevel);
    }

    try {
      const created = await TeamRoleModel.create({
        employerId: employerObjectId,
        name,
        nameLower,
        description,
        accessLevel,
        status: input.status,
        isSystem: false,
        color,
        icon,
        permissions,
        fieldAccess,
        createdBy: employerObjectId,
        updatedBy: employerObjectId,
        isDeleted: false,
        deletedAt: null,
      });

      await recordTeamActivity({
        employerId,
        type: "role_created",
        message: `Role "${name}" created`,
        roleId: created._id,
        actorEmployerId: employerId,
      });

      return mapRoleListItem(created, 0);
    } catch (error) {
      this.rethrowDuplicateName(error);
      throw error;
    }
  }

  async updateRole(
    employerId: string,
    roleId: string,
    input: UpdateRoleInput,
  ): Promise<TeamRoleListItem> {
    const role = await this.findOwnedRoleOrThrow(employerId, roleId);
    const previousPermissions = JSON.stringify(role.permissions);
    let nameChanged = false;
    let permissionsChanged = false;

    if (input.name !== undefined) {
      const name = input.name.trim();
      const nameLower = normalizeName(name);
      if (
        SYSTEM_ROLE_NAME_SET.has(nameLower) &&
        nameLower !== role.nameLower
      ) {
        throw new AppError(
          "Cannot rename a role to a reserved system role name.",
          HTTP_STATUS.CONFLICT,
        );
      }
      if (role.isSystem && nameLower !== role.nameLower) {
        throw new AppError(
          "System role names cannot be changed.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      if (nameLower !== role.nameLower) {
        await this.assertUniqueName(employerId, nameLower, roleId);
        role.name = name;
        role.nameLower = nameLower;
        nameChanged = true;
      }
    }

    if (input.description !== undefined) {
      role.description = input.description;
    }
    if (input.accessLevel !== undefined) {
      role.accessLevel = input.accessLevel;
    }
    if (input.status !== undefined) {
      if (role.isSystem && input.status === "archived") {
        throw new AppError(
          "System roles cannot be archived. Deactivate instead.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      role.status = input.status;
    }
    if (input.color !== undefined) {
      role.color = input.color;
    }
    if (input.icon !== undefined) {
      role.icon = input.icon;
    }
    if (input.permissions !== undefined) {
      role.permissions = normalizePermissionsMatrix(
        input.permissions,
        (input.accessLevel ?? role.accessLevel) as TeamAccessLevel,
      );
      permissionsChanged =
        JSON.stringify(role.permissions) !== previousPermissions;
    } else if (
      input.accessLevel !== undefined &&
      (role.permissions == null || role.accessLevel !== input.accessLevel)
    ) {
      // Only regenerate defaults when access level changes and permissions not sent.
      if (input.permissions === undefined && nameChanged === false) {
        // keep existing matrix unless empty
        if (role.permissions == null) {
          role.permissions = createPermissionsForAccessLevel(input.accessLevel);
        }
      }
    }
    if (input.fieldAccess !== undefined) {
      role.fieldAccess = input.fieldAccess;
    }

    role.updatedBy = toObjectId(employerId);

    try {
      await role.save();
    } catch (error) {
      this.rethrowDuplicateName(error);
      throw error;
    }

    await recordTeamActivity({
      employerId,
      type: "role_updated",
      message: `Role "${role.name}" updated`,
      roleId: role._id,
      actorEmployerId: employerId,
    });

    if (permissionsChanged) {
      await recordTeamActivity({
        employerId,
        type: "permission_changed",
        message: `Permissions updated for role "${role.name}"`,
        roleId: role._id,
        actorEmployerId: employerId,
      });
    }

    const count = await this.countMembersForRole(employerId, roleId);
    return mapRoleListItem(role, count);
  }

  async updatePermissions(
    employerId: string,
    roleId: string,
    input: UpdateRolePermissionsInput,
  ): Promise<TeamRoleDetails> {
    const role = await this.findOwnedRoleOrThrow(employerId, roleId);
    role.permissions = normalizePermissionsMatrix(
      input.permissions,
      role.accessLevel as TeamAccessLevel,
    );
    if (input.fieldAccess !== undefined) {
      role.fieldAccess = input.fieldAccess;
    }
    role.accessLevel = "custom";
    role.updatedBy = toObjectId(employerId);
    await role.save();

    await recordTeamActivity({
      employerId,
      type: "permission_changed",
      message: `Permissions updated for role "${role.name}"`,
      roleId: role._id,
      actorEmployerId: employerId,
    });

    return this.getRoleDetails(employerId, roleId);
  }

  async duplicateRole(
    employerId: string,
    roleId: string,
    input: DuplicateRoleInput,
  ): Promise<TeamRoleListItem> {
    const source = await this.findOwnedRoleOrThrow(employerId, roleId);
    const baseName = input.name?.trim() || `${source.name} Copy`;
    return this.createRole(employerId, {
      name: baseName,
      description: source.description ?? "",
      accessLevel: source.accessLevel as TeamAccessLevel,
      status: "active",
      color: (source.color || "primary") as TeamRoleColor,
      icon: (source.icon || "shield") as TeamRoleIcon,
      cloneRoleId: roleId,
      permissions: normalizePermissionsMatrix(
        source.permissions as RolePermissionsMatrix | null,
        source.accessLevel as TeamAccessLevel,
      ),
      fieldAccess:
        (source.fieldAccess as CreateRoleInput["fieldAccess"]) ?? null,
    }).then(async (created) => {
      await recordTeamActivity({
        employerId,
        type: "role_duplicated",
        message: `Role "${source.name}" duplicated as "${created.name}"`,
        roleId: created.id,
        actorEmployerId: employerId,
        metadata: { sourceRoleId: roleId },
      });
      return created;
    });
  }

  async archiveRole(
    employerId: string,
    roleId: string,
  ): Promise<TeamRoleListItem> {
    const role = await this.findOwnedRoleOrThrow(employerId, roleId);
    if (role.isSystem) {
      throw new AppError(
        "System roles cannot be archived. Deactivate instead.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    role.status = "archived";
    role.updatedBy = toObjectId(employerId);
    await role.save();

    await recordTeamActivity({
      employerId,
      type: "role_archived",
      message: `Role "${role.name}" archived`,
      roleId: role._id,
      actorEmployerId: employerId,
    });

    const count = await this.countMembersForRole(employerId, roleId);
    return mapRoleListItem(role, count);
  }

  async deactivateRole(
    employerId: string,
    roleId: string,
  ): Promise<TeamRoleListItem> {
    const role = await this.findOwnedRoleOrThrow(employerId, roleId);
    role.status = "inactive";
    role.updatedBy = toObjectId(employerId);
    await role.save();

    await recordTeamActivity({
      employerId,
      type: "role_deactivated",
      message: `Role "${role.name}" deactivated`,
      roleId: role._id,
      actorEmployerId: employerId,
    });

    const count = await this.countMembersForRole(employerId, roleId);
    return mapRoleListItem(role, count);
  }

  async activateRole(
    employerId: string,
    roleId: string,
  ): Promise<TeamRoleListItem> {
    const role = await this.findOwnedRoleOrThrow(employerId, roleId);
    role.status = "active";
    role.updatedBy = toObjectId(employerId);
    await role.save();

    await recordTeamActivity({
      employerId,
      type: "role_activated",
      message: `Role "${role.name}" activated`,
      roleId: role._id,
      actorEmployerId: employerId,
    });

    const count = await this.countMembersForRole(employerId, roleId);
    return mapRoleListItem(role, count);
  }

  async deleteRole(
    employerId: string,
    roleId: string,
  ): Promise<{ id: string }> {
    const role = await this.findOwnedRoleOrThrow(employerId, roleId);

    if (role.isSystem) {
      throw new AppError(
        SYSTEM_ROLE_DELETE_BLOCKED_MESSAGE,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const memberCount = await this.countMembersForRole(employerId, roleId);
    if (memberCount > 0) {
      throw new AppError(ROLE_DELETE_BLOCKED_MESSAGE, HTTP_STATUS.CONFLICT);
    }

    role.isDeleted = true;
    role.deletedAt = new Date();
    role.updatedBy = toObjectId(employerId);
    await role.save();

    await recordTeamActivity({
      employerId,
      type: "role_deleted",
      message: `Role "${role.name}" deleted`,
      roleId: role._id,
      actorEmployerId: employerId,
    });

    return { id: roleId };
  }

  getPermissionMatrixMeta(): PermissionMatrixMeta {
    return {
      modules: TEAM_PERMISSION_MODULES.map((key) => ({
        key,
        label: TEAM_PERMISSION_MODULE_LABELS[key],
      })),
      actions: TEAM_PERMISSION_ACTIONS.map((key) => ({
        key,
        label:
          key === "fullAccess"
            ? "Full Access"
            : key.charAt(0).toUpperCase() + key.slice(1),
      })),
    };
  }

  async findActiveOwnedRoleOrThrow(employerId: string, roleId: string) {
    if (
      !mongoose.Types.ObjectId.isValid(employerId) ||
      !mongoose.Types.ObjectId.isValid(roleId)
    ) {
      throw new AppError("Role not found", HTTP_STATUS.NOT_FOUND);
    }

    const role = await TeamRoleModel.findOne({
      _id: roleId,
      employerId: toObjectId(employerId),
      isDeleted: false,
      status: "active",
    });

    if (!role) {
      throw new AppError(
        "Role not found or is not available for assignment",
        HTTP_STATUS.NOT_FOUND,
      );
    }

    return role;
  }

  private async findOwnedRoleOrThrow(employerId: string, roleId: string) {
    if (
      !mongoose.Types.ObjectId.isValid(employerId) ||
      !mongoose.Types.ObjectId.isValid(roleId)
    ) {
      throw new AppError("Role not found", HTTP_STATUS.NOT_FOUND);
    }

    const role = await TeamRoleModel.findOne({
      _id: roleId,
      employerId: toObjectId(employerId),
      isDeleted: false,
    });

    if (!role) {
      throw new AppError("Role not found", HTTP_STATUS.NOT_FOUND);
    }

    return role;
  }

  private async assertUniqueName(
    employerId: string,
    nameLower: string,
    excludeRoleId?: string,
  ) {
    const existing = await TeamRoleModel.findOne({
      employerId: toObjectId(employerId),
      nameLower,
      isDeleted: false,
      ...(excludeRoleId ? { _id: { $ne: excludeRoleId } } : {}),
    }).lean();

    if (existing) {
      throw new AppError(
        "A role with this name already exists.",
        HTTP_STATUS.CONFLICT,
      );
    }
  }

  private rethrowDuplicateName(error: unknown): void {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new AppError(
        "A role with this name already exists.",
        HTTP_STATUS.CONFLICT,
      );
    }
  }

  private async getMemberCountMap(
    employerObjectId: mongoose.Types.ObjectId,
  ): Promise<Map<string, number>> {
    const counts = await TeamMemberModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          employerId: employerObjectId,
          isDeleted: false,
          status: { $ne: "removed" },
          roleId: { $ne: null },
        },
      },
      { $group: { _id: "$roleId", count: { $sum: 1 } } },
    ]);

    return new Map(counts.map((item) => [String(item._id), item.count]));
  }

  private async countMembersForRole(
    employerId: string,
    roleId: string,
  ): Promise<number> {
    return TeamMemberModel.countDocuments({
      employerId: toObjectId(employerId),
      roleId: toObjectId(roleId),
      isDeleted: false,
      status: { $ne: "removed" },
    });
  }

  private async getRoleStats(
    employerObjectId: mongoose.Types.ObjectId,
  ): Promise<TeamRoleStats> {
    const [totalRoles, activeRoles, inactiveRoles, archivedRoles, systemRoles] =
      await Promise.all([
        TeamRoleModel.countDocuments({
          employerId: employerObjectId,
          isDeleted: false,
        }),
        TeamRoleModel.countDocuments({
          employerId: employerObjectId,
          isDeleted: false,
          status: "active",
        }),
        TeamRoleModel.countDocuments({
          employerId: employerObjectId,
          isDeleted: false,
          status: "inactive",
        }),
        TeamRoleModel.countDocuments({
          employerId: employerObjectId,
          isDeleted: false,
          status: "archived",
        }),
        TeamRoleModel.countDocuments({
          employerId: employerObjectId,
          isDeleted: false,
          isSystem: true,
        }),
      ]);

    return {
      totalRoles,
      activeRoles,
      inactiveRoles,
      archivedRoles,
      systemRoles,
      customRoles: totalRoles - systemRoles,
    };
  }

  private resolveSort(
    sort: TeamRoleListSort,
  ): Record<string, 1 | -1> {
    switch (sort) {
      case "name_desc":
        return { nameLower: -1 };
      case "newest":
        return { createdAt: -1 };
      case "oldest":
        return { createdAt: 1 };
      case "updated_newest":
        return { updatedAt: -1 };
      case "status":
        return { status: 1, nameLower: 1 };
      case "name_asc":
      default:
        return { nameLower: 1 };
    }
  }
}

export const teamRoleService = new TeamRoleService();
