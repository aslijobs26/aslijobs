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

export const JOB_SEEKER_REGISTER_PREFERENCES_HEADING = "Job Preferences";

export const JOB_SEEKER_REGISTER_EDUCATION_HEADING = "Education & Experience";

export const JOB_SEEKER_REGISTER_DOB_LABEL = "Date of Birth*";

export const JOB_SEEKER_REGISTER_DOB_PLACEHOLDER = "DD/MM/YYYY";

export const JOB_SEEKER_REGISTER_GENDER_LABEL = "Gender";

export const JOB_SEEKER_REGISTER_GENDER_PLACEHOLDER = "Select gender";

export const JOB_SEEKER_REGISTER_JOB_ROLE_LABEL = "Job Role*";

export const JOB_SEEKER_REGISTER_JOB_ROLE_PLACEHOLDER = "Search job role";

export const JOB_SEEKER_REGISTER_JOB_TYPE_LABEL = "Job Type";

export const JOB_SEEKER_REGISTER_JOB_TYPE_PLACEHOLDER = "Select job type";

export const JOB_SEEKER_REGISTER_WORK_MODE_LABEL = "Work Mode";

export const JOB_SEEKER_REGISTER_WORK_MODE_PLACEHOLDER = "Select work mode";

export const JOB_SEEKER_REGISTER_PREFERRED_LOCATION_LABEL =
  "Preferred Job Location*";

export const JOB_SEEKER_REGISTER_PREFERRED_LOCATION_PLACEHOLDER =
  "City / District / State";

export const JOB_SEEKER_REGISTER_EXPECTED_SALARY_LABEL = "Expected Salary*";

export const JOB_SEEKER_REGISTER_EXPECTED_SALARY_PLACEHOLDER =
  "Enter amount";

export const JOB_SEEKER_REGISTER_SALARY_PERIOD_OPTIONS = [
  { value: "per-month", label: "Per Month" },
  { value: "per-year", label: "Per Year" },
] as const;

export const JOB_SEEKER_REGISTER_CONTINUE_LABEL = "Continue";

export const JOB_SEEKER_REGISTER_CREATE_ACCOUNT_LABEL = "Create Account";

export const JOB_SEEKER_GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const JOB_SEEKER_JOB_TYPE_OPTIONS = [
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "contract", label: "Contract" },
] as const;

export const JOB_SEEKER_WORK_MODE_OPTIONS = [
  { value: "on-site", label: "On Site" },
  { value: "work-from-home", label: "Work From Home" },
  { value: "hybrid", label: "Hybrid" },
  { value: "field-work", label: "Field Work" },
  { value: "any", label: "Any" },
] as const;

export const JOB_SEEKER_EDUCATION_OPTIONS = [
  { value: "no_formal_education", label: "No Formal Education" },
  { value: "below_10th", label: "Below 10th" },
  { value: "10th_pass", label: "10th Pass" },
  { value: "intermediate", label: "Intermediate" },
  { value: "iti", label: "ITI" },
  { value: "diploma", label: "Diploma" },
  { value: "graduation", label: "Graduation" },
  { value: "post_graduation", label: "Post Graduation" },
] as const;

export const JOB_SEEKER_LANGUAGE_OPTIONS = [
  { value: "telugu", label: "తెలుగు" },
  { value: "english", label: "English" },
  { value: "hindi", label: "हिन्दी" },
  { value: "kannada", label: "ಕನ್ನಡ" },
  { value: "tamil", label: "தமிழ்" },
  { value: "malayalam", label: "മലയാളം" },
] as const;

export function isValidJobSeekerWhatsappNumber(value: string) {
  return /^\d{10}$/.test(value.trim());
}
