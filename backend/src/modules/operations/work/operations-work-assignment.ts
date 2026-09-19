import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import { OperationsDepartmentModel } from "../rbac/operations-department.model.js";
import { OperationsTeamModel } from "../teams/operations-teams.model.js";
import {
  getRoleDescendantIds,
  operationsAccessCanKey,
} from "../rbac/operations-access.service.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import {
  WORK_ASSIGN_KEY,
  WORK_REASSIGN_KEY,
  WORK_CLAIM_KEY,
} from "../rbac/operations-permission-catalog.js";
import type { WorkItemType } from "./operations-work.constants.js";
import {
  capabilityRejectionMessage,
  departmentHasWorkCapability,
  loadCapabilitySnapshotsForUsers,
  snapshotHasWorkCapability,
  teamHasWorkCapability,
} from "./operations-work-capability.js";

export const WORK_BULK_ASSIGN_MAX = 50;

export type EligibleAssignee = {
  id: string;
  fullName: string;
  email: string | null;
  roleId: string | null;
  roleName: string | null;
  departmentId: string | null;
  departmentName: string | null;
};

export type EligibleDepartment = {
  id: string;
  name: string;
  slug: string;
};

export type EligibleOpsTeam = {
  id: string;
  name: string;
  departmentId: string | null;
  departmentName: string | null;
};

/**
 * Strict subordinate check: target role must be a descendant of actor role.
 * Same role (peers) and ancestors are rejected.
 * Super Admin may assign to any active Operations user.
 */
export async function isStrictRoleDescendantOfActor(
  actor: OperationsResolvedAccess,
  targetRoleId: string | null | undefined,
): Promise<boolean> {
  if (actor.isSuperAdmin) {
    return true;
  }
  if (!actor.roleId || !targetRoleId) {
    return false;
  }
  if (actor.roleId === targetRoleId) {
    return false;
  }
  const descendants = await getRoleDescendantIds(actor.roleId);
  return descendants.includes(targetRoleId);
}

/**
 * Department boundary: non–super-admins with a department may only assign
 * within that department.
 */
export function isWithinDepartmentScope(
  actor: OperationsResolvedAccess,
  targetDepartmentId: string | null | undefined,
): boolean {
  if (actor.isSuperAdmin) {
    return true;
  }
  if (!actor.departmentId) {
    return true;
  }
  if (!targetDepartmentId) {
    return false;
  }
  return String(actor.departmentId) === String(targetDepartmentId);
}

export function assertHasAssignPermission(
  actor: OperationsResolvedAccess,
  mode: "assign" | "reassign",
): void {
  const permissionKey =
    mode === "reassign" ? WORK_REASSIGN_KEY : WORK_ASSIGN_KEY;
  if (!operationsAccessCanKey(actor, permissionKey)) {
    if (
      mode === "reassign" &&
      operationsAccessCanKey(actor, WORK_ASSIGN_KEY)
    ) {
      return;
    }
    throw new AppError(
      mode === "reassign"
        ? "You do not have permission to reassign work."
        : "You do not have permission to assign work.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
}

/** Bulk entry gate: actor must hold assign and/or reassign. */
export function assertHasAssignOrReassignPermission(
  actor: OperationsResolvedAccess,
): void {
  if (
    operationsAccessCanKey(actor, WORK_ASSIGN_KEY) ||
    operationsAccessCanKey(actor, WORK_REASSIGN_KEY)
  ) {
    return;
  }
  throw new AppError(
    "You do not have permission to bulk assign work.",
    HTTP_STATUS.FORBIDDEN,
  );
}

/**
 * Prefer assign-mode target validation when the actor can assign;
 * otherwise reassign-mode (still validates hierarchy/department/active).
 */
export function resolveBulkTargetValidationMode(
  actor: OperationsResolvedAccess,
): "assign" | "reassign" {
  if (operationsAccessCanKey(actor, WORK_ASSIGN_KEY)) {
    return "assign";
  }
  return "reassign";
}

export async function loadActiveAssignableUser(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid assignee.", HTTP_STATUS.BAD_REQUEST);
  }
  const user = await OperationsTeamUserModel.findById(userId)
    .select("_id fullName email role roleId departmentId status")
    .lean();
  if (!user) {
    throw new AppError("Assignee not found.", HTTP_STATUS.NOT_FOUND);
  }
  if (user.status !== "active") {
    throw new AppError(
      "Cannot assign work to inactive or suspended users.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }
  return user;
}

export async function loadActiveDepartment(departmentId: string) {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new AppError("Invalid department.", HTTP_STATUS.BAD_REQUEST);
  }
  const department = await OperationsDepartmentModel.findById(departmentId)
    .select("_id name slug status")
    .lean();
  if (!department) {
    throw new AppError("Department not found.", HTTP_STATUS.NOT_FOUND);
  }
  if (department.status !== "active") {
    throw new AppError(
      "Cannot route work to an inactive department.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }
  return department;
}

async function assertUserHasWorkCapability(
  user: Awaited<ReturnType<typeof loadActiveAssignableUser>>,
  workType: WorkItemType,
): Promise<void> {
  const snapshots = await loadCapabilitySnapshotsForUsers([user]);
  const snapshot = snapshots.get(String(user._id));
  if (!snapshot || !snapshotHasWorkCapability(snapshot, workType)) {
    throw new AppError(
      capabilityRejectionMessage(workType),
      HTTP_STATUS.BAD_REQUEST,
      {
        code: "WORK_CAPABILITY_MISMATCH",
        workType,
        targetUserId: String(user._id),
      },
    );
  }
}

export async function assertAssigneeHasWorkCapability(
  userId: string,
  workType: WorkItemType,
): Promise<void> {
  const user = await loadActiveAssignableUser(userId);
  await assertUserHasWorkCapability(user, workType);
}

/**
 * Full assign authority gate:
 * permission + strict hierarchy + department + active target + capability.
 */
export async function assertCanAssignWorkToUser(input: {
  actor: OperationsResolvedAccess;
  targetUserId: string;
  mode: "assign" | "reassign";
  workType: WorkItemType;
  /** When true, only hierarchy/scope/active are checked (bulk preflight). */
  skipCapabilityCheck?: boolean;
}): Promise<{
  target: Awaited<ReturnType<typeof loadActiveAssignableUser>>;
}> {
  assertHasAssignPermission(input.actor, input.mode);

  const target = await loadActiveAssignableUser(input.targetUserId);

  if (String(target._id) === String(input.actor.userId)) {
    throw new AppError(
      "Use claim to assign work to yourself from the team queue.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const targetRoleId = target.roleId ? String(target.roleId) : null;
  if (!(await isStrictRoleDescendantOfActor(input.actor, targetRoleId))) {
    throw new AppError(
      "You can only assign work to users within your subordinate hierarchy.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const targetDepartmentId = target.departmentId
    ? String(target.departmentId)
    : null;
  if (!isWithinDepartmentScope(input.actor, targetDepartmentId)) {
    throw new AppError(
      "You cannot assign work outside your department scope.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  if (!input.skipCapabilityCheck) {
    await assertUserHasWorkCapability(target, input.workType);
  }

  return { target };
}

/**
 * Route work into a department Team Queue (unassigned).
 * Department must contain at least one member capable of the work type.
 */
export async function assertCanRouteWorkToDepartment(input: {
  actor: OperationsResolvedAccess;
  departmentId: string;
  mode: "assign" | "reassign";
  workType: WorkItemType;
  /** When true, only scope/active are checked (bulk preflight). */
  skipCapabilityCheck?: boolean;
}): Promise<{
  department: Awaited<ReturnType<typeof loadActiveDepartment>>;
}> {
  assertHasAssignPermission(input.actor, input.mode);

  const department = await loadActiveDepartment(input.departmentId);
  const departmentId = String(department._id);

  if (!isWithinDepartmentScope(input.actor, departmentId)) {
    throw new AppError(
      "You cannot route work outside your department scope.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  if (!input.skipCapabilityCheck) {
    const capable = await departmentHasWorkCapability(
      departmentId,
      input.workType,
    );
    if (!capable) {
      throw new AppError(
        capabilityRejectionMessage(input.workType),
        HTTP_STATUS.BAD_REQUEST,
        {
          code: "WORK_CAPABILITY_MISMATCH",
          workType: input.workType,
          departmentId,
        },
      );
    }
  }

  return { department };
}

export function assertCanClaimWork(actor: OperationsResolvedAccess): void {
  if (!operationsAccessCanKey(actor, WORK_CLAIM_KEY)) {
    throw new AppError(
      "You do not have permission to claim work.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
}

function parseWorkTypesFilter(
  workType?: WorkItemType | null,
  workTypes?: WorkItemType[] | null,
): WorkItemType[] {
  if (workTypes && workTypes.length > 0) {
    return [...new Set(workTypes)];
  }
  if (workType) {
    return [workType];
  }
  return [];
}

async function filterUsersByAllWorkCapabilities<
  T extends {
    _id: mongoose.Types.ObjectId | string;
    role?: string;
    roleId?: mongoose.Types.ObjectId | string | null;
  },
>(users: T[], requiredTypes: WorkItemType[]): Promise<T[]> {
  if (requiredTypes.length === 0 || users.length === 0) {
    return users;
  }
  const snapshots = await loadCapabilitySnapshotsForUsers(users);
  return users.filter((user) => {
    const snapshot = snapshots.get(String(user._id));
    if (!snapshot) return false;
    return requiredTypes.every((type) =>
      snapshotHasWorkCapability(snapshot, type),
    );
  });
}

/**
 * Eligible assignees for the Assign UI — active subordinates in scope
 * who can complete the requested work type(s).
 */
export async function listEligibleAssignees(
  actor: OperationsResolvedAccess,
  options?: {
    workType?: WorkItemType | null;
    workTypes?: WorkItemType[] | null;
  },
): Promise<EligibleAssignee[]> {
  if (
    !operationsAccessCanKey(actor, WORK_ASSIGN_KEY) &&
    !operationsAccessCanKey(actor, WORK_REASSIGN_KEY)
  ) {
    throw new AppError(
      "You do not have permission to assign work.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const requiredTypes = parseWorkTypesFilter(
    options?.workType,
    options?.workTypes,
  );

  let users: Array<{
    _id: mongoose.Types.ObjectId;
    fullName: string;
    email?: string | null;
    role?: string;
    roleId?: mongoose.Types.ObjectId | null;
    departmentId?: mongoose.Types.ObjectId | null;
  }>;

  if (actor.isSuperAdmin) {
    users = await OperationsTeamUserModel.find({
      status: "active",
      _id: { $ne: actor.userId },
    })
      .select("_id fullName email role roleId departmentId")
      .sort({ fullName: 1 })
      .limit(500)
      .lean();
  } else {
    if (!actor.roleId) {
      return [];
    }

    const descendantRoleIds = await getRoleDescendantIds(actor.roleId);
    if (descendantRoleIds.length === 0) {
      return [];
    }

    const filter: Record<string, unknown> = {
      status: "active",
      roleId: { $in: descendantRoleIds },
      _id: { $ne: actor.userId },
    };
    if (actor.departmentId) {
      filter.departmentId = actor.departmentId;
    }

    users = await OperationsTeamUserModel.find(filter)
      .select("_id fullName email role roleId departmentId")
      .sort({ fullName: 1 })
      .limit(500)
      .lean();
  }

  const capableUsers = await filterUsersByAllWorkCapabilities(
    users,
    requiredTypes,
  );

  return capableUsers.map((user) => ({
    id: String(user._id),
    fullName: user.fullName,
    email: user.email ?? null,
    roleId: user.roleId ? String(user.roleId) : null,
    roleName: null,
    departmentId: user.departmentId ? String(user.departmentId) : null,
    departmentName: null,
  }));
}

/**
 * Active departments the actor may route Team Queue work into,
 * limited to departments that have capability-compatible members.
 */
export async function listEligibleDepartments(
  actor: OperationsResolvedAccess,
  options?: {
    workType?: WorkItemType | null;
    workTypes?: WorkItemType[] | null;
  },
): Promise<EligibleDepartment[]> {
  if (
    !operationsAccessCanKey(actor, WORK_ASSIGN_KEY) &&
    !operationsAccessCanKey(actor, WORK_REASSIGN_KEY)
  ) {
    throw new AppError(
      "You do not have permission to assign work.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const requiredTypes = parseWorkTypesFilter(
    options?.workType,
    options?.workTypes,
  );

  let departments: Array<{
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
  }>;

  if (actor.isSuperAdmin) {
    departments = await OperationsDepartmentModel.find({
      status: "active",
    })
      .select("_id name slug")
      .sort({ name: 1 })
      .limit(200)
      .lean();
  } else if (!actor.departmentId) {
    return [];
  } else {
    const department = await OperationsDepartmentModel.findOne({
      _id: actor.departmentId,
      status: "active",
    })
      .select("_id name slug")
      .lean();
    departments = department ? [department] : [];
  }

  if (requiredTypes.length === 0) {
    return departments.map((d) => ({
      id: String(d._id),
      name: d.name,
      slug: d.slug,
    }));
  }

  const eligible: EligibleDepartment[] = [];
  for (const department of departments) {
    const id = String(department._id);
    let ok = true;
    for (const workType of requiredTypes) {
      if (!(await departmentHasWorkCapability(id, workType))) {
        ok = false;
        break;
      }
    }
    if (ok) {
      eligible.push({
        id,
        name: department.name,
        slug: department.slug,
      });
    }
  }
  return eligible;
}

/**
 * Organization Ops Teams with members capable of the work type(s).
 * Work items still assign via departmentId or assignedToUserId.
 */
export async function listEligibleOpsTeams(
  actor: OperationsResolvedAccess,
  options?: {
    workType?: WorkItemType | null;
    workTypes?: WorkItemType[] | null;
  },
): Promise<EligibleOpsTeam[]> {
  if (
    !operationsAccessCanKey(actor, WORK_ASSIGN_KEY) &&
    !operationsAccessCanKey(actor, WORK_REASSIGN_KEY)
  ) {
    throw new AppError(
      "You do not have permission to assign work.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const requiredTypes = parseWorkTypesFilter(
    options?.workType,
    options?.workTypes,
  );

  const filter: Record<string, unknown> = { status: "active" };
  if (!actor.isSuperAdmin && actor.departmentId) {
    filter.departmentId = actor.departmentId;
  }

  const teams = await OperationsTeamModel.find(filter)
    .select("_id name departmentId")
    .sort({ name: 1 })
    .limit(200)
    .lean();

  if (teams.length === 0) {
    return [];
  }

  const departmentIds = [
    ...new Set(
      teams
        .map((team) => (team.departmentId ? String(team.departmentId) : null))
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const departments = await OperationsDepartmentModel.find({
    _id: { $in: departmentIds },
  })
    .select("_id name")
    .lean();
  const departmentNameById = new Map(
    departments.map((d) => [String(d._id), d.name]),
  );

  const eligible: EligibleOpsTeam[] = [];
  for (const team of teams) {
    const teamId = String(team._id);
    let ok = requiredTypes.length === 0;
    if (requiredTypes.length > 0) {
      ok = true;
      for (const workType of requiredTypes) {
        if (!(await teamHasWorkCapability(teamId, workType))) {
          ok = false;
          break;
        }
      }
    }
    if (!ok) continue;
    const departmentId = team.departmentId ? String(team.departmentId) : null;
    eligible.push({
      id: teamId,
      name: team.name,
      departmentId,
      departmentName: departmentId
        ? departmentNameById.get(departmentId) ?? null
        : null,
    });
  }
  return eligible;
}

/**
 * Visibility scope for list/detail/analytics.
 */
export function buildWorkVisibilityFilter(
  actor: OperationsResolvedAccess,
): Record<string, unknown> {
  if (actor.isSuperAdmin) {
    return {};
  }

  const clauses: Record<string, unknown>[] = [
    { assignedToUserId: actor.userId },
    { createdByUserId: actor.userId },
  ];

  if (actor.departmentId) {
    clauses.push({
      assignedToUserId: null,
      departmentId: actor.departmentId,
      status: { $in: ["queued", "assigned", "in_progress", "waiting"] },
    });
  }

  return { $or: clauses };
}
