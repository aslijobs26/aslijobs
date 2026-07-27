export type EmployerResumeAccessTokenPayload = {
  typ: "employer_resume_access";
  applicationId: string;
  employerId: string;
};

export type ResolveEmployerResumeAccessUrlInput = {
  applicationId: string;
  employerId: string;
};
