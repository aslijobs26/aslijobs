/**
 * Durable Operations audit actions for Job Approval & Moderation.
 * Naming follows existing `{entity}.{verb}` convention.
 */
export const OPERATIONS_JOB_AUDIT_ACTIONS = {
  SUBMITTED: "job.submitted_for_approval",
  RESUBMITTED: "job.resubmitted",
  APPROVED: "job.approved",
  REJECTED: "job.rejected",
  PAUSED: "job.paused",
  RESUMED: "job.resumed",
  CLOSED: "job.closed",
  REACTIVATED: "job.reactivated",
  EXPIRED: "job.expired",
  LIVE_REVISION_SUBMITTED: "job.live_revision_submitted",
  LIVE_REVISION_APPROVED: "job.live_revision_approved",
  LIVE_REVISION_REJECTED: "job.live_revision_rejected",
  OPERATIONS_PUBLISHED: "job.operations_published",
} as const;

export type OperationsJobAuditAction =
  (typeof OPERATIONS_JOB_AUDIT_ACTIONS)[keyof typeof OPERATIONS_JOB_AUDIT_ACTIONS];

/** Workspace-scoped Operations inbox types for job moderation. */
export const OPERATIONS_JOB_NOTIFICATION_TYPES = [
  "job.pending_approval",
  "job.resubmitted",
  "job.live_revision_submitted",
] as const;

export type OperationsJobNotificationType =
  (typeof OPERATIONS_JOB_NOTIFICATION_TYPES)[number];

export const JOB_REVIEW_HISTORY_KINDS = [
  "initial",
  "resubmission",
  "live_change",
] as const;

export type JobReviewHistoryKind = (typeof JOB_REVIEW_HISTORY_KINDS)[number];
