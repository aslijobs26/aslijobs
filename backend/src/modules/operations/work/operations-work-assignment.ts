import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
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

export type EligibleAssignee = {
  id: string;
  fullName: string;
  email: string | null;
  roleId: string | null;
  roleName: string | null;
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
 * within that department (or to users with null department that share scope
 * via role hierarchy only when actor has no department constraint).
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

export async function loadActiveAssignableUser(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid assignee.", HTTP_STATUS.BAD_REQUEST);
  }
  const user = await OperationsTeamUserModel.findById(userId)
    .select("_id fullName email roleId departmentId status")
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

/**
 * Full assign authority gate:
 * permission + strict hierarchy + department + active target.
 */
export async function assertCanAssignWorkToUser(input: {
  actor: OperationsResolvedAccess;
  targetUserId: string;
  mode: "assign" | "reassign";
}): Promise<{
  target: Awaited<ReturnType<typeof loadActiveAssignableUser>>;
}> {
  const permissionKey =
    input.mode === "reassign" ? WORK_REASSIGN_KEY : WORK_ASSIGN_KEY;
  if (!operationsAccessCanKey(input.actor, permissionKey)) {
    // Reassign may fall back to assign permission for managers who have assign.
    if (
      input.mode === "reassign" &&
      operationsAccessCanKey(input.actor, WORK_ASSIGN_KEY)
    ) {
      // allowed via assign
    } else {
      throw new AppError(
        "You do not have permission to assign work.",
        HTTP_STATUS.FORBIDDEN,
      );
    }
  }

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

  return { target };
}

export function assertCanClaimWork(actor: OperationsResolvedAccess): void {
  if (!operationsAccessCanKey(actor, WORK_CLAIM_KEY)) {
    throw new AppError(
      "You do not have permission to claim work.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
}

/**
 * Eligible assignees for the Assign UI — only active subordinates in scope.
 * Never returns peers, managers, or out-of-department users.
 */
export async function listEligibleAssignees(
  actor: OperationsResolvedAccess,
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

  if (actor.isSuperAdmin) {
    const users = await OperationsTeamUserModel.find({
      status: "active",
      _id: { $ne: actor.userId },
    })
      .select("_id fullName email roleId departmentId")
      .sort({ fullName: 1 })
      .limit(500)
      .lean();

    return users.map((user) => ({
      id: String(user._id),
      fullName: user.fullName,
      email: user.email ?? null,
      roleId: user.roleId ? String(user.roleId) : null,
      roleName: null,
      departmentId: user.departmentId ? String(user.departmentId) : null,
      departmentName: null,
    }));
  }

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

  const users = await OperationsTeamUserModel.find(filter)
    .select("_id fullName email roleId departmentId")
    .sort({ fullName: 1 })
    .limit(500)
    .lean();

  return users.map((user) => ({
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
 * Visibility scope for list/detail/analytics.
 * Super Admin: all.
 * Others: own assigned work + department team queue (unassigned) + work they created.
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

  // Managers with assign permission also see work assigned to subordinates —
  // resolved at query time via optional assigneeIds expansion in service.
  return { $or: clauses };
}
