import { apiClient } from "@/services/api-client";
import { setEmployerAuthSession } from "@/utils/employer-auth-storage";
import { getCompanyStrengthRange } from "@/constants/employer-register";
import type {
  EmployerRegisterAccountType,
  EmployerRegisterBusinessDocumentType,
  EmployerRegisterCompanyProfileData,
  EmployerRegisterDocumentType,
  EmployerRegisterFormData,
} from "@/types/employer-register";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type EmployerImageAssetPublic = {
  url: string;
  storagePath: string;
  publicId: string;
  storageProvider: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
};

export type EmployerPublic = {
  id: string;
  accountType: EmployerRegisterAccountType;
  companyName: string;
  establishmentName: string;
  firstName: string;
  lastName: string;
  industry: string;
  businessCategory: string;
  roles: string;
  minimumEmployees: number | null;
  maximumEmployees: number | null;
  companyLogo: EmployerImageAssetPublic | null;
  profilePhoto: EmployerImageAssetPublic | null;
  companyAddress: string;
  pincode: string;
  city: string;
  state: string;
  emailAddress: string;
  whatsappNumber: string;
  isWhatsappVerified: boolean;
  isProfileComplete: boolean;
  registrationStatus: string;
  documentIds: string[];
};

type RegisterEmployerResponse = {
  employer: EmployerPublic;
  employerId: string;
  otpExpiresAt: string;
  otp?: string;
};

type ResendOtpResponse = {
  employerId: string;
  otpExpiresAt: string;
  otp?: string;
};

type VerifyOtpResponse = {
  employer: EmployerPublic;
  nextStep: "company-profile" | "identity-document";
};

type CompleteCompanyProfileResponse = {
  employer: EmployerPublic;
  document: {
    id: string;
    documentType: string;
    originalName: string;
    storageProvider: string;
    verificationStatus: string;
    uploadedAt: string;
  };
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  nextStep: "dashboard";
};

type CompleteIndividualIdentityResponse = {
  employer: EmployerPublic;
  document: {
    id: string;
    documentType: string;
    originalName: string;
    storageProvider: string;
    verificationStatus: string;
    uploadedAt: string;
  };
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  nextStep: "dashboard";
};

function logDevelopmentOtp(phoneNumber: string, otp?: string) {
  if (!otp) {
    return;
  }

  console.info("==================================");
  console.info("OTP GENERATED");
  console.info(`Phone Number: ${phoneNumber}`);
  console.info(`OTP: ${otp}`);
  console.info("==================================");
}

export async function registerEmployerAccount(
  formData: EmployerRegisterFormData,
  accountType: EmployerRegisterAccountType,
) {
  const response = await apiClient.post<ApiSuccess<RegisterEmployerResponse>>(
    "/employers/register",
    {
      accountType,
      companyName: formData.companyName,
      establishmentName: formData.establishmentName,
      firstName: formData.firstName,
      lastName: formData.lastName,
      emailAddress: formData.emailAddress,
      whatsappNumber: formData.whatsappNumber,
    },
  );

  const data = response.data.data;
  logDevelopmentOtp(formData.whatsappNumber, data.otp);
  return data;
}

export async function resendEmployerOtp(
  employerId: string,
  phoneNumber: string,
) {
  const response = await apiClient.post<ApiSuccess<ResendOtpResponse>>(
    `/employers/${employerId}/otp/resend`,
  );

  const data = response.data.data;
  logDevelopmentOtp(phoneNumber, data.otp);
  return data;
}

export async function verifyEmployerOtp(employerId: string, otp: string) {
  const response = await apiClient.post<ApiSuccess<VerifyOtpResponse>>(
    `/employers/${employerId}/otp/verify`,
    { otp },
  );

  return response.data.data;
}

export async function completeEmployerCompanyProfile(input: {
  employerId: string;
  profile: EmployerRegisterCompanyProfileData;
  documentType: EmployerRegisterBusinessDocumentType;
  documentFile: File;
  companyLogoFile?: File;
}) {
  const body = new FormData();
  body.append("companyName", input.profile.companyName);
  body.append("industry", input.profile.industry);
  body.append("businessCategory", input.profile.businessCategory);

  const strengthRange = getCompanyStrengthRange(input.profile.companyStrength);
  const minimumEmployees =
    strengthRange?.minimumEmployees ??
    Number.parseInt(input.profile.minimumEmployees, 10);
  const maximumEmployees =
    strengthRange?.maximumEmployees ??
    Number.parseInt(input.profile.maximumEmployees, 10);

  if (Number.isFinite(minimumEmployees) && Number.isFinite(maximumEmployees)) {
    if (maximumEmployees < minimumEmployees) {
      throw new Error(
        "Maximum employees must be greater than or equal to minimum employees",
      );
    }

    body.append("minimumEmployees", String(minimumEmployees));
    body.append("maximumEmployees", String(maximumEmployees));
  }
  body.append("companyAddress", input.profile.companyAddress);
  body.append("pincode", input.profile.pincode);
  body.append("city", input.profile.city);
  body.append("state", input.profile.state);
  body.append("verificationDocument", input.documentType);
  body.append("document", input.documentFile);

  if (input.companyLogoFile) {
    body.append("companyLogo", input.companyLogoFile);
  }

  const response = await apiClient.post<
    ApiSuccess<CompleteCompanyProfileResponse>
  >(`/employers/${input.employerId}/company-profile`, body, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const data = response.data.data;
  setEmployerAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return data;
}

export async function completeEmployerIndividualIdentity(input: {
  employerId: string;
  documentType: EmployerRegisterDocumentType;
  documentFile: File;
  profilePhotoFile?: File;
}) {
  const body = new FormData();
  body.append("documentType", input.documentType);
  body.append("document", input.documentFile);

  if (input.profilePhotoFile) {
    body.append("profilePhoto", input.profilePhotoFile);
  }

  const response = await apiClient.post<
    ApiSuccess<CompleteIndividualIdentityResponse>
  >(`/employers/${input.employerId}/identity-document`, body, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const data = response.data.data;
  setEmployerAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return data;
}
