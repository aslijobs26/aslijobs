import type { OperationsTeamRole } from "../operations.constants.js";
import type {
  OperationsPermissionAction,
  OperationsPermissionMap,
  OperationsPermissionModule,
} from "./operations-rbac.js";
import {
  canOperationsPermission,
  resolveOperationsPermissions,
} from "./operations-rbac.js";

/**
 * Resolves the effective permission map for an Operations team user.
 * Today: static role defaults. Tomorrow: merge DB role templates / overrides.
 */
export function resolveOperationsUserPermissions(
  role: OperationsTeamRole,
): OperationsPermissionMap {
  return resolveOperationsPermissions(role);
}

export function operationsUserCan(
  role: OperationsTeamRole,
  module: OperationsPermissionModule,
  action: OperationsPermissionAction,
): boolean {
  return canOperationsPermission(
    resolveOperationsUserPermissions(role),
    module,
    action,
  );
}
