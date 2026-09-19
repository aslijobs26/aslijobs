import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  Building2,
  FileCheck2,
  FolderKanban,
  HelpCircle,
  Home,
  Inbox,
  Languages,
  LayoutDashboard,
  Megaphone,
  Network,
  Rocket,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { OPERATIONS_ROUTES } from "./operations-routes";
import type { OperationsNavBadgeKey } from "../types/operations-registration-awareness";
import type {
  OperationsPermissionAction,
  OperationsPermissionModule,
} from "./operations-permissions";

export type { OperationsNavBadgeKey };

export type OperationsNavPermission = {
  module: OperationsPermissionModule;
  action?: OperationsPermissionAction;
};

export interface OperationsNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Authenticated Organization users always see this item. */
  allowAuthenticated?: boolean;
  requiredPermission?: OperationsNavPermission;
  requiredAnyPermissions?: OperationsNavPermission[];
  /** Static badge count (prefer badgeKey for live counts). */
  badge?: number;
  /** Live badge from registration-awareness / nav badges API. */
  badgeKey?: OperationsNavBadgeKey;
  /** Accessible label builder for live badges, e.g. (n) => `${n} new employers`. */
  badgeAriaLabel?: (count: number) => string;
}

export interface OperationsNavSection {
  id: string;
  label: string;
  items: OperationsNavItem[];
}

/**
 * ASLI OS sidebar structure aligned to the Operational Dashboard reference.
 * Routes map to existing modules; placeholder routes keep nav complete without
 * breaking live Employers / Candidates / Jobs / Team pages.
 */
export const OPERATIONS_NAV_SECTIONS: OperationsNavSection[] = [
  {
    id: "top",
    label: "",
    items: [
      {
        id: "home",
        label: "Home",
        href: OPERATIONS_ROUTES.HOME,
        icon: Home,
        allowAuthenticated: true,
      },
      {
        id: "my-work",
        label: "My Work",
        href: OPERATIONS_ROUTES.MY_WORK,
        icon: FolderKanban,
        requiredPermission: { module: "my_work", action: "read" },
      },
      {
        id: "inbox",
        label: "Inbox",
        href: OPERATIONS_ROUTES.INBOX,
        icon: Inbox,
        requiredPermission: { module: "whatsapp", action: "read" },
      },
    ],
  },
  {
    id: "operations",
    label: "OPERATIONS",
    items: [
      {
        id: "jobseekers",
        label: "Jobseekers",
        href: OPERATIONS_ROUTES.CANDIDATES,
        icon: Users,
        requiredPermission: { module: "candidates", action: "read" },
        badgeKey: "newCandidates",
        badgeAriaLabel: (count) =>
          `${count} new jobseeker registration${count === 1 ? "" : "s"}`,
      },
      {
        id: "employers",
        label: "Employers",
        href: OPERATIONS_ROUTES.EMPLOYERS,
        icon: Building2,
        requiredPermission: { module: "employers", action: "read" },
        badgeKey: "newEmployers",
        badgeAriaLabel: (count) =>
          `${count} new employer registration${count === 1 ? "" : "s"}`,
      },
      {
        id: "verifications",
        label: "Verifications",
        href: OPERATIONS_ROUTES.VERIFICATIONS,
        icon: FileCheck2,
        requiredPermission: { module: "verifications", action: "read" },
        badgeKey: "pendingVerifications",
        badgeAriaLabel: (count) =>
          `${count} pending verification${count === 1 ? "" : "s"}`,
      },
      {
        id: "jobs",
        label: "Jobs",
        href: OPERATIONS_ROUTES.JOBS,
        icon: Briefcase,
        requiredPermission: { module: "jobs", action: "read" },
        badgeKey: "pendingJobs",
        badgeAriaLabel: (count) =>
          `${count} pending job${count === 1 ? "" : "s"}`,
      },
      {
        id: "placements",
        label: "Placements",
        href: OPERATIONS_ROUTES.PLACEMENTS,
        icon: Rocket,
        requiredPermission: { module: "placements", action: "read" },
      },
      {
        id: "support",
        label: "Support",
        href: OPERATIONS_ROUTES.SUPPORT_TICKETS,
        icon: HelpCircle,
        requiredPermission: { module: "support", action: "read" },
      },
    ],
  },
  {
    id: "business",
    label: "BUSINESS",
    items: [
      {
        id: "business-development",
        label: "Business Development",
        href: OPERATIONS_ROUTES.BUSINESS_DEVELOPMENT,
        icon: Network,
        requiredPermission: { module: "campaigns", action: "read" },
      },
      {
        id: "promotions-events",
        label: "Promotions & Events",
        href: OPERATIONS_ROUTES.PROMOTIONS_EVENTS,
        icon: Megaphone,
        requiredPermission: { module: "campaigns", action: "read" },
      },
      {
        id: "payments-subscriptions",
        label: "Payments & Subscriptions",
        href: OPERATIONS_ROUTES.PAYMENTS,
        icon: Shield,
        requiredPermission: { module: "billing", action: "read" },
      },
    ],
  },
  {
    id: "management",
    label: "MANAGEMENT",
    items: [
      {
        id: "operations-dashboard",
        label: "Operations",
        href: OPERATIONS_ROUTES.DASHBOARD,
        icon: LayoutDashboard,
        requiredPermission: { module: "dashboard", action: "read" },
      },
      {
        id: "analytics",
        label: "Analytics",
        href: OPERATIONS_ROUTES.ANALYTICS,
        icon: BarChart3,
        requiredPermission: { module: "jobs", action: "read" },
      },
      {
        id: "organization",
        label: "Organization",
        href: OPERATIONS_ROUTES.ORGANIZATION,
        icon: Network,
        requiredAnyPermissions: [
          { module: "team", action: "read" },
          { module: "roles", action: "read" },
          { module: "departments", action: "read" },
          { module: "settings", action: "read" },
        ],
      },
    ],
  },
  {
    id: "platform",
    label: "PLATFORM",
    items: [
      {
        id: "languages",
        label: "Languages & Localization",
        href: OPERATIONS_ROUTES.LANGUAGES,
        icon: Languages,
        requiredPermission: { module: "settings", action: "read" },
      },
      {
        id: "settings",
        label: "Settings",
        href: OPERATIONS_ROUTES.SETTINGS,
        icon: Settings,
        requiredPermission: { module: "settings", action: "read" },
      },
    ],
  },
];

export const OPERATIONS_BRAND = {
  name: "ASLI OS",
  tagline: "Jobs for a brighter tomorrow",
} as const;

export const MOCK_OPERATIONS_USER = {
  name: "Ravi Kumar",
  role: "Operations Manager",
  status: "Online" as const,
  initials: "RK",
} as const;
