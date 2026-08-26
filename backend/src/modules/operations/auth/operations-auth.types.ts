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
  /** Resolved capability matrix for UI gates and future Team Management. */
  permissions: OperationsPermissionMap;
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
