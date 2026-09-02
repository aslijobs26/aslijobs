import { apiClient } from "@/services/api-client";
import type { JobSeekerPublic } from "@/types/job-seeker";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

type SendLoginOtpResponse = {
  jobSeekerId: string;
  otpExpiresAt: string;
  expiresIn: number;
  resendAvailableIn: number;
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

export async function sendJobSeekerLoginOtp(whatsappNumber: string) {
  const response = await apiClient.post<ApiSuccess<SendLoginOtpResponse>>(
    "/jobseekers/login/send-otp",
    { whatsappNumber },
  );

  const data = response.data.data;
  return data;
}

export async function resendJobSeekerLoginOtp(whatsappNumber: string) {
  const response = await apiClient.post<ApiSuccess<SendLoginOtpResponse>>(
    "/jobseekers/login/resend-otp",
    { whatsappNumber },
  );

  const data = response.data.data;
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

  return data;
}

export async function fetchAuthenticatedJobSeeker() {
  const response = await apiClient.get<ApiSuccess<MeResponse>>("/jobseekers/me");
  return response.data.data;
}
