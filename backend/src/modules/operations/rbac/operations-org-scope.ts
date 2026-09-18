import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { OperationsOrgUnitModel } from "../organization/operations-org-unit.model.js";
import {
  canActorAccessDepartment,
  canActorAccessOrgUnit,
  TEAM_ERROR_CODES,
} from "../teams/operations-teams-domain.js";
import type { OperationsResolvedAccess } from "./operations-access.types.js";

export async function loadOrgSubtreeIds(
  unitId: string,
): Promise<string[]> {
  if (!mongoose.isValidObjectId(unitId)) {
    return [];
  }
  const rows = await OperationsOrgUnitModel.find({
    status: "active",
    $or: [{ _id: unitId }, { ancestorIds: unitId }],
  })
    .select("_id")
    .lean();
  return rows.map((row) => String(row._id));
}

export async function loadActorOrgSubtreeIds(
  access: OperationsResolvedAccess,
): Promise<string[] | null> {
  if (access.isSuperAdmin || !access.orgUnitId) {
    return null;
  }
  return loadOrgSubtreeIds(access.orgUnitId);
}

export async function assertActorCanAccessOrgUnit(
  access: OperationsResolvedAccess,
  targetUnitId: string,
): Promise<void> {
  if (access.isSuperAdmin || !access.orgUnitId) {
    return;
  }
  const subtree = await loadOrgSubtreeIds(access.orgUnitId);
  if (
    !canActorAccessOrgUnit({
      isSuperAdmin: access.isSuperAdmin,
      actorOrgUnitId: access.orgUnitId,
      actorSubtreeIds: subtree,
      targetUnitId,
    })
  ) {
    throw new AppError(
      "You cannot access organization data outside your location scope.",
      HTTP_STATUS.FORBIDDEN,
      { code: TEAM_ERROR_CODES.ORG_SCOPE_FORBIDDEN },
    );
  }
}

export function assertActorCanAccessDepartment(
  access: OperationsResolvedAccess,
  targetDepartmentId: string | null,
): void {
  if (
    !canActorAccessDepartment({
      isSuperAdmin: access.isSuperAdmin,
      actorDepartmentId: access.departmentId,
      targetDepartmentId,
    })
  ) {
    throw new AppError(
      "You cannot access records outside your department.",
      HTTP_STATUS.FORBIDDEN,
      { code: "DEPARTMENT_SCOPE_FORBIDDEN" },
    );
  }
}

export async function loadOrgUnitAncestry(unitId: string): Promise<{
  id: string;
  name: string;
  type: string;
  ancestorIds: string[];
  ancestors: Array<{ id: string; name: string; type: string }>;
} | null> {
  const unit = await OperationsOrgUnitModel.findById(unitId)
    .select("name type ancestorIds status")
    .lean();
  if (!unit) {
    return null;
  }
  const ancestorIds = (unit.ancestorIds ?? []).map((id) => String(id));
  const ancestors = ancestorIds.length
    ? ((await OperationsOrgUnitModel.find({
        _id: { $in: ancestorIds },
      })
        .select("name type")
        .lean()) as Array<{
        _id: mongoose.Types.ObjectId;
        name: string;
        type: string;
      }>)
    : [];
  const byId = new Map(ancestors.map((row) => [String(row._id), row]));
  return {
    id: String(unit._id),
    name: unit.name,
    type: String(unit.type),
    ancestorIds,
    ancestors: ancestorIds
      .map((id) => byId.get(id))
      .filter((row): row is { _id: mongoose.Types.ObjectId; name: string; type: string } =>
        Boolean(row),
      )
      .map((row) => ({
        id: String(row._id),
        name: row.name,
        type: row.type,
      })),
  };
}

export function locationLabelsFromAncestry(
  unitName: string,
  unitType: string,
  ancestors: Array<{ name: string; type: string }>,
): {
  country: string | null;
  region: string | null;
  state: string | null;
  city: string | null;
  office: string | null;
} {
  const chain = [...ancestors, { name: unitName, type: unitType }];
  const pick = (type: string) =>
    chain.find((row) => row.type === type)?.name ?? null;
  return {
    country: pick("country"),
    region: pick("region"),
    state: pick("state"),
    city: pick("city"),
    office: pick("office"),
  };
}
