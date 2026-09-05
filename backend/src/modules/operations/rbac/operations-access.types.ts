import type { Types } from "mongoose";
import type {
  OperationsPermissionAction,
  OperationsPermissionMap,
  OperationsPermissionModule,
} from "../auth/operations-rbac.js";
import type { OperationsTeamRole } from "../operations.constants.js";
import type { OperationsRoleGrant } from "./operations-role.model.js";

export type OperationsResolvedAccess = {
  userId: string;
  role: OperationsTeamRole;
  roleId: string | null;
  roleName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  isSuperAdmin: boolean;
  canCreateRoles: boolean;
  canManageUsers: boolean;
  canAssignRoles: boolean;
  grantedKeys: string[];
  delegatableKeys: string[];
  permissions: OperationsPermissionMap;
  parentRoleId: string | null;
};

export type OperationsActorContext = OperationsResolvedAccess & {
  objectId: Types.ObjectId;
};

export type OperationsRoleGrantInput = OperationsRoleGrant;

export type OperationsPermissionCheck = {
  module: OperationsPermissionModule;
  action: OperationsPermissionAction;
};
