import { apiClient } from "@/services/api-client";
import type {
  JobSeekerAvailabilityStatus,
  JobSeekerEducation,
  JobSeekerExperienceEntry,
  JobSeekerExperienceType,
  JobSeekerGender,
  JobSeekerJobType,
  JobSeekerLanguage,
  JobSeekerPublic,
  JobSeekerSalaryPeriod,
  JobSeekerWorkMode,
} from "@/types/job-seeker";
import { setJobSeekerAuthSession } from "@/utils/job-seeker-auth-storage";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

type RegisterStartResponse = {
  jobSeeker: JobSeekerPublic;
  jobSeekerId: string;
  otpExpiresAt: string;
  otp?: string;
};

type ResendOtpResponse = {
  jobSeekerId: string;
  otpExpiresAt: string;
  otp?: string;
};

type VerifyOtpResponse = {
  jobSeeker: JobSeekerPublic;
};

type PreferencesResponse = {
  jobSeeker: JobSeekerPublic;
};

type CompleteRegistrationResponse = {
  jobSeeker: JobSeekerPublic;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

export type SaveJobSeekerPreferencesPayload = {
  jobSeekerId: string;
  dateOfBirth: string;
  gender: JobSeekerGender;
  jobRole: string;
  jobType: JobSeekerJobType;
  workMode: JobSeekerWorkMode;
  preferredJobLocation: string;
  expectedSalary: number;
  expectedSalaryPeriod: JobSeekerSalaryPeriod;
};

export type CompleteJobSeekerRegistrationPayload = {
  jobSeekerId: string;
  education: JobSeekerEducation;
  experienceType: JobSeekerExperienceType;
  experiences: JobSeekerExperienceEntry[];
  languages: JobSeekerLanguage[];
  availabilityStatus: JobSeekerAvailabilityStatus;
};

function logDevelopmentOtp(phoneNumber: string, otp?: string) {
  if (!otp) {
    return;
  }

  console.info("====================================");
  console.info("JOB SEEKER REGISTRATION OTP GENERATED");
  console.info(`Phone Number: ${phoneNumber}`);
  console.info(`OTP: ${otp}`);
  console.info("====================================");
}

export async function registerJobSeekerAccount(
  fullName: string,
  whatsappNumber: string,
) {
  const response = await apiClient.post<ApiSuccess<RegisterStartResponse>>(
    "/jobseekers/register",
    { fullName, whatsappNumber },
  );

  const data = response.data.data;
  logDevelopmentOtp(whatsappNumber, data.otp);
  return data;
}

export async function resendJobSeekerOtp(jobSeekerId: string) {
  const response = await apiClient.post<ApiSuccess<ResendOtpResponse>>(
    "/jobseekers/register/resend-otp",
    { jobSeekerId },
  );

  return response.data.data;
}

export async function verifyJobSeekerOtp(jobSeekerId: string, otp: string) {
  const response = await apiClient.post<ApiSuccess<VerifyOtpResponse>>(
    "/jobseekers/register/verify-otp",
    { jobSeekerId, otp },
  );

  return response.data.data;
}

export async function searchJobSeekerRoles(
  search: string,
  options?: { signal?: AbortSignal; limit?: number },
) {
  const response = await apiClient.get<ApiSuccess<{ roles: string[] }>>(
    "/jobseekers/register/job-roles",
    {
      params: {
        search: search.trim() || undefined,
        limit: options?.limit ?? 10,
      },
      signal: options?.signal,
    },
  );

  return response.data.data.roles;
}

export async function saveJobSeekerPreferences(
  payload: SaveJobSeekerPreferencesPayload,
) {
  const response = await apiClient.post<ApiSuccess<PreferencesResponse>>(
    "/jobseekers/register/preferences",
    payload,
  );

  return response.data.data;
}

export async function completeJobSeekerRegistration(
  payload: CompleteJobSeekerRegistrationPayload,
) {
  const response = await apiClient.post<
    ApiSuccess<CompleteRegistrationResponse>
  >("/jobseekers/register/complete", payload);

  const data = response.data.data;
  setJobSeekerAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return data;
}
