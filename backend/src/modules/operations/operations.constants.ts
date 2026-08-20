export const OPERATIONS_TEAM_ROLES = [
  "SUPER_ADMIN",
  "OPERATIONS",
  "SUPPORT",
  "MARKETING",
  "CONTENT_LANGUAGE",
  "SALES",
] as const;

export type OperationsTeamRole = (typeof OPERATIONS_TEAM_ROLES)[number];

export const OPERATIONS_TEAM_USER_STATUSES = [
  "active",
  "inactive",
  "suspended",
] as const;

/**
 * Operations module route prefix (not mounted until APIs are implemented).
 */
export const OPERATIONS_API_PREFIX = "/operations" as const;

export const OPERATIONS_TASK_PRIORITIES = ["high", "medium", "low"] as const;

export const OPERATIONS_ENTITY_TYPES = [
  "employer",
  "candidate",
  "job",
  "verification",
  "support",
] as const;

export const OPERATIONS_ESCALATION_CATEGORIES = [
  "sla_breach",
  "waiting_customer",
  "high_priority",
  "compliance",
] as const;

export const OPERATIONS_SLA_CATEGORIES = [
  "employer_support",
  "candidate_support",
  "job_moderation",
  "verification",
  "general_support",
] as const;
