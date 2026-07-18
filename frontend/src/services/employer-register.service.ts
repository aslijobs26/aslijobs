import { apiClient } from "@/services/api-client";
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

export type EmployerPublic = {
  id: string;
  accountType: EmployerRegisterAccountType;
  companyName: string;
  firstName: string;
  lastName: string;
  industry: string;
  businessCategory: string;
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
  nextStep: "post-job";
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
  nextStep: "post-job";
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
}) {
  const body = new FormData();
  body.append("companyName", input.profile.companyName);
  body.append("industry", input.profile.industry);
  body.append("businessCategory", input.profile.businessCategory);
  body.append("companyAddress", input.profile.companyAddress);
  body.append("pincode", input.profile.pincode);
  body.append("city", input.profile.city);
  body.append("state", input.profile.state);
  body.append("emailAddress", input.profile.emailAddress);
  body.append("whatsappNumber", input.profile.whatsappNumber);
  body.append("verificationDocument", input.documentType);
  body.append("document", input.documentFile);

  const response = await apiClient.post<
    ApiSuccess<CompleteCompanyProfileResponse>
  >(`/employers/${input.employerId}/company-profile`, body, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data;
}

export async function completeEmployerIndividualIdentity(input: {
  employerId: string;
  documentType: EmployerRegisterDocumentType;
  documentFile: File;
}) {
  const body = new FormData();
  body.append("documentType", input.documentType);
  body.append("document", input.documentFile);

  const response = await apiClient.post<
    ApiSuccess<CompleteIndividualIdentityResponse>
  >(`/employers/${input.employerId}/identity-document`, body, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data;
}
