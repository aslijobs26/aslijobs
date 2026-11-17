export const HIRE_ASSIST_TICKET_KIND = "hiring_assistance" as const;
export const HIRE_ASSIST_SOURCE_LABEL = "Hire Assist" as const;

export const HIRE_ASSIST_ASSISTANCE_TYPES = [
  "job_posting",
  "candidate_sourcing",
  "bulk_hiring",
  "blue_collar",
  "grey_collar",
  "candidate_shortlisting",
  "whatsapp_hiring",
  "employer_account",
  "employer_verification",
  "subscription_payment",
  "technical_support",
  "other",
] as const;

export type HireAssistAssistanceType =
  (typeof HIRE_ASSIST_ASSISTANCE_TYPES)[number];

export const HIRE_ASSIST_ASSISTANCE_LABELS: Record<
  HireAssistAssistanceType,
  string
> = {
  job_posting: "Job Posting Assistance",
  candidate_sourcing: "Candidate Sourcing",
  bulk_hiring: "Bulk Hiring Assistance",
  blue_collar: "Blue Collar Workforce Hiring",
  grey_collar: "Grey Collar Workforce Hiring",
  candidate_shortlisting: "Candidate Shortlisting",
  whatsapp_hiring: "WhatsApp Hiring Assistance",
  employer_account: "Employer Account Assistance",
  employer_verification: "Employer Verification Assistance",
  subscription_payment: "Subscription / Payment Assistance",
  technical_support: "Technical Support",
  other: "Other",
};

/** Friendly labels for the Support Tickets screen. Stored status stays the work-item enum. */
export const HIRE_ASSIST_STATUS_LABELS = {
  queued: "New",
  assigned: "Open",
  in_progress: "In Progress",
  waiting: "Waiting",
  completed: "Resolved",
  cancelled: "Closed",
} as const;
