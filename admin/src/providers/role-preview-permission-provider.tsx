import { createElement, useMemo, type ReactNode } from "react";
import {
  OperationsPermissionContext,
  type OperationsPermissionContextValue,
} from "./operations-permission-context";
import { useOperationsPermissions } from "../hooks/use-operations-permissions";
import { OPERATIONS_TEAM_ROLES } from "../types/roles";
import {
  grantKeysFromGrants,
  projectRoleGrantsToPermissionMatrix,
  type OperationsRolePreviewDraft,
} from "../utils/operations-role-preview";

type RolePreviewPermissionProviderProps = {
  draft: OperationsRolePreviewDraft;
  children: ReactNode;
};

/**
 * UI-only permission overlay for role preview.
 * Does not change JWT, session, or backend authorization.
 */
export function RolePreviewPermissionProvider({
  draft,
  children,
}: RolePreviewPermissionProviderProps) {
  const real = useOperationsPermissions();

  const value = useMemo<OperationsPermissionContextValue>(() => {
    const grantedKeys = grantKeysFromGrants(draft.grants);
    const permissions = projectRoleGrantsToPermissionMatrix(draft.grants);
    const grantedSet = new Set(grantedKeys);

    const previewUser = real.user
      ? {
          ...real.user,
          role: OPERATIONS_TEAM_ROLES.CUSTOM,
          roleId: draft.roleId,
          roleName: draft.roleName,
          isSuperAdmin: false,
          canCreateRoles: draft.canCreateRoles,
          canManageUsers: draft.canManageUsers,
          canAssignRoles: draft.canAssignRoles,
          permissions,
          grantedKeys,
          delegatableKeys: [],
        }
      : null;

    return {
      user: previewUser,
      role: OPERATIONS_TEAM_ROLES.CUSTOM,
      permissions,
      isLoading: false,
      isSuperAdmin: false,
      isRolePreview: true,
      canCreateRoles: draft.canCreateRoles,
      canManageUsers: draft.canManageUsers,
      canAssignRoles: draft.canAssignRoles,
      grantedKeys,
      delegatableKeys: [],
      can: (module, action = "read") =>
        Boolean(permissions[module]?.[action]),
      canKey: (key) => grantedSet.has(key),
      canDelegate: () => false,
    };
  }, [draft, real.user]);

  return createElement(
    OperationsPermissionContext.Provider,
    { value },
    children,
  );
}
