import { OPERATIONS_ROUTES } from "./operations-routes";
import type {
  OperationsPermissionAction,
  OperationsPermissionModule,
} from "./operations-permissions";

/**
 * Optional route → permission rules for future UI gating.
 * Routes without a rule remain accessible to any authenticated ops user.
 * SUPER_ADMIN always passes via the full permission matrix.
 */
export type OperationsRoutePermissionRule = {
  prefix: string;
  module: OperationsPermissionModule;
  action?: OperationsPermissionAction;
};

export const OPERATIONS_ROUTE_PERMISSION_RULES: OperationsRoutePermissionRule[] =
  [
    {
      prefix: OPERATIONS_ROUTES.DASHBOARD,
      module: "dashboard",
      action: "read",
    },
    { prefix: OPERATIONS_ROUTES.MY_WORK, module: "my_work", action: "read" },
    {
      prefix: OPERATIONS_ROUTES.WORK_QUEUE,
      module: "work_queue",
      action: "read",
    },
    {
      prefix: OPERATIONS_ROUTES.WHATSAPP_INBOX,
      module: "whatsapp",
      action: "read",
    },
    {
      prefix: OPERATIONS_ROUTES.JOURNEY_ALERTS,
      module: "journey_alerts",
      action: "read",
    },
    {
      prefix: OPERATIONS_ROUTES.SUPPORT_TICKETS,
      module: "support",
      action: "read",
    },
    {
      prefix: OPERATIONS_ROUTES.EMPLOYERS,
      module: "employers",
      action: "read",
    },
    {
      prefix: OPERATIONS_ROUTES.CANDIDATES,
      module: "candidates",
      action: "read",
    },
    { prefix: OPERATIONS_ROUTES.JOBS, module: "jobs", action: "read" },
    {
      prefix: OPERATIONS_ROUTES.VERIFICATIONS,
      module: "verifications",
      action: "read",
    },
    {
      prefix: OPERATIONS_ROUTES.ESCALATIONS,
      module: "escalations",
      action: "read",
    },
    {
      prefix: OPERATIONS_ROUTES.TEAM_MANAGEMENT,
      module: "team",
      action: "read",
    },
    { prefix: OPERATIONS_ROUTES.ROLES, module: "roles", action: "read" },
    {
      prefix: OPERATIONS_ROUTES.DEPARTMENTS,
      module: "departments",
      action: "read",
    },
    {
      prefix: OPERATIONS_ROUTES.ACTIVITY_LOG,
      module: "activity_logs",
      action: "read",
    },
    {
      prefix: OPERATIONS_ROUTES.SUBSCRIPTIONS,
      module: "billing",
      action: "read",
    },
    {
      prefix: OPERATIONS_ROUTES.PAYMENTS,
      module: "billing",
      action: "read",
    },
    {
      prefix: OPERATIONS_ROUTES.TRANSACTIONS,
      module: "billing",
      action: "read",
    },
    {
      prefix: OPERATIONS_ROUTES.REFUNDS,
      module: "billing",
      action: "read",
    },
    {
      prefix: OPERATIONS_ROUTES.TRUST_COMPLIANCE,
      module: "settings",
      action: "read",
    },
    {
      prefix: OPERATIONS_ROUTES.AUDIT_LOGS,
      module: "activity_logs",
      action: "read",
    },
    {
      prefix: OPERATIONS_ROUTES.POLICIES,
      module: "settings",
      action: "read",
    },
  ];

export function matchOperationsRoutePermissionRule(
  pathname: string,
): OperationsRoutePermissionRule | undefined {
  const sorted = [...OPERATIONS_ROUTE_PERMISSION_RULES].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );
  return sorted.find(
    (rule) =>
      pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
  );
}
