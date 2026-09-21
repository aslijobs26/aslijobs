/**
 * Pure Operations Team rules.
 *
 * Department = functional lane. Team = operational unit inside a department
 * at an OperationsOrgUnit location. Role = RBAC. People = OperationsTeamUser.
 *
 * Operations Team is NOT Employer Team Management (`backend/src/modules/team/`).
 * OrgUnit is geography (global → country → region → state → city → office).
 * Map district labels are visualization only and are not city OrgUnits.
 *
 * My Work remains department-queued:
 * departmentId + assignedToUserId = null + status = queued.
 * Adding OperationsTeam does not convert My Work into a team queue.
 * Membership / lead / location changes do not silently move WorkItems.
 * Inactive users, departments, and archived teams cannot receive new work.
 */

export const TEAM_ERROR_CODES = {
  TEAM_NOT_FOUND: "TEAM_NOT_FOUND",
  TEAM_INACTIVE: "TEAM_INACTIVE",
  TEAM_DEPARTMENT_MISMATCH: "TEAM_DEPARTMENT_MISMATCH",
  TEAM_LOCATION_MISMATCH: "TEAM_LOCATION_MISMATCH",
  TEAM_LEAD_INVALID: "TEAM_LEAD_INVALID",
  TEAM_MEMBER_ALREADY_ASSIGNED: "TEAM_MEMBER_ALREADY_ASSIGNED",
  TEAM_HAS_DEPENDENCIES: "TEAM_HAS_DEPENDENCIES",
  TEAM_LEAD_REQUIRED: "TEAM_LEAD_REQUIRED",
  STALE_REVISION: "STALE_REVISION",
  ORG_SCOPE_FORBIDDEN: "ORG_SCOPE_FORBIDDEN",
} as const;

export type TeamErrorCode =
  (typeof TEAM_ERROR_CODES)[keyof typeof TEAM_ERROR_CODES];

export type OperationsTeamArchiveDependencies = {
  activeMembers: number;
  openWorkItems: number;
};

export function hasBlockingTeamDependencies(
  deps: OperationsTeamArchiveDependencies,
): boolean {
  return deps.activeMembers > 0 || deps.openWorkItems > 0;
}

export function buildTeamArchiveBlockedMessage(
  teamName: string,
  deps: OperationsTeamArchiveDependencies,
): string {
  const parts: string[] = [];
  if (deps.activeMembers > 0) {
    parts.push(
      `${deps.activeMembers} active member${deps.activeMembers === 1 ? "" : "s"}`,
    );
  }
  if (deps.openWorkItems > 0) {
    parts.push(
      `${deps.openWorkItems} open work item${deps.openWorkItems === 1 ? "" : "s"}`,
    );
  }
  return `${teamName} cannot be archived while it still has ${parts.join(", ")}. Remove or reassign them first.`;
}

/**
 * Same geographic branch: the user's org unit is the team unit,
 * an ancestor of it, or a descendant of it.
 */
export function isSameOrgBranch(input: {
  userOrgUnitId: string | null;
  userAncestorIds: string[];
  teamOrgUnitId: string;
  teamAncestorIds: string[];
}): boolean {
  if (!input.userOrgUnitId) {
    return true;
  }
  if (input.userOrgUnitId === input.teamOrgUnitId) {
    return true;
  }
  if (input.userAncestorIds.includes(input.teamOrgUnitId)) {
    return true;
  }
  if (input.teamAncestorIds.includes(input.userOrgUnitId)) {
    return true;
  }
  return false;
}

export function isDepartmentCompatible(
  userDepartmentId: string | null,
  teamDepartmentId: string,
): boolean {
  if (!userDepartmentId) {
    return true;
  }
  return userDepartmentId === teamDepartmentId;
}

/**
 * Location scope: Super Admin is org-wide. Every other actor must have an
 * explicit orgUnitId; missing scope denies access (never falls open).
 */
export function canActorAccessOrgUnit(input: {
  isSuperAdmin: boolean;
  actorOrgUnitId: string | null;
  actorSubtreeIds: string[];
  targetUnitId: string;
}): boolean {
  if (input.isSuperAdmin) {
    return true;
  }
  if (!input.actorOrgUnitId) {
    return false;
  }
  return input.actorSubtreeIds.includes(input.targetUnitId);
}

/**
 * Department scope: Super Admin is org-wide. Every other actor must have an
 * explicit departmentId; missing scope denies access (never falls open).
 */
export function canActorAccessDepartment(input: {
  isSuperAdmin: boolean;
  actorDepartmentId: string | null;
  targetDepartmentId: string | null;
}): boolean {
  if (input.isSuperAdmin) {
    return true;
  }
  if (!input.actorDepartmentId || !input.targetDepartmentId) {
    return false;
  }
  return input.actorDepartmentId === input.targetDepartmentId;
}
