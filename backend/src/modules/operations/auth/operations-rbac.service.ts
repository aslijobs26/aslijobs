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
 * Legacy static resolver. Prefer `resolveOperationsUserAccess` for requests.
 * Kept so existing call sites and migration fallback remain available.
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

export {
  resolveOperationsUserAccess,
  operationsAccessCan,
  operationsAccessCanKey,
  operationsAccessCanDelegate,
} from "../rbac/operations-access.service.js";
