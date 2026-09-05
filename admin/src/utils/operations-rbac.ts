import type { OperationsAuthUser } from "../types/operations-auth";
import type { OperationsTeamRole } from "../types/roles";
import {
  canOperationsPermission,
  resolveEffectiveOperationsPermissions,
  type OperationsPermissionAction,
  type OperationsPermissionMap,
  type OperationsPermissionModule,
} from "../constants/operations-permissions";

export function getOperationsUserPermissions(
  user: Pick<OperationsAuthUser, "role" | "permissions"> | null | undefined,
): OperationsPermissionMap | null {
  if (!user?.role) {
    return null;
  }
  return resolveEffectiveOperationsPermissions(user.role, user.permissions);
}

export function operationsUserCan(
  user: Pick<
    OperationsAuthUser,
    "role" | "permissions" | "isSuperAdmin"
  > | null | undefined,
  module: OperationsPermissionModule,
  action: OperationsPermissionAction = "read",
): boolean {
  if (user?.isSuperAdmin || user?.role === "SUPER_ADMIN") {
    return true;
  }
  const permissions = getOperationsUserPermissions(user);
  return canOperationsPermission(permissions, module, action);
}

export function operationsRoleCan(
  role: OperationsTeamRole,
  module: OperationsPermissionModule,
  action: OperationsPermissionAction = "read",
): boolean {
  return canOperationsPermission(
    resolveEffectiveOperationsPermissions(role),
    module,
    action,
  );
}
