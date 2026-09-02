import { apiClient } from "@/services/api-client";
import type { EmployerImageAssetPublic } from "@/services/employer-register.service";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type EmployerLoginPublic = {
  id: string;
  accountType: "company" | "consultancy" | "individual";
  companyName: string;
  establishmentName: string;
  firstName: string;
  lastName: string;
  industry: string;
  businessCategory: string;
  companyDescription: string;
  website: string;
  foundedYear: number | null;
  companyType: string;
  gstNumber: string;
  panNumber: string;
  registrationNumber: string;
  minimumEmployees: number | null;
  maximumEmployees: number | null;
  companyLogo: EmployerImageAssetPublic | null;
  profilePhoto: EmployerImageAssetPublic | null;
  companyMedia: EmployerImageAssetPublic[];
  companyMediaLimit: number;
  aboutUs: string;
  culture: string;
  benefits: string;
  vision: string;
  mission: string;
  values: string;
  companyAddress: string;
  pincode: string;
  city: string;
  state: string;
  emailAddress: string;
  contactDesignation: string;
  alternatePhone: string;
  socialLinks: {
    linkedin: string;
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
  profileViews: number;
  whatsappNumber: string;
  isWhatsappVerified: boolean;
  isProfileComplete: boolean;
  companyProfileVisited: boolean;
  registrationStatus: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SendLoginOtpResponse = {
  employerId: string;
  otpExpiresAt: string;
  expiresIn: number;
  resendAvailableIn: number;
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

export const employerProfileQueryKey = ["employer", "me"] as const;

export async function sendEmployerLoginOtp(whatsappNumber: string) {
  const response = await apiClient.post<ApiSuccess<SendLoginOtpResponse>>(
    "/employers/login/send-otp",
    { whatsappNumber },
  );

  const data = response.data.data;
  return data;
}

export async function resendEmployerLoginOtp(whatsappNumber: string) {
  const response = await apiClient.post<ApiSuccess<SendLoginOtpResponse>>(
    "/employers/login/resend-otp",
    { whatsappNumber },
  );

  const data = response.data.data;
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

  // Tokens and React Query cache are established by the caller via
  // establishEmployerClientSession so login never inherits a prior employer's cache.
  return data;
}

export async function fetchAuthenticatedEmployer() {
  const response = await apiClient.get<ApiSuccess<MeResponse>>("/employers/me");
  return response.data.data;
}
