import type { OperationsPermissionMap } from "../constants/operations-permissions";
import type { OperationsTeamRole } from "../types/roles";

export interface OperationsAuthUser {
  id: string;
  fullName: string;
  email: string;
  mobileNumber?: string;
  role: OperationsTeamRole;
  roleId?: string | null;
  roleName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  isSuperAdmin?: boolean;
  canCreateRoles?: boolean;
  canManageUsers?: boolean;
  canAssignRoles?: boolean;
  /** Present on login/session responses; resolved locally if missing from cache. */
  permissions?: OperationsPermissionMap;
  grantedKeys?: string[];
  delegatableKeys?: string[];
}

export interface OperationsLoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: OperationsAuthUser;
}

export interface OperationsSessionResponse {
  user: OperationsAuthUser;
}

export interface OperationsLoginInput {
  email: string;
  password: string;
}
