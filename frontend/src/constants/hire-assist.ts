export const HIRE_ASSIST_MESSAGE_MIN = 20;
export const HIRE_ASSIST_MESSAGE_MAX = 2000;

export const HIRE_ASSIST_OPTIONS = [
  { value: "job_posting", label: "Job Posting Assistance" },
  { value: "candidate_sourcing", label: "Candidate Sourcing" },
  { value: "bulk_hiring", label: "Bulk Hiring Assistance" },
  { value: "blue_collar", label: "Blue Collar Workforce Hiring" },
  { value: "grey_collar", label: "Grey Collar Workforce Hiring" },
  { value: "candidate_shortlisting", label: "Candidate Shortlisting" },
  { value: "whatsapp_hiring", label: "WhatsApp Hiring Assistance" },
  { value: "employer_account", label: "Employer Account Assistance" },
  { value: "employer_verification", label: "Employer Verification Assistance" },
  { value: "subscription_payment", label: "Subscription / Payment Assistance" },
  { value: "technical_support", label: "Technical Support" },
  { value: "other", label: "Other" },
] as const;

export type HireAssistAssistanceValue =
  (typeof HIRE_ASSIST_OPTIONS)[number]["value"];
