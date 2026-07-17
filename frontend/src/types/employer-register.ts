import type { StaticImageData } from "next/image";

export type EmployerRegisterAccountType = "company" | "individual";

export type EmployerRegisterStep = "account" | "company-profile";

export type EmployerRegisterDocumentType =
  | "aadhaar"
  | "pan"
  | "driving-licence"
  | "voter-id";

export type EmployerRegisterBusinessDocumentType =
  | "gst"
  | "certificate-of-incorporation"
  | "msme-udyam-registration"
  | "shop-establishment-license"
  | "trade-license"
  | "pan-card-business"
  | "trust-society-registration";

export type EmployerRegisterDocumentPreview = {
  name: string;
  sizeBytes: number;
};

export type EmployerRegisterFormData = {
  companyName: string;
  firstName: string;
  lastName: string;
  whatsappNumber: string;
  emailAddress: string;
};

export type EmployerRegisterCompanyProfileData = {
  companyName: string;
  industry: string;
  businessCategory: string;
  companyAddress: string;
  pincode: string;
  city: string;
  state: string;
  whatsappNumber: string;
  emailAddress: string;
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
