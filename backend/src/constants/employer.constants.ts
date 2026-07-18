export const OTP_LENGTH = 4;
export const OTP_EXPIRY_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 5;

export const EMPLOYER_DOCUMENT_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const EMPLOYER_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
] as const;

export const EMPLOYER_ACCOUNT_TYPES = ["company", "individual"] as const;

export const EMPLOYER_REGISTRATION_STATUSES = [
  "registered",
  "otp_sent",
  "pending_otp",
  "otp_verified",
  "document_uploaded",
  "profile_incomplete",
  "completed",
] as const;

export const EMPLOYER_DOCUMENT_VERIFICATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export const EMPLOYER_IDENTITY_DOCUMENT_TYPES = [
  "aadhaar",
  "pan",
  "driving-licence",
  "voter-id",
] as const;

export const EMPLOYER_BUSINESS_DOCUMENT_TYPES = [
  "gst-certificate",
  "certificate-of-incorporation",
  "llp-registration-certificate",
  "msme-udyam-registration",
  "shop-establishment-license",
  "trade-license",
  "pan-card-business",
  "trust-society-registration",
  "partnership-deed",
  "fssai-license",
  "other-government-registration",
] as const;

export const EMPLOYER_DOCUMENT_TYPES = [
  ...EMPLOYER_IDENTITY_DOCUMENT_TYPES,
  ...EMPLOYER_BUSINESS_DOCUMENT_TYPES,
] as const;

export const EMPLOYER_INDUSTRIES = [
  "construction-infrastructure",
  "manufacturing",
  "logistics-transportation",
  "retail-ecommerce",
  "hospitality",
  "healthcare",
  "education",
  "security-services",
  "facility-management",
  "it-software",
  "telecom",
  "agriculture",
  "banking-financial-services",
  "media-entertainment",
  "beauty-wellness",
  "domestic-home-services",
] as const;
