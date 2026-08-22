export const OPERATIONS_ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  DASHBOARD: "/operations",
  MY_WORK: "/operations/my-work",
  WORK_QUEUE: "/operations/work-queue",
  WHATSAPP_INBOX: "/operations/whatsapp-inbox",
  JOURNEY_ALERTS: "/operations/journey-alerts",
  SUPPORT_TICKETS: "/operations/support-tickets",
  EMPLOYERS: "/operations/employers",
  CANDIDATES: "/operations/candidates",
  JOBS: "/operations/jobs",
  JOBS_POST: "/operations/jobs/post",
  VERIFICATIONS: "/operations/verifications",
  ESCALATIONS: "/operations/escalations",
  TEAM_MANAGEMENT: "/operations/team",
  DEPARTMENTS: "/operations/departments",
  ROLES: "/operations/roles",
  ACTIVITY_LOG: "/operations/activity-log",
  SUBSCRIPTIONS: "/operations/subscriptions",
  PAYMENTS: "/operations/payments",
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
