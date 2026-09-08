export const OPERATIONS_REGISTRATION_AWARENESS_STATES = [
  "new",
  "seen",
] as const;

export type OperationsRegistrationAwarenessState =
  (typeof OPERATIONS_REGISTRATION_AWARENESS_STATES)[number];

export const OPERATIONS_REGISTRATION_ENTITY_TYPES = [
  "employer",
  "candidate",
] as const;

export type OperationsRegistrationEntityType =
  (typeof OPERATIONS_REGISTRATION_ENTITY_TYPES)[number];

export const OPERATIONS_REGISTRATION_NOTIFICATION_TYPES = [
  "employer.registered",
  "candidate.registered",
] as const;

export type OperationsRegistrationNotificationType =
  (typeof OPERATIONS_REGISTRATION_NOTIFICATION_TYPES)[number];

export const OPERATIONS_REGISTRATION_AUDIT_ACTIONS = {
  EMPLOYER_REGISTERED: "employer.registered",
  CANDIDATE_REGISTERED: "candidate.registered",
} as const;

/** Default recent-feed size for dashboard cards. */
export const OPERATIONS_REGISTRATION_RECENT_LIMIT = 8;

/**
 * Asia/Kolkata — matches Operations employers/candidates analytics conventions.
 */
export const OPERATIONS_BUSINESS_TIMEZONE = "Asia/Kolkata";
