export const APPLICATION_STATUSES = [
  "submitted",
  "viewed",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "offer_sent",
  "selected",
  "joined",
  "rejected",
  "withdrawn",
] as const;

export const APPLICATION_DEFAULT_STATUS =
  "submitted" as const satisfies (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<
  (typeof APPLICATION_STATUSES)[number],
  string
> = {
  submitted: "Applied",
  viewed: "Viewed",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview Scheduled",
  interview_completed: "Interview Completed",
  offer_sent: "Offer Sent",
  selected: "Selected",
  joined: "Joined",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const APPLICATION_HISTORY_ACTORS = [
  "job_seeker",
  "employer",
  "system",
] as const;

export const APPLICATION_INTERVIEW_MODES = [
  "online",
  "offline",
  "phone",
] as const;

export const WITHDRAWABLE_STATUSES = [
  "submitted",
  "viewed",
  "under_review",
  "shortlisted",
] as const;

export const INTERVIEW_CANCELLATION_REASON_OPTIONS = [
  "Interviewer unavailable",
  "Candidate unavailable",
  "Position closed",
  "Position filled",
  "Scheduling conflict",
  "Other",
] as const;

/**
 * Future notification hooks — no emitter wired in Phase 6.
 */
export const APPLICATION_EVENT_NAMES = {
  SUBMITTED: "application.submitted",
  VIEWED: "application.viewed",
  UNDER_REVIEW: "application.under_review",
  SHORTLISTED: "application.shortlisted",
  INTERVIEW_SCHEDULED: "application.interview_scheduled",
  INTERVIEW_UPDATED: "application.interview_updated",
  INTERVIEW_COMPLETED: "application.interview_completed",
  INTERVIEW_CANCELLED: "application.interview_cancelled",
  OFFER_SENT: "application.offer_sent",
  SELECTED: "application.selected",
  REJECTED: "application.rejected",
  JOINED: "application.joined",
  WITHDRAWN: "application.withdrawn",
} as const;
