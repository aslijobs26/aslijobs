/**
 * Shared auth / registration validation copy for Employer & Jobseeker flows.
 * Product auth is WhatsApp OTP — no password messages belong here.
 */
export const AUTH_VALIDATION_MESSAGES = {
  WHATSAPP_REQUIRED: "WhatsApp number is required.",
  WHATSAPP_INVALID: "Please enter a valid 10-digit WhatsApp number.",

  FIRST_NAME_REQUIRED: "First name is required.",
  LAST_NAME_REQUIRED: "Last name is required.",
  FULL_NAME_REQUIRED: "Full name is required.",

  COMPANY_NAME_REQUIRED: "Company name is required.",
  ESTABLISHMENT_NAME_REQUIRED: "Establishment name is required.",
  CONSULTANCY_NAME_REQUIRED: "Consultancy name is required.",

  EMAIL_INVALID: "Please enter a valid email address.",

  OTP_REQUIRED: "Verification code is required.",
  OTP_INVALID: "Incorrect verification code.",
  OTP_EXPIRED: "Your verification code has expired. Please request a new code.",
  OTP_TOO_MANY: "Too many attempts. Please try again later.",

  DOCUMENT_REQUIRED: "Please upload the required document.",
  DOCUMENT_TYPE_REQUIRED: "Please select a document type.",
  FILE_TYPE_INVALID: "Unsupported file type. Please upload PDF, JPG, or PNG.",
  FILE_SIZE_INVALID: "File size must be less than 5 MB.",

  COMPANY_ADDRESS_REQUIRED: "Company address is required.",
  PINCODE_REQUIRED: "Pincode is required.",
  CITY_REQUIRED: "City is required.",
  STATE_REQUIRED: "State is required.",

  INDUSTRY_REQUIRED: "Industry is required.",
  BUSINESS_CATEGORY_REQUIRED: "Business category is required.",
  COMPANY_STRENGTH_REQUIRED: "Company strength is required.",

  COMPANY_LOGO_REQUIRED: "Company logo is required.",

  DUPLICATE_WHATSAPP:
    "An account with this WhatsApp number already exists.",
  DUPLICATE_EMAIL: "An account with this email already exists.",

  NETWORK_ERROR:
    "Unable to connect to the server. Please check your connection and try again.",
  SERVER_ERROR: "Something went wrong. Please try again.",
  GENERIC_SUBMIT_ERROR: "Unable to complete your request. Please try again.",

  LOGIN_NOT_REGISTERED:
    "No account found with this WhatsApp number. Please register first.",
  COMPLETE_REGISTRATION: "Complete your registration first.",

  ACCOUNT_SUSPENDED:
    "Your account is currently suspended. Please contact support.",
  ACCOUNT_INACTIVE:
    "Your account is currently inactive. Please contact support.",
} as const;

export type AuthValidationMessageKey = keyof typeof AUTH_VALIDATION_MESSAGES;

/** Maps known backend auth messages to consistent frontend copy. */
export const BACKEND_AUTH_MESSAGE_MAP: Record<string, string> = {
  "Employer not registered.": AUTH_VALIDATION_MESSAGES.LOGIN_NOT_REGISTERED,
  "Job seeker not registered.": AUTH_VALIDATION_MESSAGES.LOGIN_NOT_REGISTERED,
  "Complete your registration first.":
    AUTH_VALIDATION_MESSAGES.COMPLETE_REGISTRATION,
  "Duplicate WhatsApp Number": AUTH_VALIDATION_MESSAGES.DUPLICATE_WHATSAPP,
  "This WhatsApp number is already registered":
    AUTH_VALIDATION_MESSAGES.DUPLICATE_WHATSAPP,
  "Duplicate Email": AUTH_VALIDATION_MESSAGES.DUPLICATE_EMAIL,
  "Invalid OTP": AUTH_VALIDATION_MESSAGES.OTP_INVALID,
  "OTP Expired": AUTH_VALIDATION_MESSAGES.OTP_EXPIRED,
  "Maximum Attempts Reached": AUTH_VALIDATION_MESSAGES.OTP_TOO_MANY,
  "Your account is currently suspended. Please contact support.":
    AUTH_VALIDATION_MESSAGES.ACCOUNT_SUSPENDED,
  "Your account is currently inactive. Please contact support.":
    AUTH_VALIDATION_MESSAGES.ACCOUNT_INACTIVE,
};

/**
 * Conflict / account messages that should also bind to a specific field
 * when the API returns only a top-level `message` (no `details.fieldErrors`).
 */
export const AUTH_MESSAGE_FIELD_BINDINGS: Record<string, string> = {
  [AUTH_VALIDATION_MESSAGES.DUPLICATE_WHATSAPP]: "whatsappNumber",
  [AUTH_VALIDATION_MESSAGES.DUPLICATE_EMAIL]: "emailAddress",
  [AUTH_VALIDATION_MESSAGES.LOGIN_NOT_REGISTERED]: "whatsappNumber",
  [AUTH_VALIDATION_MESSAGES.COMPLETE_REGISTRATION]: "whatsappNumber",
};
