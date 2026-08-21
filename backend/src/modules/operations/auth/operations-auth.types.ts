import type { OperationsTeamUserDocument } from "./operations-team-user.model.js";

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
