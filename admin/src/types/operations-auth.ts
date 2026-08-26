import type { OperationsPermissionMap } from "../constants/operations-permissions";
import type { OperationsTeamRole } from "../types/roles";

export interface OperationsAuthUser {
  id: string;
  fullName: string;
  email: string;
  mobileNumber?: string;
  role: OperationsTeamRole;
  /** Present on login/session responses; resolved locally if missing from cache. */
  permissions?: OperationsPermissionMap;
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
