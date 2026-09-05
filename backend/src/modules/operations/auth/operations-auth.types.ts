import type { OperationsTeamUserDocument } from "./operations-team-user.model.js";
import type { OperationsPermissionMap } from "./operations-rbac.js";

export type OperationsTeamLoginInput = {
  email?: string;
  mobileNumber?: string;
  password: string;
};

export type OperationsTeamAuthUser = {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  role: OperationsTeamUserDocument["role"];
  roleId: string | null;
  roleName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  isSuperAdmin: boolean;
  canCreateRoles: boolean;
  canManageUsers: boolean;
  canAssignRoles: boolean;
  permissions: OperationsPermissionMap;
  grantedKeys: string[];
  delegatableKeys: string[];
};

export type OperationsTeamLoginResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: OperationsTeamAuthUser;
};

export type OperationsTeamSessionResponse = {
  user: OperationsTeamAuthUser;
};
