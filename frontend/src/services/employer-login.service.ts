import { apiClient } from "@/services/api-client";
import { setEmployerAuthSession } from "@/utils/employer-auth-storage";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type EmployerLoginPublic = {
  id: string;
  accountType: "company" | "individual";
  companyName: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  whatsappNumber: string;
  isWhatsappVerified: boolean;
  isProfileComplete: boolean;
  registrationStatus: string;
  lastLoginAt: string | null;
};

type SendLoginOtpResponse = {
  employerId: string;
  otpExpiresAt: string;
  otp?: string;
};

type VerifyLoginOtpResponse = {
  employer: EmployerLoginPublic;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

type MeResponse = {
  employer: EmployerLoginPublic;
};

function logDevelopmentOtp(phoneNumber: string, otp?: string) {
  if (!otp) {
    return;
  }

  console.info("====================================");
  console.info("LOGIN OTP GENERATED");
  console.info(`Phone Number: ${phoneNumber}`);
  console.info(`OTP: ${otp}`);
  console.info("====================================");
}

export async function sendEmployerLoginOtp(whatsappNumber: string) {
  const response = await apiClient.post<ApiSuccess<SendLoginOtpResponse>>(
    "/employers/login/send-otp",
    { whatsappNumber },
  );

  const data = response.data.data;
  logDevelopmentOtp(whatsappNumber, data.otp);
  return data;
}

export async function resendEmployerLoginOtp(whatsappNumber: string) {
  const response = await apiClient.post<ApiSuccess<SendLoginOtpResponse>>(
    "/employers/login/resend-otp",
    { whatsappNumber },
  );

  const data = response.data.data;
  logDevelopmentOtp(whatsappNumber, data.otp);
  return data;
}

export async function verifyEmployerLoginOtp(
  whatsappNumber: string,
  otp: string,
) {
  const response = await apiClient.post<ApiSuccess<VerifyLoginOtpResponse>>(
    "/employers/login/verify-otp",
    { whatsappNumber, otp },
  );

  const data = response.data.data;
  setEmployerAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return data;
}

export async function fetchAuthenticatedEmployer() {
  const response = await apiClient.get<ApiSuccess<MeResponse>>("/employers/me");
  return response.data.data;
}
