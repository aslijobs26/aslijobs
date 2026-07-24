import type {
  EMPLOYER_ACCOUNT_TYPES,
  EMPLOYER_BUSINESS_DOCUMENT_TYPES,
  EMPLOYER_DOCUMENT_VERIFICATION_STATUSES,
  EMPLOYER_IDENTITY_DOCUMENT_TYPES,
  EMPLOYER_INDUSTRIES,
  EMPLOYER_REGISTRATION_STATUSES,
} from "../../constants/employer.constants.js";

export type EmployerAccountType = (typeof EMPLOYER_ACCOUNT_TYPES)[number];

export type EmployerRegistrationStatus =
  (typeof EMPLOYER_REGISTRATION_STATUSES)[number];

export type EmployerBusinessDocumentType =
  (typeof EMPLOYER_BUSINESS_DOCUMENT_TYPES)[number];

export type EmployerIdentityDocumentType =
  (typeof EMPLOYER_IDENTITY_DOCUMENT_TYPES)[number];

export type EmployerDocumentVerificationStatus =
  (typeof EMPLOYER_DOCUMENT_VERIFICATION_STATUSES)[number];

export type EmployerIndustry = (typeof EMPLOYER_INDUSTRIES)[number];

export type RegisterEmployerInput = {
  accountType: EmployerAccountType;
  companyName: string;
  establishmentName?: string;
  firstName: string;
  lastName: string;
  emailAddress?: string;
  whatsappNumber: string;
};

export type VerifyEmployerOtpInput = {
  employerId: string;
  otp: string;
};

export type CompleteCompanyProfileInput = {
  employerId: string;
  companyName: string;
  industry?: string;
  businessCategory?: string;
  minimumEmployees?: number | null;
  maximumEmployees?: number | null;
  companyAddress: string;
  pincode: string;
  city: string;
  state: string;
  verificationDocument: EmployerBusinessDocumentType;
};

export type CompleteIndividualIdentityInput = {
  employerId: string;
  documentType: EmployerIdentityDocumentType;
};

export type UpdateEmployerProfileInput = {
  employerId: string;
  companyName?: string;
  establishmentName?: string;
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
  removeCompanyLogo?: boolean;
  removeProfilePhoto?: boolean;
};
