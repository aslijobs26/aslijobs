import type { StaticImageData } from "next/image";

export type EmployerRegisterAccountType =
  | "company"
  | "consultancy"
  | "individual";

export type EmployerRegisterStep = "account" | "company-profile";

export type EmployerRegisterDocumentType =
  | "aadhaar"
  | "pan"
  | "driving-licence"
  | "voter-id";

export type EmployerRegisterBusinessDocumentType =
  | "gst-certificate"
  | "certificate-of-incorporation"
  | "llp-registration-certificate"
  | "msme-udyam-registration"
  | "shop-establishment-license"
  | "trade-license"
  | "pan-card-business"
  | "trust-society-registration"
  | "partnership-deed"
  | "fssai-license"
  | "other-government-registration";

export type EmployerRegisterDocumentPreview = {
  name: string;
  sizeBytes: number;
  file: File;
};

export type EmployerRegisterImagePreview = {
  name: string;
  sizeBytes: number;
  file: File;
  previewUrl: string;
};

export type EmployerRegisterFormData = {
  companyName: string;
  establishmentName: string;
  firstName: string;
  lastName: string;
  whatsappNumber: string;
  emailAddress: string;
};

export type EmployerRegisterCompanyProfileData = {
  companyName: string;
  industry: string;
  businessCategory: string;
  companyStrength: string;
  minimumEmployees: string;
  maximumEmployees: string;
  companyAddress: string;
  pincode: string;
  city: string;
  state: string;
  verificationDocument: EmployerRegisterBusinessDocumentType | "";
};

export type EmployerRegisterSelectOption = {
  value: string;
  label: string;
};

export type EmployerRegisterTestimonial = {
  id: string;
  quote: string;
  name: string;
  designation: string;
  avatar: StaticImageData;
  avatarAlt: string;
};
