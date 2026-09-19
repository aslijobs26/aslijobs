import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { INDIA_STATE_LABELS } from "../employers/india-state-normalize.js";
import { OperationsDepartmentModel } from "../rbac/operations-department.model.js";
import { recordOperationsAuditEvent } from "../rbac/operations-audit.service.js";
import { slugifyOperationsName } from "../rbac/operations-slug.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import {
  assertFineOrCoarsePermission,
  canViewOperationsMemberMobile,
  getRoleDescendantIds,
  operationsAccessCan,
  operationsAccessCanKey,
} from "../rbac/operations-access.service.js";
import {
  assertActorCanAccessOrgUnit,
  loadActorOrgSubtreeIds,
} from "../rbac/operations-org-scope.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import { OperationsRoleModel } from "../rbac/operations-role.model.js";
import {
  listActiveTeamsInOrgUnits,
} from "../teams/operations-teams.service.js";
import { OperationsTeamModel } from "../teams/operations-teams.model.js";
import {
  SETTINGS_UPDATE_KEY,
  SETTINGS_VIEW_KEY,
  TEAM_ORGANIZATION_ARCHIVE_KEY,
  TEAM_ORGANIZATION_CREATE_KEY,
  TEAM_ORGANIZATION_UPDATE_KEY,
  TEAM_ORGANIZATION_VIEW_KEY,
  TEAM_TEAMS_CREATE_KEY,
} from "../rbac/operations-permission-catalog.js";
import {
  OperationsOrgUnitModel,
  type OperationsOrgUnitType,
} from "./operations-org-unit.model.js";
import {
  INDIA_REGION_SEED,
  ORG_INDIA_SLUG,
  ORG_ROOT_SLUG,
} from "./operations-organization.constants.js";
import {
  canAttachOrgChild,
  rollupPeopleCounts,
  wouldCreateOrgCycle,
} from "./operations-organization-domain.js";
import type {
  CreateOrgUnitBody,
  ListOrgTreeQuery,
  OrgUnitPeopleQuery,
  UpdateOrgUnitBody,
  UpdateOrganizationSettingsBody,
} from "./operations-organization.validation.js";
import type {
  OperationsOrgOverviewResponse,
  OperationsOrgTreeNode,
  OperationsOrgUnitPublic,
} from "./operations-organization.types.js";

type LeanOrgUnit = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  type: OperationsOrgUnitType;
  parentId?: mongoose.Types.ObjectId | null;
  ancestorIds?: mongoose.Types.ObjectId[];
  depth: number;
  status: string;
  code?: string;
  timezone?: string;
  primaryOffice?: string;
  latitude?: number | null;
  longitude?: number | null;
  headUserId?: mongoose.Types.ObjectId | null;
  establishedAt?: Date | null;
  isSystemSeeded?: boolean;
  revision?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

function toId(value: mongoose.Types.ObjectId | string | null | undefined): string | null {
  if (!value) return null;
  return String(value);
}

function parseOptionalDate(value: string | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("Invalid establishedAt date.", HTTP_STATUS.BAD_REQUEST);
  }
  return date;
}

async function uniqueSlugUnderParent(
  name: string,
  parentId: string | null,
  excludeId?: string,
): Promise<string> {
  const base = slugifyOperationsName(name);
  if (!base) {
    throw new AppError("Organization unit name is invalid.", HTTP_STATUS.BAD_REQUEST);
  }
  let slug = base;
  let suffix = 2;
  while (
    await OperationsOrgUnitModel.exists({
      slug,
      parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
      status: "active",
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

async function loadHeadNames(
  headIds: Array<string | null>,
): Promise<Map<string, string>> {
  const ids = [...new Set(headIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return new Map();
  const users = await OperationsTeamUserModel.find({
    _id: { $in: ids },
  })
    .select("_id fullName")
    .lean();
  return new Map(users.map((user) => [String(user._id), user.fullName]));
}

async function countPeopleByOrgUnit(): Promise<Map<string, number>> {
  const rows = await OperationsTeamUserModel.aggregate<{
    _id: mongoose.Types.ObjectId | null;
    count: number;
  }>([
    {
      $match: {
        status: "active",
        orgUnitId: { $ne: null },
      },
    },
    { $group: { _id: "$orgUnitId", count: { $sum: 1 } } },
  ]);
  return new Map(
    rows
      .filter((row) => row._id)
      .map((row) => [String(row._id), row.count]),
  );
}

async function countUnassignedActivePeople(): Promise<number> {
  return OperationsTeamUserModel.countDocuments({
    status: "active",
    $or: [{ orgUnitId: null }, { orgUnitId: { $exists: false } }],
  });
}

function toPublicUnit(
  doc: LeanOrgUnit,
  input: {
    peopleCount: number;
    childCount: number;
    headName: string | null;
  },
): OperationsOrgUnitPublic {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    type: doc.type,
    parentId: toId(doc.parentId),
    ancestorIds: (doc.ancestorIds ?? []).map((id) => String(id)),
    depth: doc.depth,
    status: doc.status,
    code: doc.code ?? "",
    timezone: doc.timezone ?? "Asia/Kolkata",
    primaryOffice: doc.primaryOffice ?? "",
    latitude: doc.latitude ?? null,
    longitude: doc.longitude ?? null,
    headUserId: toId(doc.headUserId),
    headName: input.headName,
    establishedAt: doc.establishedAt?.toISOString() ?? null,
    peopleCount: input.peopleCount,
    childCount: input.childCount,
    isSystemSeeded: Boolean(doc.isSystemSeeded),
    revision: doc.revision ?? 1,
    createdAt: doc.createdAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
  };
}

class OperationsOrganizationService {
  private seedPromise: Promise<void> | null = null;

  async ensureSeeded(actorUserId?: string): Promise<void> {
    if (!this.seedPromise) {
      this.seedPromise = (async () => {
        await this.seedHierarchyIfEmpty(actorUserId);
        // Hierarchy may already exist from an older seed that omitted states
        // (e.g. Telangana). Fill gaps without wiping user data.
        await this.reconcileMissingSeededStates(actorUserId);
      })().finally(() => {
        this.seedPromise = null;
      });
    }
    await this.seedPromise;
  }

  private async seedHierarchyIfEmpty(actorUserId?: string): Promise<void> {
    const existing = await OperationsOrgUnitModel.countDocuments({
      status: "active",
    });
    if (existing > 0) return;

    const actor =
      actorUserId && mongoose.isValidObjectId(actorUserId)
        ? new mongoose.Types.ObjectId(actorUserId)
        : null;

    const global = await OperationsOrgUnitModel.create({
      name: "ASLI Global",
      slug: ORG_ROOT_SLUG,
      type: "global",
      parentId: null,
      ancestorIds: [],
      depth: 0,
      status: "active",
      timezone: "Asia/Kolkata",
      isSystemSeeded: true,
      establishedAt: new Date("2020-01-01T00:00:00.000Z"),
      createdBy: actor,
      updatedBy: actor,
    });

    const india = await OperationsOrgUnitModel.create({
      name: "India",
      slug: ORG_INDIA_SLUG,
      type: "country",
      parentId: global._id,
      ancestorIds: [global._id],
      depth: 1,
      status: "active",
      code: "IN",
      timezone: "Asia/Kolkata",
      isSystemSeeded: true,
      establishedAt: new Date("2020-01-01T00:00:00.000Z"),
      createdBy: actor,
      updatedBy: actor,
    });

    const stateToRegion = new Map<string, string>();
    for (const region of INDIA_REGION_SEED) {
      for (const state of region.states) {
        stateToRegion.set(state, region.slug);
      }
    }

    const regionDocs = new Map<string, mongoose.Types.ObjectId>();
    for (const region of INDIA_REGION_SEED) {
      const doc = await OperationsOrgUnitModel.create({
        name: region.name,
        slug: region.slug,
        type: "region",
        parentId: india._id,
        ancestorIds: [global._id, india._id],
        depth: 2,
        status: "active",
        timezone: "Asia/Kolkata",
        isSystemSeeded: true,
        createdBy: actor,
        updatedBy: actor,
      });
      regionDocs.set(region.slug, doc._id);
    }

    for (const stateName of INDIA_STATE_LABELS) {
      const regionSlug = stateToRegion.get(stateName);
      const regionId = regionSlug ? regionDocs.get(regionSlug) : null;
      const parentId = regionId ?? india._id;
      const ancestorIds = regionId
        ? [global._id, india._id, regionId]
        : [global._id, india._id];
      await OperationsOrgUnitModel.create({
        name: stateName,
        slug: slugifyOperationsName(stateName),
        type: "state",
        parentId,
        ancestorIds,
        depth: ancestorIds.length,
        status: "active",
        timezone: "Asia/Kolkata",
        isSystemSeeded: true,
        createdBy: actor,
        updatedBy: actor,
      });
    }

    await recordOperationsAuditEvent({
      actorUserId: actorUserId ?? "system",
      actorName: "System",
      action: "organization.seeded",
      targetType: "organization",
      targetId: String(global._id),
      targetLabel: "ASLI Global",
      metadata: {
        countries: 1,
        regions: INDIA_REGION_SEED.length,
        states: INDIA_STATE_LABELS.length,
      },
    });
  }

  /**
   * Ensures every seeded region/state exists under India.
   * Safe for existing DBs: only creates missing units, restores archived
   * system-seeded states that match the seed list, and reparents orphaned
   * system-seeded states to the correct region.
   */
  private async reconcileMissingSeededStates(
    actorUserId?: string,
  ): Promise<void> {
    const india = await OperationsOrgUnitModel.findOne({
      slug: ORG_INDIA_SLUG,
      type: "country",
    });
    if (!india) return;

    const globalId =
      (india.ancestorIds?.[0] as mongoose.Types.ObjectId | undefined) ?? null;
    const actor =
      actorUserId && mongoose.isValidObjectId(actorUserId)
        ? new mongoose.Types.ObjectId(actorUserId)
        : null;

    const regionDocs = new Map<string, mongoose.Types.ObjectId>();
    for (const region of INDIA_REGION_SEED) {
      let regionDoc = await OperationsOrgUnitModel.findOne({
        slug: region.slug,
        type: "region",
      });
      if (!regionDoc) {
        regionDoc = await OperationsOrgUnitModel.create({
          name: region.name,
          slug: region.slug,
          type: "region",
          parentId: india._id,
          ancestorIds: globalId ? [globalId, india._id] : [india._id],
          depth: globalId ? 2 : 1,
          status: "active",
          timezone: "Asia/Kolkata",
          isSystemSeeded: true,
          createdBy: actor,
          updatedBy: actor,
        });
      } else if (regionDoc.status === "archived") {
        regionDoc.status = "active";
        regionDoc.archivedAt = null;
        regionDoc.archivedBy = null;
        regionDoc.updatedBy = actor;
        await regionDoc.save();
      }
      regionDocs.set(region.slug, regionDoc._id);
    }

    let created = 0;
    let restored = 0;
    let reparented = 0;

    for (const region of INDIA_REGION_SEED) {
      const regionId = regionDocs.get(region.slug);
      if (!regionId) continue;
      const ancestorIds = globalId
        ? [globalId, india._id, regionId]
        : [india._id, regionId];

      for (const stateName of region.states) {
        const slug = slugifyOperationsName(stateName);
        let stateDoc = await OperationsOrgUnitModel.findOne({
          type: "state",
          $or: [{ slug }, { name: stateName }],
        });

        if (!stateDoc) {
          await OperationsOrgUnitModel.create({
            name: stateName,
            slug,
            type: "state",
            parentId: regionId,
            ancestorIds,
            depth: ancestorIds.length,
            status: "active",
            timezone: "Asia/Kolkata",
            isSystemSeeded: true,
            createdBy: actor,
            updatedBy: actor,
          });
          created += 1;
          continue;
        }

        let changed = false;
        if (stateDoc.status === "archived" && stateDoc.isSystemSeeded) {
          stateDoc.status = "active";
          stateDoc.archivedAt = null;
          stateDoc.archivedBy = null;
          restored += 1;
          changed = true;
        }

        const parentMismatch =
          !stateDoc.parentId || String(stateDoc.parentId) !== String(regionId);
        if (parentMismatch && stateDoc.isSystemSeeded) {
          stateDoc.parentId = regionId;
          stateDoc.ancestorIds = ancestorIds;
          stateDoc.depth = ancestorIds.length;
          reparented += 1;
          changed = true;
        }

        if (changed) {
          stateDoc.updatedBy = actor;
          await stateDoc.save();
        }
      }
    }

    if (created > 0 || restored > 0 || reparented > 0) {
      await recordOperationsAuditEvent({
        actorUserId: actorUserId ?? "system",
        actorName: "System",
        action: "organization.seed_reconciled",
        targetType: "organization",
        targetId: String(india._id),
        targetLabel: india.name,
        metadata: { created, restored, reparented },
      });
    }
  }

  async getTree(
    query: ListOrgTreeQuery,
    access: OperationsResolvedAccess,
  ): Promise<{
    roots: OperationsOrgTreeNode[];
    scopeId: string | null;
    search: string;
  }> {
    assertFineOrCoarsePermission(
      access,
      TEAM_ORGANIZATION_VIEW_KEY,
      "team",
      "read",
    );
    await this.ensureSeeded(access.userId);

    const actorSubtree = await loadActorOrgSubtreeIds(access);
    const filter: Record<string, unknown> = {};
    if (query.status !== "all") {
      filter.status = query.status;
    }

    const units = (await OperationsOrgUnitModel.find(filter)
      .sort({ depth: 1, name: 1 })
      .lean()) as LeanOrgUnit[];

    const search = query.search.trim().toLowerCase();
    let visibleIds: Set<string> | null = null;
    if (search) {
      visibleIds = new Set<string>();
      for (const unit of units) {
        if (unit.name.toLowerCase().includes(search)) {
          visibleIds.add(String(unit._id));
          for (const ancestorId of unit.ancestorIds ?? []) {
            visibleIds.add(String(ancestorId));
          }
        }
      }
    }

    const scopedUnits = (() => {
      const scopeId = query.scopeId.trim();
      let next = units;
      if (actorSubtree) {
        const allowed = new Set(actorSubtree);
        next = next.filter((unit) => allowed.has(String(unit._id)));
      }
      if (!scopeId || !mongoose.isValidObjectId(scopeId)) {
        return next;
      }
      return next.filter(
        (unit) =>
          String(unit._id) === scopeId ||
          (unit.ancestorIds ?? []).some((id) => String(id) === scopeId),
      );
    })();

    const filtered = visibleIds
      ? scopedUnits.filter((unit) => visibleIds!.has(String(unit._id)))
      : scopedUnits;

    const directPeople = await countPeopleByOrgUnit();
    const unassigned = await countUnassignedActivePeople();
    const childCountByParent = new Map<string, number>();
    for (const unit of filtered) {
      const parentId = toId(unit.parentId);
      if (!parentId) continue;
      childCountByParent.set(
        parentId,
        (childCountByParent.get(parentId) ?? 0) + 1,
      );
    }

    const rolled = rollupPeopleCounts(
      filtered.map((unit) => ({
        id: String(unit._id),
        parentId: toId(unit.parentId),
        directCount: directPeople.get(String(unit._id)) ?? 0,
      })),
    );

    const heads = await loadHeadNames(
      filtered.map((unit) => toId(unit.headUserId)),
    );

    const nodeMap = new Map<string, OperationsOrgTreeNode>();
    for (const unit of filtered) {
      const id = String(unit._id);
      let peopleCount = rolled.get(id) ?? 0;
      if (unit.type === "global") {
        peopleCount += unassigned;
      }
      nodeMap.set(id, {
        ...toPublicUnit(unit, {
          peopleCount,
          childCount: childCountByParent.get(id) ?? 0,
          headName: unit.headUserId
            ? (heads.get(String(unit.headUserId)) ?? null)
            : null,
        }),
        children: [],
      });
    }

    const roots: OperationsOrgTreeNode[] = [];
    for (const unit of filtered) {
      const id = String(unit._id);
      const node = nodeMap.get(id);
      if (!node) continue;
      const parentId = toId(unit.parentId);
      if (parentId && nodeMap.has(parentId)) {
        nodeMap.get(parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return {
      roots,
      scopeId: query.scopeId.trim() || null,
      search: query.search.trim(),
    };
  }

  async getUnit(
    unitId: string,
    access: OperationsResolvedAccess,
  ): Promise<OperationsOrgUnitPublic> {
    assertFineOrCoarsePermission(
      access,
      TEAM_ORGANIZATION_VIEW_KEY,
      "team",
      "read",
    );
    await assertActorCanAccessOrgUnit(access, unitId);
    await this.ensureSeeded(access.userId);
    const unit = (await OperationsOrgUnitModel.findById(unitId).lean()) as
      | LeanOrgUnit
      | null;
    if (!unit) {
      throw new AppError("Organization unit not found.", HTTP_STATUS.NOT_FOUND);
    }

    const [directPeople, unassigned, childCount, heads] = await Promise.all([
      countPeopleByOrgUnit(),
      countUnassignedActivePeople(),
      OperationsOrgUnitModel.countDocuments({
        parentId: unit._id,
        status: "active",
      }),
      loadHeadNames([toId(unit.headUserId)]),
    ]);

    const allUnits = (await OperationsOrgUnitModel.find({
      status: "active",
    })
      .select("_id parentId")
      .lean()) as Array<{
      _id: mongoose.Types.ObjectId;
      parentId?: mongoose.Types.ObjectId | null;
    }>;

    const rolled = rollupPeopleCounts(
      allUnits.map((row) => ({
        id: String(row._id),
        parentId: toId(row.parentId),
        directCount: directPeople.get(String(row._id)) ?? 0,
      })),
    );

    let peopleCount = rolled.get(String(unit._id)) ?? 0;
    if (unit.type === "global") {
      peopleCount += unassigned;
    }

    return toPublicUnit(unit, {
      peopleCount,
      childCount,
      headName: unit.headUserId
        ? (heads.get(String(unit.headUserId)) ?? null)
        : null,
    });
  }

  async getOverview(
    unitId: string,
    access: OperationsResolvedAccess,
  ): Promise<OperationsOrgOverviewResponse> {
    const unit = await this.getUnit(unitId, access);
    const unitObjectId = new mongoose.Types.ObjectId(unitId);

    const descendantIds = (
      await OperationsOrgUnitModel.find({
        status: "active",
        $or: [{ _id: unitObjectId }, { ancestorIds: unitObjectId }],
      })
        .select("_id type name latitude longitude parentId ancestorIds")
        .lean()
    ) as Array<{
      _id: mongoose.Types.ObjectId;
      type: OperationsOrgUnitType;
      name: string;
      latitude?: number | null;
      longitude?: number | null;
      parentId?: mongoose.Types.ObjectId | null;
      ancestorIds?: mongoose.Types.ObjectId[];
    }>;

    const scopeIds = descendantIds.map((row) => row._id);
    const scopeIdStrings = new Set(scopeIds.map((id) => String(id)));
    const peopleMatch =
      unit.type === "global"
        ? { status: "active" as const }
        : { status: "active" as const, orgUnitId: { $in: scopeIds } };

    const [peopleByDept, cityCount, scopedTeams, peopleTotal] =
      await Promise.all([
        OperationsTeamUserModel.aggregate<{
          _id: mongoose.Types.ObjectId | null;
          count: number;
        }>([
          { $match: peopleMatch },
          { $group: { _id: "$departmentId", count: { $sum: 1 } } },
        ]),
        OperationsOrgUnitModel.countDocuments({
          status: "active",
          type: "city",
          $or: [{ _id: unitObjectId }, { ancestorIds: unitObjectId }],
        }),
        listActiveTeamsInOrgUnits(scopeIds, 80),
        OperationsTeamUserModel.countDocuments(peopleMatch),
      ]);

    const scopedDepartmentIds = [
      ...new Set(scopedTeams.map((team) => team.departmentId).filter(Boolean)),
    ];
    const departments =
      scopedDepartmentIds.length === 0
        ? []
        : await OperationsDepartmentModel.find({
            _id: { $in: scopedDepartmentIds },
            status: "active",
          })
            .select("_id name status")
            .sort({ name: 1 })
            .lean();

    const deptNameById = new Map(
      departments.map((dept) => [String(dept._id), dept.name]),
    );

    const peopleByDepartment = peopleByDept
      .map((row) => {
        const id = row._id ? String(row._id) : "unassigned";
        const label = row._id
          ? (deptNameById.get(String(row._id)) ?? "Unknown")
          : "Unassigned";
        return {
          id,
          label,
          count: row.count,
          percent:
            peopleTotal > 0
              ? Math.round((row.count / peopleTotal) * 1000) / 10
              : null,
        };
      })
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

    const teamCountByDept = new Map<string, number>();
    for (const team of scopedTeams) {
      teamCountByDept.set(
        team.departmentId,
        (teamCountByDept.get(team.departmentId) ?? 0) + 1,
      );
    }

    const overviewDepartments = departments.map((dept) => ({
      id: String(dept._id),
      name: dept.name,
      teamCount: teamCountByDept.get(String(dept._id)) ?? 0,
      memberCount:
        peopleByDept.find((row) => String(row._id) === String(dept._id))
          ?.count ?? 0,
      status: dept.status,
    }));

    const roles =
      scopedDepartmentIds.length === 0
        ? []
        : await OperationsRoleModel.find({
            status: "active",
            departmentId: { $in: scopedDepartmentIds },
          })
            .select("name departmentId")
            .sort({ name: 1 })
            .limit(50)
            .lean();
    const roleMemberCounts =
      roles.length === 0
        ? []
        : await OperationsTeamUserModel.aggregate<{
            _id: mongoose.Types.ObjectId;
            count: number;
          }>([
            {
              $match: {
                roleId: { $in: roles.map((role) => role._id) },
              },
            },
            { $group: { _id: "$roleId", count: { $sum: 1 } } },
          ]);
    const roleCountById = new Map(
      roleMemberCounts.map((row) => [String(row._id), row.count]),
    );
    const overviewRoles = roles.map((role) => ({
      id: String(role._id),
      name: role.name,
      departmentName: role.departmentId
        ? (deptNameById.get(String(role.departmentId)) ?? null)
        : null,
      memberCount: roleCountById.get(String(role._id)) ?? 0,
    }));

    const teams = scopedTeams.map((team) => ({
      id: team.id,
      name: team.name,
      departmentName: team.departmentName ?? "",
      peopleCount: team.activeMemberCount,
      leadName: team.leadName,
      status: team.status,
    }));

    const mapPoints = descendantIds
      .filter(
        (row) =>
          (row.type === "city" || row.type === "state" || row.type === "office") &&
          scopeIdStrings.has(String(row._id)),
      )
      .map((row) => ({
        id: String(row._id),
        name: row.name,
        type: row.type,
        peopleCount: 0,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
      }));

    const directPeople = await countPeopleByOrgUnit();
    for (const point of mapPoints) {
      point.peopleCount = directPeople.get(point.id) ?? 0;
    }

    const ancestors = (await OperationsOrgUnitModel.find({
      _id: { $in: unit.ancestorIds },
    })
      .select("_id name type")
      .lean()) as Array<{
      _id: mongoose.Types.ObjectId;
      name: string;
      type: string;
    }>;
    const ancestorById = new Map(
      ancestors.map((row) => [String(row._id), row]),
    );
    const breadcrumbs = [
      ...unit.ancestorIds
        .map((id) => ancestorById.get(id))
        .filter((row): row is { _id: mongoose.Types.ObjectId; name: string; type: string } =>
          Boolean(row),
        )
        .map((row) => ({
          id: String(row._id),
          name: row.name,
          type: row.type,
        })),
      { id: unit.id, name: unit.name, type: unit.type },
    ];

    const region =
      breadcrumbs.find((row) => row.type === "region")?.name ?? null;
    const country =
      breadcrumbs.find((row) => row.type === "country")?.name ?? null;
    const state =
      breadcrumbs.find((row) => row.type === "state")?.name ??
      (unit.type === "state" ? unit.name : null);

    const canManageTeam = operationsAccessCanKey(access, TEAM_TEAMS_CREATE_KEY);
    const canManageDepartments = operationsAccessCan(
      access,
      "departments",
      "create",
    );
    const canManageRoles = operationsAccessCan(access, "roles", "read");

    return {
      unit,
      breadcrumbs,
      kpis: [
        {
          id: "people",
          label: "Total People",
          value: unit.peopleCount,
          trendPercent: null,
          trendDirection: "neutral",
          caption: "People in this location",
        },
        {
          id: "teams",
          label: "Teams",
          value: teams.length,
          trendPercent: null,
          trendDirection: "neutral",
          caption: "Operational teams in this location",
        },
        {
          id: "departments",
          label: "Departments",
          value: overviewDepartments.length,
          trendPercent: null,
          trendDirection: "neutral",
          caption: "Departments with teams here",
        },
        {
          id: "cities",
          label: "Cities",
          value: cityCount,
          trendPercent: null,
          trendDirection: "neutral",
          caption: "Cities in this scope",
        },
      ],
      keyInfo: {
        region,
        country,
        state,
        head: unit.headUserId
          ? { id: unit.headUserId, name: unit.headName ?? "Unknown" }
          : null,
        establishedAt: unit.establishedAt,
        totalPeople: unit.peopleCount,
        totalTeams: teams.length,
        primaryOffice: unit.primaryOffice || null,
        coordinates:
          unit.latitude != null && unit.longitude != null
            ? { latitude: unit.latitude, longitude: unit.longitude }
            : null,
        timezone: unit.timezone,
      },
      mapPoints,
      teams,
      departments: overviewDepartments,
      roles: overviewRoles,
      peopleByDepartment,
      quickActions: [
        {
          id: "add-team",
          label: "Add Team",
          href: "/operations/teams",
          available: canManageTeam,
        },
        {
          id: "add-department",
          label: "Add Department",
          href: "/operations/departments",
          available: canManageDepartments,
        },
        {
          id: "assign-people",
          label: "Assign People",
          href: "/operations/team",
          available: operationsAccessCan(access, "team", "create"),
        },
        {
          id: "manage-roles",
          label: "Manage Roles",
          href: "/operations/roles",
          available: canManageRoles,
        },
        {
          id: "view-reports",
          label: "View Reports",
          href: "/operations/analytics",
          available: operationsAccessCan(access, "team", "read"),
        },
        {
          id: "location-settings",
          label: "Location Settings",
          href: "/operations/settings",
          available: operationsAccessCanKey(access, SETTINGS_UPDATE_KEY),
        },
      ],
    };
  }

  async listPeople(
    unitId: string,
    query: OrgUnitPeopleQuery,
    access: OperationsResolvedAccess,
  ) {
    const unit = await this.getUnit(unitId, access);
    const unitObjectId = new mongoose.Types.ObjectId(unitId);
    const scopeIds =
      unit.type === "global"
        ? null
        : (
            await OperationsOrgUnitModel.find({
              status: "active",
              $or: [{ _id: unitObjectId }, { ancestorIds: unitObjectId }],
            })
              .select("_id")
              .lean()
          ).map((row) => row._id);

    const filter: Record<string, unknown> = {};
    if (query.status !== "all") {
      filter.status = query.status;
    }
    if (scopeIds) {
      filter.orgUnitId = { $in: scopeIds };
    }
    if (!access.isSuperAdmin && access.roleId) {
      const descendants = await getRoleDescendantIds(access.roleId);
      const roleScope = {
        $or: [
          { _id: access.userId },
          { roleId: { $in: [access.roleId, ...descendants] } },
        ],
      };
      filter.$and = [roleScope];
    } else if (!access.isSuperAdmin && !access.roleId) {
      filter._id = access.userId;
    }
    if (!access.isSuperAdmin && access.departmentId) {
      filter.departmentId = access.departmentId;
    }
    if (query.search.trim()) {
      const regex = new RegExp(query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const searchClause = {
        $or: [{ fullName: regex }, { email: regex }, { mobileNumber: regex }],
      };
      if (Array.isArray(filter.$and)) {
        filter.$and.push(searchClause);
      } else {
        filter.$or = searchClause.$or;
      }
    }

    const skip = (query.page - 1) * query.limit;
    const [total, items] = await Promise.all([
      OperationsTeamUserModel.countDocuments(filter),
      OperationsTeamUserModel.find(filter)
        .select(
          "_id fullName email mobileNumber status role roleId departmentId orgUnitId teamId lastActiveAt createdAt",
        )
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
    ]);

    const showMobile = canViewOperationsMemberMobile(access);
    return {
      unitId: unit.id,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
      items: items.map((item) => ({
        id: String(item._id),
        fullName: item.fullName,
        email: item.email ?? null,
        ...(showMobile ? { mobileNumber: item.mobileNumber } : {}),
        status: item.status,
        role: item.role,
        roleId: item.roleId ? String(item.roleId) : null,
        departmentId: item.departmentId ? String(item.departmentId) : null,
        orgUnitId: item.orgUnitId ? String(item.orgUnitId) : null,
        teamId: item.teamId ? String(item.teamId) : null,
        lastActiveAt: item.lastActiveAt?.toISOString() ?? null,
        createdAt: item.createdAt?.toISOString() ?? null,
      })),
    };
  }

  async createUnit(access: OperationsResolvedAccess, body: CreateOrgUnitBody) {
    assertFineOrCoarsePermission(
      access,
      TEAM_ORGANIZATION_CREATE_KEY,
      "team",
      "create",
    );
    await this.ensureSeeded(access.userId);
    if (body.parentId) {
      await assertActorCanAccessOrgUnit(access, body.parentId);
    }

    let parent: LeanOrgUnit | null = null;
    if (body.parentId) {
      parent = (await OperationsOrgUnitModel.findById(body.parentId).lean()) as
        | LeanOrgUnit
        | null;
      if (!parent || parent.status !== "active") {
        throw new AppError("Parent organization unit not found.", HTTP_STATUS.NOT_FOUND);
      }
      if (!canAttachOrgChild(parent.type, body.type)) {
        throw new AppError(
          `Cannot create a ${body.type} under a ${parent.type}.`,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
    } else if (body.type !== "global") {
      throw new AppError(
        "Only a global unit can be created without a parent.",
        HTTP_STATUS.BAD_REQUEST,
      );
    } else {
      const existingGlobal = await OperationsOrgUnitModel.exists({
        type: "global",
        status: "active",
      });
      if (existingGlobal) {
        throw new AppError(
          "A global organization unit already exists.",
          HTTP_STATUS.CONFLICT,
        );
      }
    }

    if (body.headUserId) {
      const head = await OperationsTeamUserModel.exists({
        _id: body.headUserId,
        status: "active",
      });
      if (!head) {
        throw new AppError("Head user not found.", HTTP_STATUS.BAD_REQUEST);
      }
    }

    const parentId = parent ? String(parent._id) : null;
    const ancestorIds = parent
      ? [...(parent.ancestorIds ?? []).map(String), String(parent._id)]
      : [];
    const created = await OperationsOrgUnitModel.create({
      name: body.name.trim(),
      slug: await uniqueSlugUnderParent(body.name, parentId),
      type: body.type,
      parentId: parent?._id ?? null,
      ancestorIds: ancestorIds.map((id) => new mongoose.Types.ObjectId(id)),
      depth: ancestorIds.length,
      status: "active",
      code: body.code?.trim() ?? "",
      timezone: body.timezone?.trim() || parent?.timezone || "Asia/Kolkata",
      primaryOffice: body.primaryOffice?.trim() ?? "",
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      headUserId: body.headUserId ?? null,
      establishedAt: parseOptionalDate(body.establishedAt),
      isSystemSeeded: false,
      createdBy: access.userId,
      updatedBy: access.userId,
    });

    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: access.roleName ?? "Operations",
      action: "organization.unit_created",
      targetType: "organization_unit",
      targetId: String(created._id),
      targetLabel: created.name,
      nextState: {
        type: created.type,
        parentId,
      },
    });

    return this.getUnit(String(created._id), access);
  }

  async updateUnit(
    unitId: string,
    access: OperationsResolvedAccess,
    body: UpdateOrgUnitBody,
  ) {
    assertFineOrCoarsePermission(
      access,
      body.status === "archived"
        ? TEAM_ORGANIZATION_ARCHIVE_KEY
        : TEAM_ORGANIZATION_UPDATE_KEY,
      "team",
      body.status === "archived" ? "delete" : "update",
    );
    await assertActorCanAccessOrgUnit(access, unitId);
    await this.ensureSeeded(access.userId);
    const unit = await OperationsOrgUnitModel.findById(unitId);
    if (!unit) {
      throw new AppError("Organization unit not found.", HTTP_STATUS.NOT_FOUND);
    }

    if (body.revision != null && body.revision !== unit.revision) {
      throw new AppError(
        "This organization unit was updated by someone else. Refresh and try again.",
        HTTP_STATUS.CONFLICT,
      );
    }

    const previous = {
      name: unit.name,
      parentId: toId(unit.parentId),
      status: unit.status,
      headUserId: toId(unit.headUserId),
    };

    if (body.parentId !== undefined) {
      const newParentId = body.parentId;
      if (newParentId) {
        const parent = (await OperationsOrgUnitModel.findById(newParentId).lean()) as
          | LeanOrgUnit
          | null;
        if (!parent || parent.status !== "active") {
          throw new AppError("Parent organization unit not found.", HTTP_STATUS.NOT_FOUND);
        }
        if (!canAttachOrgChild(parent.type, unit.type as OperationsOrgUnitType)) {
          throw new AppError(
            `Cannot move a ${unit.type} under a ${parent.type}.`,
            HTTP_STATUS.BAD_REQUEST,
          );
        }
        const parentAncestors = (parent.ancestorIds ?? []).map(String);
        if (
          wouldCreateOrgCycle(
            String(unit._id),
            String(parent._id),
            parentAncestors,
          )
        ) {
          throw new AppError(
            "Cannot move a unit under itself or one of its descendants.",
            HTTP_STATUS.BAD_REQUEST,
          );
        }
        unit.parentId = parent._id;
        unit.ancestorIds = [...(parent.ancestorIds ?? []), parent._id];
        unit.depth = unit.ancestorIds.length;
      } else if (unit.type !== "global") {
        throw new AppError(
          "Only the global unit can have no parent.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
    }

    if (body.name != null) {
      unit.name = body.name.trim();
      unit.slug = await uniqueSlugUnderParent(
        body.name,
        toId(unit.parentId),
        String(unit._id),
      );
    }
    if (body.code != null) unit.code = body.code.trim();
    if (body.timezone != null) unit.timezone = body.timezone.trim();
    if (body.primaryOffice != null) unit.primaryOffice = body.primaryOffice.trim();
    if (body.latitude !== undefined) unit.latitude = body.latitude;
    if (body.longitude !== undefined) unit.longitude = body.longitude;
    if (body.establishedAt !== undefined) {
      unit.establishedAt = parseOptionalDate(body.establishedAt);
    }
    if (body.headUserId !== undefined) {
      if (body.headUserId) {
        const head = await OperationsTeamUserModel.exists({
          _id: body.headUserId,
          status: "active",
        });
        if (!head) {
          throw new AppError("Head user not found.", HTTP_STATUS.BAD_REQUEST);
        }
      }
      unit.headUserId = body.headUserId
        ? new mongoose.Types.ObjectId(body.headUserId)
        : null;
    }
    if (body.status === "archived") {
      const childCount = await OperationsOrgUnitModel.countDocuments({
        parentId: unit._id,
        status: "active",
      });
      if (childCount > 0) {
        throw new AppError(
          `Cannot archive this unit while it has ${childCount} active child unit(s).`,
          HTTP_STATUS.CONFLICT,
        );
      }
      const peopleCount = await OperationsTeamUserModel.countDocuments({
        orgUnitId: unit._id,
        status: "active",
      });
      if (peopleCount > 0) {
        throw new AppError(
          `Cannot archive this unit while ${peopleCount} active people are assigned.`,
          HTTP_STATUS.CONFLICT,
        );
      }
      const teamCount = await OperationsTeamModel.countDocuments({
        orgUnitId: unit._id,
        status: "active",
      });
      if (teamCount > 0) {
        throw new AppError(
          `Cannot archive this unit while ${teamCount} active team(s) operate here.`,
          HTTP_STATUS.CONFLICT,
        );
      }
      unit.status = "archived";
      unit.archivedAt = new Date();
      unit.archivedBy = new mongoose.Types.ObjectId(access.userId);
    } else if (body.status === "active") {
      unit.status = "active";
      unit.archivedAt = null;
      unit.archivedBy = null;
    }

    unit.updatedBy = new mongoose.Types.ObjectId(access.userId);
    const revisionFilter =
      body.revision != null
        ? { _id: unit._id, revision: body.revision }
        : { _id: unit._id };
    const saved = await OperationsOrgUnitModel.findOneAndUpdate(
      revisionFilter,
      {
        $set: {
          name: unit.name,
          slug: unit.slug,
          parentId: unit.parentId,
          ancestorIds: unit.ancestorIds,
          depth: unit.depth,
          code: unit.code,
          timezone: unit.timezone,
          primaryOffice: unit.primaryOffice,
          latitude: unit.latitude,
          longitude: unit.longitude,
          establishedAt: unit.establishedAt,
          headUserId: unit.headUserId,
          status: unit.status,
          archivedAt: unit.archivedAt,
          archivedBy: unit.archivedBy,
          updatedBy: unit.updatedBy,
        },
        $inc: { revision: 1 },
      },
      { new: true },
    );
    if (!saved) {
      throw new AppError(
        "This organization unit was updated by someone else. Refresh and try again.",
        HTTP_STATUS.CONFLICT,
        { code: "STALE_REVISION" },
      );
    }

    // Rebuild descendant ancestor paths when parent changed.
    if (body.parentId !== undefined) {
      await this.rebuildDescendantPaths(String(unit._id));
    }

    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: access.roleName ?? "Operations",
      action:
        body.status === "archived"
          ? "organization.unit_archived"
          : body.parentId !== undefined
            ? "organization.unit_moved"
            : "organization.unit_updated",
      targetType: "organization_unit",
      targetId: String(unit._id),
      targetLabel: unit.name,
      previousState: previous,
      nextState: {
        name: unit.name,
        parentId: toId(unit.parentId),
        status: unit.status,
        headUserId: toId(unit.headUserId),
      },
    });

    return this.getUnit(String(unit._id), access);
  }

  async getSettings(access: OperationsResolvedAccess) {
    assertFineOrCoarsePermission(access, SETTINGS_VIEW_KEY, "settings", "read");
    await this.ensureSeeded(access.userId);
    const global = await OperationsOrgUnitModel.findOne({
      slug: ORG_ROOT_SLUG,
      type: "global",
    }).lean();
    if (!global) {
      throw new AppError("Organization root not found.", HTTP_STATUS.NOT_FOUND);
    }
    const countries = await OperationsOrgUnitModel.find({
      type: "country",
      status: "active",
    })
      .select("name")
      .sort({ name: 1 })
      .lean();
    const metadata = (global.metadata ?? {}) as { defaultCountryId?: string };
    const defaultCountryId =
      metadata.defaultCountryId &&
      countries.some((row) => String(row._id) === metadata.defaultCountryId)
        ? metadata.defaultCountryId
        : countries[0]
          ? String(countries[0]._id)
          : null;
    return {
      organizationName: global.name,
      defaultCountryId,
      defaultTimezone: global.timezone || "Asia/Kolkata",
      revision: global.revision ?? 1,
      countries: countries.map((row) => ({
        id: String(row._id),
        name: row.name,
      })),
    };
  }

  async updateSettings(
    access: OperationsResolvedAccess,
    body: UpdateOrganizationSettingsBody,
  ) {
    assertFineOrCoarsePermission(
      access,
      SETTINGS_UPDATE_KEY,
      "settings",
      "update",
    );
    await this.ensureSeeded(access.userId);
    const country = await OperationsOrgUnitModel.findOne({
      _id: body.defaultCountryId,
      type: "country",
      status: "active",
    }).lean();
    if (!country) {
      throw new AppError("Default country is invalid.", HTTP_STATUS.BAD_REQUEST);
    }

    const previous = await OperationsOrgUnitModel.findOne({
      slug: ORG_ROOT_SLUG,
      type: "global",
    }).lean();
    if (!previous) {
      throw new AppError("Organization root not found.", HTTP_STATUS.NOT_FOUND);
    }

    const updated = await OperationsOrgUnitModel.findOneAndUpdate(
      {
        _id: previous._id,
        revision: body.expectedRevision,
      },
      {
        $set: {
          name: body.organizationName.trim(),
          timezone: body.defaultTimezone.trim(),
          "metadata.defaultCountryId": body.defaultCountryId,
          updatedBy: access.userId,
        },
        $inc: { revision: 1 },
      },
      { new: true },
    );
    if (!updated) {
      throw new AppError(
        "Organization settings were updated by someone else. Refresh and try again.",
        HTTP_STATUS.CONFLICT,
        { code: "STALE_REVISION" },
      );
    }

    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: access.roleName ?? "",
      action: "settings.updated",
      targetType: "organization",
      targetId: String(updated._id),
      targetLabel: updated.name,
      previousState: {
        organizationName: previous.name,
        timezone: previous.timezone,
        defaultCountryId:
          (previous.metadata as { defaultCountryId?: string } | undefined)
            ?.defaultCountryId ?? null,
      },
      nextState: {
        organizationName: updated.name,
        timezone: updated.timezone,
        defaultCountryId: body.defaultCountryId,
      },
    });

    return this.getSettings(access);
  }

  private async rebuildDescendantPaths(rootId: string): Promise<void> {
    const root = (await OperationsOrgUnitModel.findById(rootId).lean()) as
      | LeanOrgUnit
      | null;
    if (!root) return;

    const children = (await OperationsOrgUnitModel.find({
      parentId: root._id,
    }).lean()) as LeanOrgUnit[];

    for (const child of children) {
      const ancestorIds = [...(root.ancestorIds ?? []), root._id];
      await OperationsOrgUnitModel.updateOne(
        { _id: child._id },
        {
          $set: {
            ancestorIds,
            depth: ancestorIds.length,
          },
        },
      );
      await this.rebuildDescendantPaths(String(child._id));
    }
  }
}

export const operationsOrganizationService =
  new OperationsOrganizationService();
