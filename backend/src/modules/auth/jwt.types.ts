export type EmployerJwtPayload = {
  sub: string;
  role: "employer";
  accountType: "company" | "consultancy" | "individual";
  whatsappNumber: string;
};

export type JobSeekerJwtPayload = {
  sub: string;
  role: "job_seeker";
  whatsappNumber: string;
};

export type IssuedTokenPair = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
};
