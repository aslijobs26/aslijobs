import { apiClient } from "@/services/api-client";
import type { EmployerLoginPublic } from "@/services/employer-login.service";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type EmployerProfilePublic = EmployerLoginPublic & {
  establishmentName: string;
  industry: string;
  businessCategory: string;
  minimumEmployees: number | null;
  maximumEmployees: number | null;
  companyLogo: EmployerLoginPublic["companyLogo"];
  profilePhoto: EmployerLoginPublic["profilePhoto"];
  companyAddress: string;
  pincode: string;
  city: string;
  state: string;
};

type MeResponse = {
  employer: EmployerProfilePublic;
};

type UpdateProfileResponse = {
  employer: EmployerProfilePublic;
};

export type UpdateEmployerProfileInput = {
  companyName?: string;
  establishmentName?: string;
  industry?: string;
  businessCategory?: string;
  companyDescription?: string;
  website?: string;
  foundedYear?: number | null;
  companyType?: string;
  gstNumber?: string;
  panNumber?: string;
  registrationNumber?: string;
  minimumEmployees?: number;
  maximumEmployees?: number;
  companyAddress?: string;
  pincode?: string;
  city?: string;
  state?: string;
  emailAddress?: string;
  firstName?: string;
  lastName?: string;
  contactDesignation?: string;
  alternatePhone?: string;
  aboutUs?: string;
  culture?: string;
  benefits?: string;
  vision?: string;
  mission?: string;
  values?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  companyLogoFile?: File;
  profilePhotoFile?: File;
  companyMediaFiles?: File[];
  removeCompanyMediaPublicIds?: string[];
  companyMediaOrder?: string[];
  removeCompanyLogo?: boolean;
  removeProfilePhoto?: boolean;
  companyProfileVisited?: true;
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
  if (typeof input.establishmentName === "string") {
    body.append("establishmentName", input.establishmentName);
  }
  if (typeof input.industry === "string") {
    body.append("industry", input.industry);
  }
  if (typeof input.businessCategory === "string") {
    body.append("businessCategory", input.businessCategory);
  }
  if (typeof input.companyDescription === "string") {
    body.append("companyDescription", input.companyDescription);
  }
  if (typeof input.website === "string") {
    body.append("website", input.website);
  }
  if (typeof input.foundedYear === "number") {
    body.append("foundedYear", String(input.foundedYear));
  } else if (input.foundedYear === null) {
    body.append("foundedYear", "");
  }
  if (typeof input.companyType === "string") {
    body.append("companyType", input.companyType);
  }
  if (typeof input.gstNumber === "string") {
    body.append("gstNumber", input.gstNumber);
  }
  if (typeof input.panNumber === "string") {
    body.append("panNumber", input.panNumber);
  }
  if (typeof input.registrationNumber === "string") {
    body.append("registrationNumber", input.registrationNumber);
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
  if (typeof input.contactDesignation === "string") {
    body.append("contactDesignation", input.contactDesignation);
  }
  if (typeof input.alternatePhone === "string") {
    body.append("alternatePhone", input.alternatePhone);
  }
  if (typeof input.aboutUs === "string") {
    body.append("aboutUs", input.aboutUs);
  }
  if (typeof input.culture === "string") {
    body.append("culture", input.culture);
  }
  if (typeof input.benefits === "string") {
    body.append("benefits", input.benefits);
  }
  if (typeof input.vision === "string") {
    body.append("vision", input.vision);
  }
  if (typeof input.mission === "string") {
    body.append("mission", input.mission);
  }
  if (typeof input.values === "string") {
    body.append("values", input.values);
  }
  if (typeof input.linkedinUrl === "string") {
    body.append("linkedinUrl", input.linkedinUrl);
  }
  if (typeof input.facebookUrl === "string") {
    body.append("facebookUrl", input.facebookUrl);
  }
  if (typeof input.instagramUrl === "string") {
    body.append("instagramUrl", input.instagramUrl);
  }
  if (typeof input.twitterUrl === "string") {
    body.append("twitterUrl", input.twitterUrl);
  }
  if (typeof input.youtubeUrl === "string") {
    body.append("youtubeUrl", input.youtubeUrl);
  }
  if (input.removeCompanyMediaPublicIds) {
    body.append(
      "removeCompanyMediaPublicIds",
      JSON.stringify(input.removeCompanyMediaPublicIds),
    );
  }
  if (input.companyMediaOrder) {
    body.append("companyMediaOrder", JSON.stringify(input.companyMediaOrder));
  }
  if (input.removeCompanyLogo) {
    body.append("removeCompanyLogo", "true");
  }
  if (input.removeProfilePhoto) {
    body.append("removeProfilePhoto", "true");
  }
  if (input.companyProfileVisited) {
    body.append("companyProfileVisited", "true");
  }
  if (input.companyLogoFile) {
    body.append("companyLogo", input.companyLogoFile);
  }
  if (input.profilePhotoFile) {
    body.append("profilePhoto", input.profilePhotoFile);
  }
  for (const file of input.companyMediaFiles ?? []) {
    body.append("companyMedia", file);
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
