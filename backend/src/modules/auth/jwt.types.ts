import type { OperationsTeamRole } from "../operations/operations.constants.js";

export type EmployerJwtPayload = {
  sub: string;
  role: "employer";
  accountType: "company" | "consultancy" | "individual";
  whatsappNumber: string;
};

export type TeamMemberJwtPayload = {
  sub: string;
  role: "team_member";
  employerId: string;
};

export type WorkspaceJwtPayload = EmployerJwtPayload | TeamMemberJwtPayload;

export type JobSeekerJwtPayload = {
  sub: string;
  role: "job_seeker";
  whatsappNumber: string;
};

export type OperationsTeamJwtPayload = {
  sub: string;
  role: "operations_team";
  teamRole: OperationsTeamRole;
  mobileNumber: string;
};

export type IssuedTokenPair = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
};
