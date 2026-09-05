import { createElement, useMemo, type ReactNode } from "react";
import {
  OperationsPermissionContext,
  type OperationsPermissionContextValue,
} from "./operations-permission-context";
import { resolveOperationsSessionUser } from "../hooks/use-operations-session-query";
import { useOperationsSessionQuery } from "../hooks/use-operations-session-query";
import {
  getOperationsUserPermissions,
  operationsUserCan,
} from "../utils/operations-rbac";

type OperationsPermissionProviderProps = {
  children: ReactNode;
};

/**
 * Provides session-derived Operations permissions for UI gates.
 * Backend middleware remains the security boundary.
 *
 * Keep hooks in a separate module so Vite Fast Refresh does not invalidate
 * the entire Operations route tree on every HMR (which remounts queries and
 * amplifies transient Vite proxy 502s while the backend restarts).
 */
export function OperationsPermissionProvider({
  children,
}: OperationsPermissionProviderProps) {
  const sessionQuery = useOperationsSessionQuery({ mode: "protected" });
  const user = resolveOperationsSessionUser(sessionQuery.data);

  const value = useMemo<OperationsPermissionContextValue>(() => {
    const permissions = getOperationsUserPermissions(user);
    const isSuperAdmin = Boolean(user?.isSuperAdmin || user?.role === "SUPER_ADMIN");
    const grantedKeys = user?.grantedKeys ?? [];
    const delegatableKeys = user?.delegatableKeys ?? [];
    return {
      user,
      role: user?.role ?? null,
      permissions,
      isLoading: sessionQuery.isPending && !user,
      isSuperAdmin,
      canCreateRoles: Boolean(isSuperAdmin || user?.canCreateRoles),
      canManageUsers: Boolean(isSuperAdmin || user?.canManageUsers),
      canAssignRoles: Boolean(isSuperAdmin || user?.canAssignRoles),
      grantedKeys,
      delegatableKeys,
      can: (module, action = "read") =>
        operationsUserCan(user, module, action),
      canKey: (key) => {
        if (!user) return false;
        if (isSuperAdmin) return true;
        return grantedKeys.includes(key);
      },
      canDelegate: (key) => {
        if (!user) return false;
        if (isSuperAdmin) return true;
        return delegatableKeys.includes(key);
      },
    };
  }, [sessionQuery.isPending, user]);

  return createElement(
    OperationsPermissionContext.Provider,
    { value },
    children,
  );
}
