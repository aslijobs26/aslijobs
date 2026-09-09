export const NOTIFICATION_RECIPIENT_TYPES = [
  "job_seeker",
  "employer",
] as const;

export const NOTIFICATION_PRIORITIES = ["low", "normal", "high"] as const;

export const NOTIFICATION_CATEGORIES = [
  "application",
  "interview",
  "offer",
  "system",
] as const;

/**
 * Stable notification type keys used for in-app rendering and future channels.
 */
export const NOTIFICATION_TYPES = [
  "application_submitted",
  "application_received",
  "application_viewed",
  "application_under_review",
  "application_shortlisted",
  "interview_scheduled",
  "interview_updated",
  "interview_completed",
  "interview_cancelled",
  "offer_sent",
  "application_selected",
  "application_joined",
  "application_rejected",
  "application_withdrawn",
  "candidate_withdrawn",
  "job_closed",
  "job_approved",
  "job_rejected",
  "job_live_changes_approved",
  "job_live_changes_rejected",
  "employer_verification_approved",
  "employer_verification_rejected",
  "employer_verification_documents_requested",
] as const;

export const NOTIFICATION_CHANNEL_DEFAULTS = {
  inApp: true,
  whatsapp: false,
  email: false,
  push: false,
} as const;
