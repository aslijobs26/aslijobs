import { apiClient } from "@/services/api-client";
import type { JobSeekerPublic } from "@/types/job-seeker";
import { setJobSeekerAuthSession } from "@/utils/job-seeker-auth-storage";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

type SendLoginOtpResponse = {
  jobSeekerId: string;
  otpExpiresAt: string;
  otp?: string;
};

type VerifyLoginOtpResponse = {
  jobSeeker: JobSeekerPublic;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

type MeResponse = {
  jobSeeker: JobSeekerPublic;
};

function logDevelopmentOtp(phoneNumber: string, otp?: string) {
  if (!otp) {
    return;
  }

  console.info("====================================");
  console.info("JOB SEEKER LOGIN OTP GENERATED");
  console.info(`Phone Number: ${phoneNumber}`);
  console.info(`OTP: ${otp}`);
  console.info("====================================");
}

export async function sendJobSeekerLoginOtp(whatsappNumber: string) {
  const response = await apiClient.post<ApiSuccess<SendLoginOtpResponse>>(
    "/jobseekers/login/send-otp",
    { whatsappNumber },
  );

  const data = response.data.data;
  logDevelopmentOtp(whatsappNumber, data.otp);
  return data;
}

export async function resendJobSeekerLoginOtp(whatsappNumber: string) {
  const response = await apiClient.post<ApiSuccess<SendLoginOtpResponse>>(
    "/jobseekers/login/resend-otp",
    { whatsappNumber },
  );

  const data = response.data.data;
  logDevelopmentOtp(whatsappNumber, data.otp);
  return data;
}

export async function verifyJobSeekerLoginOtp(
  whatsappNumber: string,
  otp: string,
) {
  const response = await apiClient.post<ApiSuccess<VerifyLoginOtpResponse>>(
    "/jobseekers/login/verify-otp",
    { whatsappNumber, otp },
  );

  const data = response.data.data;
  setJobSeekerAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return data;
}

export async function fetchAuthenticatedJobSeeker() {
  const response = await apiClient.get<ApiSuccess<MeResponse>>("/jobseekers/me");
  return response.data.data;
}
