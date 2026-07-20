import { apiClient } from "@/services/api-client";
import type { JobSeekerGender, JobSeekerPublic } from "@/types/job-seeker";
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

type CompleteRegistrationResponse = {
  jobSeeker: JobSeekerPublic;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

export type CompleteJobSeekerRegistrationPayload = {
  jobSeekerId: string;
  dateOfBirth: string;
  gender: JobSeekerGender;
  pincode: string;
  city: string;
  state: string;
  jobRole: string;
  preferredJobLocation: string;
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

export async function completeJobSeekerRegistration(
  payload: CompleteJobSeekerRegistrationPayload,
) {
  const response = await apiClient.post<
    ApiSuccess<CompleteRegistrationResponse>
  >("/jobseekers/register", payload);

  const data = response.data.data;
  setJobSeekerAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return data;
}
