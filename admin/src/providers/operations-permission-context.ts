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
  can: (
    module: OperationsPermissionModule,
    action?: OperationsPermissionAction,
  ) => boolean;
};

export const OperationsPermissionContext =
  createContext<OperationsPermissionContextValue | null>(null);
