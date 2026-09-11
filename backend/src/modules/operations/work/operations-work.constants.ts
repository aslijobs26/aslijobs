/**
 * Operations Work Item domain constants.
 * Priorities match the My Work product UI (P1/P2/P3).
 */

export const WORK_ITEM_PRIORITIES = ["P1", "P2", "P3"] as const;
export type WorkItemPriority = (typeof WORK_ITEM_PRIORITIES)[number];

export const WORK_ITEM_STATUSES = [
  "queued",
  "assigned",
  "in_progress",
  "waiting",
  "completed",
  "cancelled",
] as const;
export type WorkItemStatus = (typeof WORK_ITEM_STATUSES)[number];

export const WORK_ITEM_TYPES = [
  "verification",
  "support",
  "job_operations",
  "jobseeker",
  "hiring_operations",
  "placements",
  "employer",
] as const;
export type WorkItemType = (typeof WORK_ITEM_TYPES)[number];

export const WORK_ITEM_ORIGINS = ["system_generated", "manual"] as const;
export type WorkItemOrigin = (typeof WORK_ITEM_ORIGINS)[number];

export const WORK_RELATED_ENTITY_TYPES = [
  "employer",
  "candidate",
  "job",
  "application",
  "verification",
  "placement",
  "support",
] as const;
export type WorkRelatedEntityType = (typeof WORK_RELATED_ENTITY_TYPES)[number];

export const WORK_ITEM_TYPE_LABELS: Record<WorkItemType, string> = {
  verification: "Verification",
  support: "Support",
  job_operations: "Job Operations",
  jobseeker: "Jobseeker",
  hiring_operations: "Hiring Operations",
  placements: "Placements",
  employer: "Employer",
};

export const WORK_ITEM_STATUS_LABELS: Record<WorkItemStatus, string> = {
  queued: "Queued",
  assigned: "Assigned",
  in_progress: "In Progress",
  waiting: "Waiting",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Default SLA horizons (ms) by work type when not overridden. */
export const WORK_TYPE_DEFAULT_SLA_MS: Record<WorkItemType, number> = {
  verification: 3 * 24 * 60 * 60 * 1000,
  support: 24 * 60 * 60 * 1000,
  job_operations: 24 * 60 * 60 * 1000,
  jobseeker: 2 * 24 * 60 * 60 * 1000,
  hiring_operations: 2 * 24 * 60 * 60 * 1000,
  placements: 7 * 24 * 60 * 60 * 1000,
  employer: 2 * 24 * 60 * 60 * 1000,
};

export const WORK_TYPE_DEFAULT_PRIORITY: Record<WorkItemType, WorkItemPriority> =
  {
    verification: "P1",
    support: "P1",
    job_operations: "P2",
    jobseeker: "P2",
    hiring_operations: "P2",
    placements: "P2",
    employer: "P2",
  };
