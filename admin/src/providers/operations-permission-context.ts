import { createContext } from "react";
import type {
  OperationsPermissionAction,
  OperationsPermissionMap,
  OperationsPermissionModule,
} from "../constants/operations-permissions";
import type { OperationsAuthUser } from "../types/operations-auth";
import type { OperationsTeamRole } from "../types/roles";

export type OperationsPermissionContextValue = {
  user: OperationsAuthUser | null;
  role: OperationsTeamRole | null;
  permissions: OperationsPermissionMap | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  canCreateRoles: boolean;
  canManageUsers: boolean;
  canAssignRoles: boolean;
  grantedKeys: string[];
  delegatableKeys: string[];
  can: (
    module: OperationsPermissionModule,
    action?: OperationsPermissionAction,
  ) => boolean;
  canKey: (key: string) => boolean;
  canDelegate: (key: string) => boolean;
};

export const OperationsPermissionContext =
  createContext<OperationsPermissionContextValue | null>(null);
