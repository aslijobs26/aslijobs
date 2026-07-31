import type { TeamPermissionModule } from "@/types/employer-team";
import { ROUTES } from "@/constants/routes";

export const RBAC_QUERY_KEYS = {
  all: ["employer-rbac"] as const,
  session: () => [...RBAC_QUERY_KEYS.all, "session"] as const,
};

export type RbacNavModule = TeamPermissionModule | "help";

/** Maps sidebar nav item ids → permission modules (null = always visible). */
export const NAV_ITEM_PERMISSION_MODULE: Record<
  string,
  TeamPermissionModule | null
> = {
  dashboard: "dashboard",
  jobs: "jobs",
  candidates: "candidates",
  interviews: "interviews",
  messages: "messages",
  "saved-candidates": "candidates",
  campaigns: "campaigns",
  analytics: "reports",
  reports: "reports",
  subscription: "subscription",
  "company-profile": "company_profile",
  "team-management": "team_management",
  settings: "settings",
};

export const ROUTE_PERMISSION_RULES: Array<{
  prefix: string;
  module: TeamPermissionModule;
  action?: "read" | "create" | "update" | "delete" | "export";
}> = [
  { prefix: ROUTES.EMPLOYER_DASHBOARD, module: "dashboard" },
  { prefix: ROUTES.EMPLOYER_JOBS, module: "jobs" },
  { prefix: ROUTES.POST_JOB, module: "jobs", action: "create" },
  { prefix: ROUTES.EMPLOYER_CANDIDATES, module: "candidates" },
  { prefix: ROUTES.EMPLOYER_SAVED_CANDIDATES, module: "candidates" },
  { prefix: ROUTES.EMPLOYER_INTERVIEWS, module: "interviews" },
  { prefix: ROUTES.EMPLOYER_MESSAGES, module: "messages" },
  { prefix: ROUTES.EMPLOYER_CAMPAIGNS, module: "campaigns" },
  { prefix: ROUTES.EMPLOYER_ANALYTICS, module: "reports" },
  { prefix: ROUTES.EMPLOYER_REPORTS, module: "reports" },
  { prefix: ROUTES.EMPLOYER_SUBSCRIPTION, module: "subscription" },
  { prefix: ROUTES.EMPLOYER_COMPANY_PROFILE, module: "company_profile" },
  { prefix: ROUTES.EMPLOYER_TEAM_MANAGEMENT, module: "team_management" },
  { prefix: ROUTES.EMPLOYER_SETTINGS, module: "settings" },
];

export const EMPLOYER_UNAUTHORIZED_PATH = "/employer/unauthorized";
