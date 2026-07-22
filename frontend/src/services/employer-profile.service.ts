import { apiClient } from "@/services/api-client";
import type { EmployerImageAssetPublic } from "@/services/employer-register.service";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type EmployerProfilePublic = {
  id: string;
  accountType: "company" | "consultancy" | "individual";
  companyName: string;
  firstName: string;
  lastName: string;
  industry: string;
  businessCategory: string;
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
};

type MeResponse = {
  employer: EmployerProfilePublic;
};

type UpdateProfileResponse = {
  employer: EmployerProfilePublic;
};

export type UpdateEmployerProfileInput = {
  companyName?: string;
  industry?: string;
  businessCategory?: string;
  minimumEmployees?: number;
  maximumEmployees?: number;
  companyAddress?: string;
  pincode?: string;
  city?: string;
  state?: string;
  emailAddress?: string;
  firstName?: string;
  lastName?: string;
  companyLogoFile?: File;
  profilePhotoFile?: File;
  removeCompanyLogo?: boolean;
  removeProfilePhoto?: boolean;
};

export async function fetchEmployerProfile() {
  const response = await apiClient.get<ApiSuccess<MeResponse>>("/employers/me");
  return response.data.data.employer;
}

export async function updateEmployerProfile(input: UpdateEmployerProfileInput) {
  const body = new FormData();

  if (typeof input.companyName === "string") {
    body.append("companyName", input.companyName);
  }
  if (typeof input.industry === "string") {
    body.append("industry", input.industry);
  }
  if (typeof input.businessCategory === "string") {
    body.append("businessCategory", input.businessCategory);
  }
  if (typeof input.minimumEmployees === "number") {
    body.append("minimumEmployees", String(input.minimumEmployees));
  }
  if (typeof input.maximumEmployees === "number") {
    body.append("maximumEmployees", String(input.maximumEmployees));
  }
  if (typeof input.companyAddress === "string") {
    body.append("companyAddress", input.companyAddress);
  }
  if (typeof input.pincode === "string") {
    body.append("pincode", input.pincode);
  }
  if (typeof input.city === "string") {
    body.append("city", input.city);
  }
  if (typeof input.state === "string") {
    body.append("state", input.state);
  }
  if (typeof input.emailAddress === "string") {
    body.append("emailAddress", input.emailAddress);
  }
  if (typeof input.firstName === "string") {
    body.append("firstName", input.firstName);
  }
  if (typeof input.lastName === "string") {
    body.append("lastName", input.lastName);
  }
  if (input.removeCompanyLogo) {
    body.append("removeCompanyLogo", "true");
  }
  if (input.removeProfilePhoto) {
    body.append("removeProfilePhoto", "true");
  }
  if (input.companyLogoFile) {
    body.append("companyLogo", input.companyLogoFile);
  }
  if (input.profilePhotoFile) {
    body.append("profilePhoto", input.profilePhotoFile);
  }

  const response = await apiClient.patch<ApiSuccess<UpdateProfileResponse>>(
    "/employers/me/profile",
    body,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.data.employer;
}
