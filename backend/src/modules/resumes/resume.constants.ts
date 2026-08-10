export const RESUME_STATUSES = [
  "NOT_GENERATED",
  "READY",
  "OUTDATED",
  "REGENERATING",
  "FAILED",
] as const;

export const RESUME_TEMPLATE_IDS = [
  "ats_professional",
  "modern",
  "blue_collar",
  "grey_collar",
  "simple",
] as const;

export const RESUME_GENERATION_SOURCES = [
  "profile",
  "manual",
  "ai",
  "system",
] as const;

export const RESUME_DEFAULT_TEMPLATE_ID =
  "ats_professional" as const satisfies (typeof RESUME_TEMPLATE_IDS)[number];

export const RESUME_TEMPLATE_VERSION = "1.0" as const;

export const RESUME_DEFAULT_GENERATION_SOURCE =
  "profile" as const satisfies (typeof RESUME_GENERATION_SOURCES)[number];

export const RESUME_DEFAULT_STATUS =
  "NOT_GENERATED" as const satisfies (typeof RESUME_STATUSES)[number];

/**
 * Profile completeness weights (must sum to 100).
 * Personal / Preferences / Education / Experience / Languages.
 */
export const RESUME_PROFILE_COMPLETENESS_WEIGHTS = {
  personal: 20,
  preferences: 20,
  education: 20,
  experience: 20,
  languages: 20,
} as const;

export const RESUME_EVENT_NAMES = {
  REGISTRATION_COMPLETED: "resume.registration_completed",
  PROFILE_UPDATED: "resume.profile_updated",
  EXPERIENCE_UPDATED: "resume.experience_updated",
  EDUCATION_UPDATED: "resume.education_updated",
  REGENERATION_REQUESTED: "resume.regeneration_requested",
  GENERATION_FAILED: "resume.generation_failed",
} as const;

/** Which resume is used when applying to jobs. */
export const APPLICATION_RESUME_SOURCES = ["generated", "uploaded"] as const;

export const JOB_SEEKER_UPLOADED_RESUME_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const JOB_SEEKER_UPLOADED_RESUME_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
] as const;

/** Align with employer document upload limit. */
export const JOB_SEEKER_UPLOADED_RESUME_MAX_SIZE_BYTES = 5 * 1024 * 1024;
