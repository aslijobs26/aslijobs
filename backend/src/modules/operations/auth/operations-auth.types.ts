import type { OperationsTeamUserDocument } from "./operations-team-user.model.js";

export type OperationsTeamLoginInput = {
  mobileNumber: string;
  password: string;
};

export type OperationsTeamLoginResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: {
    id: string;
    fullName: string;
    mobileNumber: string;
    role: OperationsTeamUserDocument["role"];
  };
};

export type OperationsTeamSessionResponse = {
  user: {
    id: string;
    fullName: string;
    mobileNumber: string;
    role: OperationsTeamUserDocument["role"];
  };
};
