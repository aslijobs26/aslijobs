/**
 * Pure helpers for Operations department create/archive dependency rules.
 * Soft-archive is the established deletion convention for Operations departments.
 */

export const DEPARTMENT_HAS_DEPENDENCIES_CODE =
  "DEPARTMENT_HAS_DEPENDENCIES" as const;

export type OperationsDepartmentArchiveDependencies = {
  activeMembers: number;
  scopedRoles: number;
  openWorkItems: number;
  activeTeams: number;
};

export type OperationsDepartmentDependencyDetails = {
  code: typeof DEPARTMENT_HAS_DEPENDENCIES_CODE;
  dependencies: OperationsDepartmentArchiveDependencies;
  blocking: boolean;
};

export function hasBlockingDepartmentDependencies(
  deps: OperationsDepartmentArchiveDependencies,
): boolean {
  return (
    deps.activeMembers > 0 ||
    deps.scopedRoles > 0 ||
    deps.openWorkItems > 0 ||
    deps.activeTeams > 0
  );
}

export function buildDepartmentArchiveBlockedMessage(
  departmentName: string,
  deps: OperationsDepartmentArchiveDependencies,
): string {
  const parts: string[] = [];
  if (deps.activeMembers > 0) {
    parts.push(
      `${deps.activeMembers} active member${deps.activeMembers === 1 ? "" : "s"}`,
    );
  }
  if (deps.scopedRoles > 0) {
    parts.push(
      `${deps.scopedRoles} scoped role${deps.scopedRoles === 1 ? "" : "s"}`,
    );
  }
  if (deps.openWorkItems > 0) {
    parts.push(
      `${deps.openWorkItems} open work item${deps.openWorkItems === 1 ? "" : "s"}`,
    );
  }
  if (deps.activeTeams > 0) {
    parts.push(
      `${deps.activeTeams} active team${deps.activeTeams === 1 ? "" : "s"}`,
    );
  }

  const summary = parts.join(", ");
  return `${departmentName} cannot be deleted while it still has ${summary}. Remove or reassign them first.`;
}

export function toDepartmentDependencyDetails(
  deps: OperationsDepartmentArchiveDependencies,
): OperationsDepartmentDependencyDetails {
  return {
    code: DEPARTMENT_HAS_DEPENDENCIES_CODE,
    dependencies: deps,
    blocking: hasBlockingDepartmentDependencies(deps),
  };
}
