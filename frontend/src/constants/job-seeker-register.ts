export const JOB_SEEKER_REGISTER_OTP_LENGTH = 4;

export const JOB_SEEKER_REGISTER_HEADING = "Create a Job Seeker Account";

export const JOB_SEEKER_REGISTER_LOGIN_PROMPT = "Already have an account?";

export const JOB_SEEKER_REGISTER_LOGIN_LABEL = "Job Seeker Login";

export const JOB_SEEKER_REGISTER_FULL_NAME_LABEL = "Full Name*";

export const JOB_SEEKER_REGISTER_FULL_NAME_PLACEHOLDER = "Enter your full name";

export const JOB_SEEKER_REGISTER_WHATSAPP_LABEL = "WhatsApp Number*";

export const JOB_SEEKER_REGISTER_WHATSAPP_PLACEHOLDER = "Enter WhatsApp Number";

export const JOB_SEEKER_REGISTER_SEND_OTP_LABEL = "Send OTP";

export const JOB_SEEKER_REGISTER_OTP_HEADING = "Verify WhatsApp Number";

export const JOB_SEEKER_REGISTER_OTP_DESCRIPTION =
  "We've sent a 4-digit verification code to your WhatsApp number.";

export const JOB_SEEKER_REGISTER_VERIFY_OTP_LABEL = "Verify OTP";

export const JOB_SEEKER_REGISTER_RESEND_PROMPT = "Didn't receive the code?";

export const JOB_SEEKER_REGISTER_RESEND_LABEL = "Resend OTP";

export const JOB_SEEKER_REGISTER_PROFILE_HEADING = "Complete Your Profile";

export const JOB_SEEKER_REGISTER_DOB_LABEL = "Date of Birth*";

export const JOB_SEEKER_REGISTER_DOB_PLACEHOLDER = "DD/MM/YYYY";

export const JOB_SEEKER_REGISTER_GENDER_LABEL = "Gender*";

export const JOB_SEEKER_REGISTER_GENDER_PLACEHOLDER = "Select gender";

export const JOB_SEEKER_REGISTER_PINCODE_LABEL = "Pincode*";

export const JOB_SEEKER_REGISTER_PINCODE_PLACEHOLDER = "Enter pincode";

export const JOB_SEEKER_REGISTER_CITY_LABEL = "City*";

export const JOB_SEEKER_REGISTER_CITY_PLACEHOLDER = "Enter city";

export const JOB_SEEKER_REGISTER_STATE_LABEL = "State*";

export const JOB_SEEKER_REGISTER_STATE_PLACEHOLDER = "Enter state";

export const JOB_SEEKER_REGISTER_JOB_ROLE_LABEL = "Job Role*";

export const JOB_SEEKER_REGISTER_JOB_ROLE_PLACEHOLDER = "Select job role";

export const JOB_SEEKER_REGISTER_PREFERRED_LOCATION_LABEL =
  "Preferred Job Location*";

export const JOB_SEEKER_REGISTER_PREFERRED_LOCATION_PLACEHOLDER =
  "City / District / State";

export const JOB_SEEKER_REGISTER_CREATE_ACCOUNT_LABEL = "Create Account";

export const JOB_SEEKER_GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

export const JOB_SEEKER_JOB_ROLE_OPTIONS = [
  { value: "Delivery Boy", label: "Delivery Boy" },
  { value: "Driver", label: "Driver" },
  { value: "Sales Executive", label: "Sales Executive" },
  { value: "Electrician", label: "Electrician" },
  { value: "Plumber", label: "Plumber" },
  { value: "Carpenter", label: "Carpenter" },
  { value: "Security Guard", label: "Security Guard" },
  { value: "Warehouse Associate", label: "Warehouse Associate" },
  { value: "Office Assistant", label: "Office Assistant" },
  { value: "Housekeeping", label: "Housekeeping" },
  { value: "Cook", label: "Cook" },
  { value: "Receptionist", label: "Receptionist" },
  { value: "Machine Operator", label: "Machine Operator" },
  { value: "Data Entry Operator", label: "Data Entry Operator" },
  { value: "Helper", label: "Helper" },
] as const;

export function isValidJobSeekerWhatsappNumber(value: string) {
  return /^\d{10}$/.test(value.trim());
}

export function isValidJobSeekerPincode(value: string) {
  return /^\d{6}$/.test(value.trim());
}
