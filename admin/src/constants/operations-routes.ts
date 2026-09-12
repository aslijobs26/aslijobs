export const OPERATIONS_ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  DASHBOARD: "/operations",
  HOME: "/operations/home",
  MY_WORK: "/operations/my-work",
  MY_WORK_PERFORMANCE: "/operations/my-work/performance",
  WORK_QUEUE: "/operations/work-queue",
  WHATSAPP_INBOX: "/operations/whatsapp-inbox",
  INBOX: "/operations/inbox",
  JOURNEY_ALERTS: "/operations/journey-alerts",
  SUPPORT_TICKETS: "/operations/support-tickets",
  EMPLOYERS: "/operations/employers",
  CANDIDATES: "/operations/candidates",
  JOBS: "/operations/jobs",
  JOBS_POST: "/operations/jobs/post",
  PLACEMENTS: "/operations/placements",
  PLACEMENTS_LIST: "/operations/placements/list",
  VERIFICATIONS: "/operations/verifications",
  ESCALATIONS: "/operations/escalations",
  ANALYTICS: "/operations/analytics",
  ORGANIZATION: "/operations/organization",
  TEAM_MANAGEMENT: "/operations/team",
  DEPARTMENTS: "/operations/departments",
  ROLES: "/operations/roles",
  ROLES_NEW: "/operations/roles/new",
  ACTIVITY_LOG: "/operations/activity-log",
  SETTINGS: "/operations/settings",
  SUBSCRIPTIONS: "/operations/subscriptions",
  PAYMENTS: "/operations/payments",
  BUSINESS_DEVELOPMENT: "/operations/business-development",
  PROMOTIONS_EVENTS: "/operations/promotions-events",
  LANGUAGES: "/operations/languages",
  TRANSACTIONS: "/operations/transactions",
  REFUNDS: "/operations/refunds",
  TRUST_COMPLIANCE: "/operations/trust-compliance",
  AUDIT_LOGS: "/operations/audit-logs",
  POLICIES: "/operations/policies",
} as const;

export type OperationsRoute =
  (typeof OPERATIONS_ROUTES)[keyof typeof OPERATIONS_ROUTES];

export function operationsJobDetailPath(jobId: string): string {
  return `${OPERATIONS_ROUTES.JOBS}/${encodeURIComponent(jobId)}`;
}

export function operationsCandidateDetailPath(jobSeekerId: string): string {
  return `${OPERATIONS_ROUTES.CANDIDATES}/${encodeURIComponent(jobSeekerId)}`;
}

export function operationsEmployerDetailPath(employerId: string): string {
  return `${OPERATIONS_ROUTES.EMPLOYERS}/${encodeURIComponent(employerId)}`;
}

export function operationsVerificationReviewPath(employerId: string): string {
  return `${OPERATIONS_ROUTES.VERIFICATIONS}/${encodeURIComponent(employerId)}`;
}

export function operationsPlacementDetailPath(placementId: string): string {
  return `${OPERATIONS_ROUTES.PLACEMENTS}/${encodeURIComponent(placementId)}`;
}

export function operationsMyWorkDetailPath(workItemId: string): string {
  return `${OPERATIONS_ROUTES.MY_WORK}/${encodeURIComponent(workItemId)}`;
}

export function operationsRoleDetailPath(roleId: string): string {
  return `${OPERATIONS_ROUTES.ROLES}/${encodeURIComponent(roleId)}`;
}

export function operationsRoleEditPath(roleId: string): string {
  return `${OPERATIONS_ROUTES.ROLES}/${encodeURIComponent(roleId)}/edit`;
}
