import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { buildListPagination } from "../../../utils/pagination.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import { OperationsDepartmentModel } from "../rbac/operations-department.model.js";
import { OperationsOrgUnitModel } from "../organization/operations-org-unit.model.js";
import { recordOperationsAuditEvent } from "../rbac/operations-audit.service.js";
import { slugifyOperationsName } from "../rbac/operations-slug.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import {
  assertFineOrCoarsePermission,
  canViewOperationsMemberEmail,
  canViewOperationsMemberMobile,
  getRoleDescendantIds,
} from "../rbac/operations-access.service.js";
import { sanitizeMemberContactFields } from "../team/operations-people-security.js";
import {
  assertActorCanAccessDepartment,
  assertActorCanAccessOrgUnit,
  loadActorOrgSubtreeIds,
  loadOrgSubtreeIds,
  loadOrgUnitAncestry,
  locationLabelsFromAncestry,
} from "../rbac/operations-org-scope.js";
import {
  TEAM_TEAMS_ARCHIVE_KEY,
  TEAM_TEAMS_CREATE_KEY,
  TEAM_TEAMS_LEAD_ASSIGN_KEY,
  TEAM_TEAMS_MEMBERS_ADD_KEY,
  TEAM_TEAMS_MEMBERS_REMOVE_KEY,
  TEAM_TEAMS_MEMBERS_VIEW_KEY,
  TEAM_TEAMS_UPDATE_KEY,
  TEAM_TEAMS_VIEW_KEY,
} from "../rbac/operations-permission-catalog.js";
import { OPEN_WORK_STATUSES } from "../work/operations-work-department.js";
import { OperationsWorkItemModel } from "../work/operations-work.model.js";
import { resolveCapabilitiesForMembers } from "../work/operations-work-capability.js";
import {
  buildTeamArchiveBlockedMessage,
  hasBlockingTeamDependencies,
  isDepartmentCompatible,
  isSameOrgBranch,
  TEAM_ERROR_CODES,
} from "./operations-teams-domain.js";
import { OperationsTeamModel } from "./operations-teams.model.js";
import type {
  AddOperationsTeamMemberBody,
  CreateOperationsTeamBody,
  ListOperationsTeamsQuery,
  ListTeamMembersQuery,
  RemoveOperationsTeamMemberBody,
  UpdateOperationsTeamBody,
} from "./operations-teams.validation.js";

type LeanTeam = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  code: string;
  description?: string | null;
  status: string;
  departmentId: mongoose.Types.ObjectId;
  orgUnitId: mongoose.Types.ObjectId;
  leadUserId?: mongoose.Types.ObjectId | null;
  revision?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

function staleRevisionError(): never {
  throw new AppError(
    "This team was updated by someone else. Refresh and try again.",
    HTTP_STATUS.CONFLICT,
    { code: TEAM_ERROR_CODES.STALE_REVISION },
  );
}

async function uniqueTeamSlug(
  name: string,
  departmentId: string,
  excludeId?: string,
): Promise<string> {
  const base = slugifyOperationsName(name);
  if (!base) {
    throw new AppError("Team name is invalid.", HTTP_STATUS.BAD_REQUEST);
  }
  let slug = base;
  let suffix = 2;
  while (
    await OperationsTeamModel.exists({
      slug,
      departmentId,
      status: "active",
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

async function assertUniqueCode(
  code: string,
  departmentId: string,
  excludeId?: string,
): Promise<void> {
  const clash = await OperationsTeamModel.exists({
    code,
    departmentId,
    status: "active",
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  if (clash) {
    throw new AppError(
      "A team with this code already exists in the department.",
      HTTP_STATUS.CONFLICT,
      { code: "TEAM_CODE_DUPLICATE" },
    );
  }
}

async function loadActiveDepartment(departmentId: string) {
  const department = await OperationsDepartmentModel.findById(departmentId)
    .select("name slug status")
    .lean();
  if (!department || department.status !== "active") {
    throw new AppError("Department not found or inactive.", HTTP_STATUS.BAD_REQUEST);
  }
  return department;
}

async function loadActiveOrgUnit(orgUnitId: string) {
  const unit = await OperationsOrgUnitModel.findById(orgUnitId)
    .select("name type status ancestorIds")
    .lean();
  if (!unit || unit.status !== "active") {
    throw new AppError(
      "Organization location not found or inactive.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }
  return unit;
}

async function assertMemberFitsTeam(input: {
  user: {
    _id: mongoose.Types.ObjectId;
    status: string;
    departmentId?: mongoose.Types.ObjectId | null;
    orgUnitId?: mongoose.Types.ObjectId | null;
    teamId?: mongoose.Types.ObjectId | null;
  };
  teamDepartmentId: string;
  teamOrgUnitId: string;
  allowExistingTeamId?: string;
}): Promise<void> {
  if (input.user.status !== "active") {
    throw new AppError(
      "Cannot assign an inactive or suspended user to a team.",
      HTTP_STATUS.BAD_REQUEST,
      { code: TEAM_ERROR_CODES.TEAM_LEAD_INVALID },
    );
  }
  const userDepartmentId = input.user.departmentId
    ? String(input.user.departmentId)
    : null;
  if (!isDepartmentCompatible(userDepartmentId, input.teamDepartmentId)) {
    throw new AppError(
      "Team members must belong to the same department as the team.",
      HTTP_STATUS.CONFLICT,
      { code: TEAM_ERROR_CODES.TEAM_DEPARTMENT_MISMATCH },
    );
  }

  const existingTeamId = input.user.teamId ? String(input.user.teamId) : null;
  if (
    existingTeamId &&
    existingTeamId !== input.allowExistingTeamId
  ) {
    throw new AppError(
      "This member is already assigned to another team. Remove them first.",
      HTTP_STATUS.CONFLICT,
      { code: TEAM_ERROR_CODES.TEAM_MEMBER_ALREADY_ASSIGNED },
    );
  }

  const userOrgUnitId = input.user.orgUnitId
    ? String(input.user.orgUnitId)
    : null;
  if (!userOrgUnitId) {
    return;
  }
  const [userUnit, teamUnit] = await Promise.all([
    OperationsOrgUnitModel.findById(userOrgUnitId)
      .select("ancestorIds")
      .lean(),
    OperationsOrgUnitModel.findById(input.teamOrgUnitId)
      .select("ancestorIds")
      .lean(),
  ]);
  const compatible = isSameOrgBranch({
    userOrgUnitId,
    userAncestorIds: (userUnit?.ancestorIds ?? []).map((id) => String(id)),
    teamOrgUnitId: input.teamOrgUnitId,
    teamAncestorIds: (teamUnit?.ancestorIds ?? []).map((id) => String(id)),
  });
  if (!compatible) {
    throw new AppError(
      "Team members must belong to the same geographic branch as the team.",
      HTTP_STATUS.CONFLICT,
      { code: TEAM_ERROR_CODES.TEAM_LOCATION_MISMATCH },
    );
  }
}

async function collectTeamArchiveDependencies(
  teamId: mongoose.Types.ObjectId,
): Promise<{ activeMembers: number; openWorkItems: number }> {
  const members = await OperationsTeamUserModel.find({
    teamId,
    status: { $ne: "inactive" },
  })
    .select("_id")
    .lean();
  const memberIds = members.map((row) => row._id);
  const openWorkItems =
    memberIds.length === 0
      ? 0
      : await OperationsWorkItemModel.countDocuments({
          assignedToUserId: { $in: memberIds },
          status: { $in: [...OPEN_WORK_STATUSES] },
        });
  return { activeMembers: members.length, openWorkItems };
}

async function assertCanAccessTeam(
  access: OperationsResolvedAccess,
  team: { departmentId: mongoose.Types.ObjectId; orgUnitId: mongoose.Types.ObjectId },
): Promise<void> {
  assertActorCanAccessDepartment(access, String(team.departmentId));
  await assertActorCanAccessOrgUnit(access, String(team.orgUnitId));
}

function toPublicTeam(
  team: LeanTeam,
  extras: {
    departmentName: string | null;
    orgUnitName: string | null;
    orgUnitType: string | null;
    leadName: string | null;
    memberCount: number;
    activeMemberCount: number;
    openWorkCount: number;
    country: string | null;
    region: string | null;
    state: string | null;
    city: string | null;
    office: string | null;
  },
) {
  return {
    id: String(team._id),
    name: team.name,
    slug: team.slug,
    code: team.code,
    description: team.description ?? "",
    status: team.status,
    departmentId: String(team.departmentId),
    departmentName: extras.departmentName,
    orgUnitId: String(team.orgUnitId),
    orgUnitName: extras.orgUnitName,
    orgUnitType: extras.orgUnitType,
    country: extras.country,
    region: extras.region,
    state: extras.state,
    city: extras.city,
    office: extras.office,
    leadUserId: team.leadUserId ? String(team.leadUserId) : null,
    leadName: extras.leadName,
    memberCount: extras.memberCount,
    activeMemberCount: extras.activeMemberCount,
    openWorkCount: extras.openWorkCount,
    revision: team.revision ?? 1,
    createdAt: team.createdAt?.toISOString() ?? null,
    updatedAt: team.updatedAt?.toISOString() ?? null,
  };
}

async function hydrateTeams(teams: LeanTeam[]) {
  if (teams.length === 0) {
    return [];
  }

  // Repair vacant leads from existing active members so Team Lead never
  // stays blank when the team already has people assigned.
  const vacantTeams = teams.filter((team) => !team.leadUserId);
  if (vacantTeams.length > 0) {
    const firstMembers = await OperationsTeamUserModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      userId: mongoose.Types.ObjectId;
    }>([
      {
        $match: {
          teamId: { $in: vacantTeams.map((team) => team._id) },
          status: "active",
        },
      },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$teamId",
          userId: { $first: "$_id" },
        },
      },
    ]);

    if (firstMembers.length > 0) {
      await Promise.all(
        firstMembers.map((row) =>
          OperationsTeamModel.updateOne(
            {
              _id: row._id,
              $or: [{ leadUserId: null }, { leadUserId: { $exists: false } }],
            },
            { $set: { leadUserId: row.userId } },
          ),
        ),
      );

      const leadByTeamId = new Map(
        firstMembers.map((row) => [String(row._id), row.userId]),
      );
      for (const team of teams) {
        if (!team.leadUserId) {
          const leadId = leadByTeamId.get(String(team._id));
          if (leadId) {
            team.leadUserId = leadId;
          }
        }
      }
    }
  }

  const departmentIds = [...new Set(teams.map((team) => String(team.departmentId)))];
  const orgUnitIds = [...new Set(teams.map((team) => String(team.orgUnitId)))];
  const leadIds = [
    ...new Set(
      teams
        .map((team) => (team.leadUserId ? String(team.leadUserId) : null))
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const leadObjectIds = leadIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  const teamObjectIds = teams.map((team) => team._id);

  const [departments, orgUnits, leads, memberRows] = await Promise.all([
    OperationsDepartmentModel.find({ _id: { $in: departmentIds } })
      .select("name")
      .lean(),
    OperationsOrgUnitModel.find({ _id: { $in: orgUnitIds } })
      .select("name type ancestorIds")
      .lean(),
    leadObjectIds.length
      ? OperationsTeamUserModel.find({ _id: { $in: leadObjectIds } })
          .select("fullName email")
          .lean()
      : [],
    OperationsTeamUserModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      total: number;
      active: number;
      memberIds: mongoose.Types.ObjectId[];
    }>([
      { $match: { teamId: { $in: teamObjectIds } } },
      {
        $group: {
          _id: "$teamId",
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          memberIds: { $push: "$_id" },
        },
      },
    ]),
  ]);

  const ancestorIds = [
    ...new Set(
      orgUnits.flatMap((unit) =>
        (unit.ancestorIds ?? []).map((id) => String(id)),
      ),
    ),
  ];
  const ancestors = ancestorIds.length
    ? await OperationsOrgUnitModel.find({ _id: { $in: ancestorIds } })
        .select("name type")
        .lean()
    : [];
  const ancestorById = new Map(
    ancestors.map((row) => [String(row._id), row]),
  );

  const allMemberIds = memberRows.flatMap((row) => row.memberIds);
  const openRows =
    allMemberIds.length === 0
      ? []
      : await OperationsWorkItemModel.aggregate<{
          _id: mongoose.Types.ObjectId;
          count: number;
        }>([
          {
            $match: {
              assignedToUserId: { $in: allMemberIds },
              status: { $in: [...OPEN_WORK_STATUSES] },
            },
          },
          { $group: { _id: "$assignedToUserId", count: { $sum: 1 } } },
        ]);
  const openByUser = new Map(
    openRows.map((row) => [String(row._id), row.count]),
  );

  const departmentNameById = new Map(
    departments.map((row) => [String(row._id), row.name]),
  );
  const orgUnitById = new Map(
    orgUnits.map((row) => [String(row._id), row]),
  );
  const leadNameById = new Map(
    leads.map((row) => {
      const name =
        (typeof row.fullName === "string" && row.fullName.trim()) ||
        (typeof row.email === "string" && row.email.trim()) ||
        null;
      return [String(row._id), name] as const;
    }),
  );
  const memberByTeam = new Map(
    memberRows.map((row) => [String(row._id), row]),
  );

  return teams.map((team) => {
    const unit = orgUnitById.get(String(team.orgUnitId));
    const labels = locationLabelsFromAncestry(
      unit?.name ?? "",
      String(unit?.type ?? ""),
      (unit?.ancestorIds ?? [])
        .map((id) => ancestorById.get(String(id)))
        .flatMap((row) =>
          row ? [{ name: row.name, type: String(row.type) }] : [],
        ),
    );
    const counts = memberByTeam.get(String(team._id));
    const openWorkCount = (counts?.memberIds ?? []).reduce(
      (sum, id) => sum + (openByUser.get(String(id)) ?? 0),
      0,
    );
    return toPublicTeam(team, {
      departmentName: departmentNameById.get(String(team.departmentId)) ?? null,
      orgUnitName: unit?.name ?? null,
      orgUnitType: unit ? String(unit.type) : null,
      leadName: team.leadUserId
        ? (leadNameById.get(String(team.leadUserId)) ?? null)
        : null,
      memberCount: counts?.total ?? 0,
      activeMemberCount: counts?.active ?? 0,
      openWorkCount,
      ...labels,
    });
  });
}

class OperationsTeamsService {
  private async scopedTeamFilter(
    access: OperationsResolvedAccess,
    extra: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    const filter: Record<string, unknown> = { ...extra };
    if (!access.isSuperAdmin) {
      if (access.departmentId) {
        filter.departmentId = access.departmentId;
      } else {
        filter.departmentId = { $in: [] };
      }
    }
    const subtree = await loadActorOrgSubtreeIds(access);
    if (subtree) {
      filter.orgUnitId = { $in: subtree };
    }
    return filter;
  }

  async metrics(access: OperationsResolvedAccess) {
    assertFineOrCoarsePermission(access, TEAM_TEAMS_VIEW_KEY, "team", "read");
    const base = await this.scopedTeamFilter(access);
    const [totalTeams, activeTeams, inactiveTeams, locations, departments] =
      await Promise.all([
        OperationsTeamModel.countDocuments(base),
        OperationsTeamModel.countDocuments({ ...base, status: "active" }),
        OperationsTeamModel.countDocuments({ ...base, status: "archived" }),
        OperationsTeamModel.distinct("orgUnitId", { ...base, status: "active" }),
        OperationsTeamModel.distinct("departmentId", {
          ...base,
          status: "active",
        }),
      ]);

    const active = await OperationsTeamModel.find({
      ...base,
      status: "active",
    })
      .select("_id")
      .lean();
    const teamIds = active.map((row) => row._id);
    const members =
      teamIds.length === 0
        ? []
        : await OperationsTeamUserModel.find({
            teamId: { $in: teamIds },
            status: "active",
          })
            .select("_id")
            .lean();
    const openWork =
      members.length === 0
        ? 0
        : await OperationsWorkItemModel.countDocuments({
            assignedToUserId: { $in: members.map((row) => row._id) },
            status: { $in: [...OPEN_WORK_STATUSES] },
          });

    return {
      totalTeams,
      activeTeams,
      inactiveTeams,
      locations: locations.filter(Boolean).length,
      departments: departments.filter(Boolean).length,
      openWork,
    };
  }

  async list(access: OperationsResolvedAccess, query: ListOperationsTeamsQuery) {
    assertFineOrCoarsePermission(access, TEAM_TEAMS_VIEW_KEY, "team", "read");
    const filter = await this.scopedTeamFilter(access);
    if (query.status !== "all") {
      filter.status = query.status;
    }
    if (query.departmentId) {
      assertActorCanAccessDepartment(access, query.departmentId);
      filter.departmentId = query.departmentId;
    }
    if (query.leadUserId) {
      filter.leadUserId = query.leadUserId;
    }
    const scopeUnitId =
      query.cityId || query.stateId || query.regionId || query.orgUnitId;
    if (scopeUnitId) {
      await assertActorCanAccessOrgUnit(access, scopeUnitId);
      const subtree = await loadOrgSubtreeIds(scopeUnitId);
      filter.orgUnitId = { $in: subtree };
    }
    if (query.search.trim()) {
      const pattern = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: pattern, $options: "i" } },
        { code: { $regex: pattern, $options: "i" } },
        { description: { $regex: pattern, $options: "i" } },
      ];
    }

    const total = await OperationsTeamModel.countDocuments(filter);
    const pagination = buildListPagination(query.page, query.limit, total);
    const sortDir = query.order === "desc" ? -1 : 1;
    const teams = (await OperationsTeamModel.find(filter)
      .sort({ [query.sort]: sortDir, name: 1 })
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .lean()) as LeanTeam[];

    return {
      teams: await hydrateTeams(teams),
      pagination,
    };
  }

  async getById(access: OperationsResolvedAccess, teamId: string) {
    assertFineOrCoarsePermission(access, TEAM_TEAMS_VIEW_KEY, "team", "read");
    const team = (await OperationsTeamModel.findById(teamId).lean()) as
      | LeanTeam
      | null;
    if (!team) {
      throw new AppError("Team not found.", HTTP_STATUS.NOT_FOUND, {
        code: TEAM_ERROR_CODES.TEAM_NOT_FOUND,
      });
    }
    await assertCanAccessTeam(access, team);
    const [hydrated] = await hydrateTeams([team]);
    const activeMembers = await OperationsTeamUserModel.find({
      teamId: team._id,
      status: "active",
    })
      .select("_id role roleId")
      .lean();
    const capabilities = await resolveCapabilitiesForMembers(activeMembers);
    return {
      ...hydrated,
      capabilities,
    };
  }

  async create(access: OperationsResolvedAccess, body: CreateOperationsTeamBody) {
    assertFineOrCoarsePermission(access, TEAM_TEAMS_CREATE_KEY, "team", "create");
    assertActorCanAccessDepartment(access, body.departmentId);
    await assertActorCanAccessOrgUnit(access, body.orgUnitId);

    const [department, orgUnit] = await Promise.all([
      loadActiveDepartment(body.departmentId),
      loadActiveOrgUnit(body.orgUnitId),
    ]);
    void department;
    void orgUnit;

    const code = slugifyOperationsName(body.code);
    if (!code) {
      throw new AppError("Team code is invalid.", HTTP_STATUS.BAD_REQUEST);
    }
    await assertUniqueCode(code, body.departmentId);
    const slug = await uniqueTeamSlug(body.name, body.departmentId);

    let leadUserId: string | null =
      body.leadUserId && body.leadUserId !== ""
        ? String(body.leadUserId)
        : null;

    if (leadUserId) {
      const lead = await OperationsTeamUserModel.findById(leadUserId).lean();
      if (!lead) {
        throw new AppError("Team lead not found.", HTTP_STATUS.BAD_REQUEST, {
          code: TEAM_ERROR_CODES.TEAM_LEAD_INVALID,
        });
      }
      await assertMemberFitsTeam({
        user: lead,
        teamDepartmentId: body.departmentId,
        teamOrgUnitId: body.orgUnitId,
      });
    }

    const created = await OperationsTeamModel.create({
      name: body.name.trim(),
      slug,
      code,
      description: body.description?.trim() ?? "",
      status: "active",
      departmentId: body.departmentId,
      orgUnitId: body.orgUnitId,
      leadUserId,
      createdBy: access.userId,
      updatedBy: access.userId,
      revision: 1,
    });

    if (leadUserId) {
      await OperationsTeamUserModel.updateOne(
        { _id: leadUserId },
        {
          $set: {
            teamId: created._id,
            departmentId: body.departmentId,
            orgUnitId: body.orgUnitId,
          },
        },
      );
    }

    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: access.roleName ?? "",
      action: "team.created",
      targetType: "team",
      targetId: String(created._id),
      targetLabel: created.name,
      nextState: {
        departmentId: body.departmentId,
        orgUnitId: body.orgUnitId,
        leadUserId,
        code,
      },
    });

    return this.getById(access, String(created._id));
  }

  async update(
    access: OperationsResolvedAccess,
    teamId: string,
    body: UpdateOperationsTeamBody,
  ) {
    assertFineOrCoarsePermission(access, TEAM_TEAMS_UPDATE_KEY, "team", "update");
    const team = await OperationsTeamModel.findById(teamId);
    if (!team) {
      throw new AppError("Team not found.", HTTP_STATUS.NOT_FOUND, {
        code: TEAM_ERROR_CODES.TEAM_NOT_FOUND,
      });
    }
    await assertCanAccessTeam(access, team);

    if (body.status === "archived") {
      assertFineOrCoarsePermission(
        access,
        TEAM_TEAMS_ARCHIVE_KEY,
        "team",
        "delete",
      );
    }

    const previous = {
      name: team.name,
      code: team.code,
      departmentId: String(team.departmentId),
      orgUnitId: String(team.orgUnitId),
      leadUserId: team.leadUserId ? String(team.leadUserId) : null,
      status: team.status,
    };

    const nextDepartmentId = body.departmentId
      ? String(body.departmentId)
      : String(team.departmentId);
    const nextOrgUnitId = body.orgUnitId
      ? String(body.orgUnitId)
      : String(team.orgUnitId);

    if (body.departmentId) {
      assertActorCanAccessDepartment(access, body.departmentId);
      await loadActiveDepartment(body.departmentId);
    }
    if (body.orgUnitId) {
      await assertActorCanAccessOrgUnit(access, body.orgUnitId);
      await loadActiveOrgUnit(body.orgUnitId);
    }

    if (body.name) {
      team.name = body.name.trim();
      team.slug = await uniqueTeamSlug(
        team.name,
        nextDepartmentId,
        String(team._id),
      );
    }
    if (body.code) {
      const code = slugifyOperationsName(body.code);
      if (!code) {
        throw new AppError("Team code is invalid.", HTTP_STATUS.BAD_REQUEST);
      }
      await assertUniqueCode(code, nextDepartmentId, String(team._id));
      team.code = code;
    }
    if (body.description !== undefined) {
      team.description = body.description.trim();
    }
    if (body.departmentId) {
      team.departmentId = new mongoose.Types.ObjectId(body.departmentId);
    }
    if (body.orgUnitId) {
      team.orgUnitId = new mongoose.Types.ObjectId(body.orgUnitId);
    }

    if (body.leadUserId !== undefined) {
      assertFineOrCoarsePermission(
        access,
        TEAM_TEAMS_LEAD_ASSIGN_KEY,
        "team",
        "update",
      );
      const leadUserId =
        body.leadUserId && body.leadUserId !== ""
          ? String(body.leadUserId)
          : null;
      if (leadUserId) {
        const lead = await OperationsTeamUserModel.findById(leadUserId).lean();
        if (!lead) {
          throw new AppError("Team lead not found.", HTTP_STATUS.BAD_REQUEST, {
            code: TEAM_ERROR_CODES.TEAM_LEAD_INVALID,
          });
        }
        await assertMemberFitsTeam({
          user: lead,
          teamDepartmentId: nextDepartmentId,
          teamOrgUnitId: nextOrgUnitId,
          allowExistingTeamId: String(team._id),
        });
        await OperationsTeamUserModel.updateOne(
          { _id: leadUserId },
          {
            $set: {
              teamId: team._id,
              departmentId: nextDepartmentId,
              orgUnitId: nextOrgUnitId,
            },
          },
        );
        team.leadUserId = new mongoose.Types.ObjectId(leadUserId);
      } else {
        team.leadUserId = null;
      }
    }

    if (body.status === "archived") {
      const deps = await collectTeamArchiveDependencies(team._id);
      if (hasBlockingTeamDependencies(deps)) {
        throw new AppError(
          buildTeamArchiveBlockedMessage(team.name, deps),
          HTTP_STATUS.CONFLICT,
          { code: TEAM_ERROR_CODES.TEAM_HAS_DEPENDENCIES, dependencies: deps },
        );
      }
      team.status = "archived";
      team.archivedAt = new Date();
      team.archivedBy = new mongoose.Types.ObjectId(access.userId);
    } else if (body.status === "active") {
      team.status = "active";
      team.archivedAt = null;
      team.archivedBy = null;
    }

    team.updatedBy = new mongoose.Types.ObjectId(access.userId);

    const updated = await OperationsTeamModel.findOneAndUpdate(
      { _id: team._id, revision: body.expectedRevision },
      {
        $set: {
          name: team.name,
          slug: team.slug,
          code: team.code,
          description: team.description,
          departmentId: team.departmentId,
          orgUnitId: team.orgUnitId,
          leadUserId: team.leadUserId,
          status: team.status,
          archivedAt: team.archivedAt,
          archivedBy: team.archivedBy,
          updatedBy: team.updatedBy,
        },
        $inc: { revision: 1 },
      },
      { new: true },
    );
    if (!updated) {
      staleRevisionError();
    }

    const leadChanged =
      previous.leadUserId !== (team.leadUserId ? String(team.leadUserId) : null);
    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: access.roleName ?? "",
      action:
        body.status === "archived"
          ? "team.archived"
          : leadChanged
            ? "team.lead_changed"
            : "team.updated",
      targetType: "team",
      targetId: teamId,
      targetLabel: team.name,
      previousState: previous,
      nextState: {
        name: team.name,
        code: team.code,
        departmentId: String(team.departmentId),
        orgUnitId: String(team.orgUnitId),
        leadUserId: team.leadUserId ? String(team.leadUserId) : null,
        status: team.status,
      },
    });

    return this.getById(access, teamId);
  }

  async archive(access: OperationsResolvedAccess, teamId: string, expectedRevision: number) {
    return this.update(access, teamId, {
      status: "archived",
      expectedRevision,
    });
  }

  async addMember(
    access: OperationsResolvedAccess,
    teamId: string,
    body: AddOperationsTeamMemberBody,
  ) {
    assertFineOrCoarsePermission(
      access,
      TEAM_TEAMS_MEMBERS_ADD_KEY,
      "team",
      "update",
    );
    const team = await OperationsTeamModel.findById(teamId);
    if (!team) {
      throw new AppError("Team not found.", HTTP_STATUS.NOT_FOUND, {
        code: TEAM_ERROR_CODES.TEAM_NOT_FOUND,
      });
    }
    if (team.status !== "active") {
      throw new AppError("Cannot add members to an archived team.", HTTP_STATUS.CONFLICT, {
        code: TEAM_ERROR_CODES.TEAM_INACTIVE,
      });
    }
    await assertCanAccessTeam(access, team);

    const user = await OperationsTeamUserModel.findById(body.userId).lean();
    if (!user) {
      throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
    }
    await assertMemberFitsTeam({
      user,
      teamDepartmentId: String(team.departmentId),
      teamOrgUnitId: String(team.orgUnitId),
      allowExistingTeamId: String(team._id),
    });

    const bumped = await OperationsTeamModel.findOneAndUpdate(
      { _id: team._id, revision: body.expectedRevision, status: "active" },
      { $inc: { revision: 1 }, $set: { updatedBy: access.userId } },
      { new: true },
    );
    if (!bumped) {
      staleRevisionError();
    }

    await OperationsTeamUserModel.updateOne(
      { _id: body.userId },
      {
        $set: {
          teamId: team._id,
          departmentId: user.departmentId ?? team.departmentId,
          orgUnitId: user.orgUnitId ?? team.orgUnitId,
        },
      },
    );

    if (!team.leadUserId) {
      await OperationsTeamModel.updateOne(
        {
          _id: team._id,
          $or: [{ leadUserId: null }, { leadUserId: { $exists: false } }],
        },
        { $set: { leadUserId: body.userId } },
      );
    }

    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: access.roleName ?? "",
      action: "team.member_added",
      targetType: "team",
      targetId: teamId,
      targetLabel: team.name,
      nextState: { userId: body.userId },
    });

    return this.getById(access, teamId);
  }

  async removeMember(
    access: OperationsResolvedAccess,
    teamId: string,
    memberId: string,
    body: RemoveOperationsTeamMemberBody,
  ) {
    assertFineOrCoarsePermission(
      access,
      TEAM_TEAMS_MEMBERS_REMOVE_KEY,
      "team",
      "update",
    );
    const team = await OperationsTeamModel.findById(teamId);
    if (!team) {
      throw new AppError("Team not found.", HTTP_STATUS.NOT_FOUND, {
        code: TEAM_ERROR_CODES.TEAM_NOT_FOUND,
      });
    }
    await assertCanAccessTeam(access, team);

    const isLead = team.leadUserId && String(team.leadUserId) === memberId;
    if (isLead) {
      const replacement = body.replacementLeadUserId || "";
      if (!replacement) {
        throw new AppError(
          "Assign a replacement team lead before removing the current lead.",
          HTTP_STATUS.CONFLICT,
          { code: TEAM_ERROR_CODES.TEAM_LEAD_REQUIRED },
        );
      }
      await this.update(access, teamId, {
        leadUserId: replacement,
        expectedRevision: body.expectedRevision,
      });
    } else {
      const bumped = await OperationsTeamModel.findOneAndUpdate(
        { _id: team._id, revision: body.expectedRevision },
        { $inc: { revision: 1 }, $set: { updatedBy: access.userId } },
        { new: true },
      );
      if (!bumped) {
        staleRevisionError();
      }
    }

    await OperationsTeamUserModel.updateOne(
      { _id: memberId, teamId: team._id },
      { $set: { teamId: null } },
    );

    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: access.roleName ?? "",
      action: "team.member_removed",
      targetType: "team",
      targetId: teamId,
      targetLabel: team.name,
      nextState: { userId: memberId },
    });

    return this.getById(access, teamId);
  }

  async listMembers(
    access: OperationsResolvedAccess,
    teamId: string,
    query: ListTeamMembersQuery,
  ) {
    assertFineOrCoarsePermission(
      access,
      TEAM_TEAMS_MEMBERS_VIEW_KEY,
      "team",
      "read",
    );
    const team = await OperationsTeamModel.findById(teamId).lean();
    if (!team) {
      throw new AppError("Team not found.", HTTP_STATUS.NOT_FOUND, {
        code: TEAM_ERROR_CODES.TEAM_NOT_FOUND,
      });
    }
    await assertCanAccessTeam(access, team);

    const filter: Record<string, unknown> = { teamId };
    if (query.status !== "all") {
      filter.status = query.status;
    }
    if (!access.isSuperAdmin && access.roleId) {
      const descendants = await getRoleDescendantIds(access.roleId);
      filter.$or = [
        { _id: access.userId },
        { roleId: { $in: [access.roleId, ...descendants] } },
      ];
    }
    if (query.search.trim()) {
      const pattern = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchFields: Record<string, unknown>[] = [
        { fullName: { $regex: pattern, $options: "i" } },
      ];
      if (canViewOperationsMemberEmail(access)) {
        searchFields.push({ email: { $regex: pattern, $options: "i" } });
      }
      if (canViewOperationsMemberMobile(access)) {
        searchFields.push({ mobileNumber: { $regex: pattern, $options: "i" } });
      }
      filter.$and = [{ $or: searchFields }];
    }

    const total = await OperationsTeamUserModel.countDocuments(filter);
    const pagination = buildListPagination(query.page, query.limit, total);
    const members = await OperationsTeamUserModel.find(filter)
      .select(
        "fullName email mobileNumber status role roleId departmentId orgUnitId lastActiveAt createdAt",
      )
      .sort({ fullName: 1 })
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .lean();

    const showMobile = canViewOperationsMemberMobile(access);
    const showEmail = canViewOperationsMemberEmail(access);

    return {
      teamId,
      members: members.map((member) => ({
        id: String(member._id),
        fullName: member.fullName,
        ...sanitizeMemberContactFields({
          email: member.email,
          mobileNumber: member.mobileNumber,
          canViewEmail: showEmail,
          canViewMobile: showMobile,
        }),
        status: member.status,
        role: member.role,
        roleId: member.roleId ? String(member.roleId) : null,
        departmentId: member.departmentId ? String(member.departmentId) : null,
        orgUnitId: member.orgUnitId ? String(member.orgUnitId) : null,
        lastActiveAt: member.lastActiveAt?.toISOString() ?? null,
        createdAt: member.createdAt?.toISOString() ?? null,
        isLead: team.leadUserId
          ? String(team.leadUserId) === String(member._id)
          : false,
      })),
      pagination,
    };
  }

  async workSummary(access: OperationsResolvedAccess, teamId: string) {
    assertFineOrCoarsePermission(access, TEAM_TEAMS_VIEW_KEY, "team", "read");
    const team = await OperationsTeamModel.findById(teamId).lean();
    if (!team) {
      throw new AppError("Team not found.", HTTP_STATUS.NOT_FOUND, {
        code: TEAM_ERROR_CODES.TEAM_NOT_FOUND,
      });
    }
    await assertCanAccessTeam(access, team);
    const members = await OperationsTeamUserModel.find({
      teamId,
      status: "active",
    })
      .select("_id")
      .lean();
    const memberIds = members.map((row) => row._id);
    if (memberIds.length === 0) {
      return {
        open: 0,
        inProgress: 0,
        waiting: 0,
        completed: 0,
        overdue: 0,
      };
    }
    const now = new Date();
    const [open, inProgress, waiting, completed, overdue] = await Promise.all([
      OperationsWorkItemModel.countDocuments({
        assignedToUserId: { $in: memberIds },
        status: { $in: [...OPEN_WORK_STATUSES] },
      }),
      OperationsWorkItemModel.countDocuments({
        assignedToUserId: { $in: memberIds },
        status: "in_progress",
      }),
      OperationsWorkItemModel.countDocuments({
        assignedToUserId: { $in: memberIds },
        status: "waiting",
      }),
      OperationsWorkItemModel.countDocuments({
        assignedToUserId: { $in: memberIds },
        status: "completed",
      }),
      OperationsWorkItemModel.countDocuments({
        assignedToUserId: { $in: memberIds },
        status: { $in: [...OPEN_WORK_STATUSES] },
        dueAt: { $ne: null, $lt: now },
      }),
    ]);
    return { open, inProgress, waiting, completed, overdue };
  }
}

export const operationsTeamsService = new OperationsTeamsService();

/** Used by organization overview to count teams in a location subtree. */
export async function countActiveTeamsInOrgUnits(
  orgUnitIds: mongoose.Types.ObjectId[],
): Promise<number> {
  if (orgUnitIds.length === 0) return 0;
  return OperationsTeamModel.countDocuments({
    status: "active",
    orgUnitId: { $in: orgUnitIds },
  });
}

export async function listActiveTeamsInOrgUnits(
  orgUnitIds: mongoose.Types.ObjectId[],
  limit = 50,
) {
  if (orgUnitIds.length === 0) return [];
  const teams = (await OperationsTeamModel.find({
    status: "active",
    orgUnitId: { $in: orgUnitIds },
  })
    .sort({ name: 1 })
    .limit(limit)
    .lean()) as LeanTeam[];
  return hydrateTeams(teams);
}

void loadOrgUnitAncestry;
