import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  Home,
  Inbox,
  LayoutDashboard,
  MapPin,
  Settings,
  Ticket,
  Users,
  UsersRound,
  BarChart3,
  FolderKanban,
} from "lucide-react";
import { OPERATIONS_ROUTES } from "./operations-routes";

export interface OperationsNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
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
      },
      {
        id: "my-work",
        label: "My Work",
        href: OPERATIONS_ROUTES.MY_WORK,
        icon: FolderKanban,
        badge: 24,
      },
      {
        id: "inbox",
        label: "Inbox",
        href: OPERATIONS_ROUTES.INBOX,
        icon: Inbox,
        badge: 8,
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
      },
      {
        id: "employers",
        label: "Employers",
        href: OPERATIONS_ROUTES.EMPLOYERS,
        icon: Building2,
      },
      {
        id: "jobs",
        label: "Jobs",
        href: OPERATIONS_ROUTES.JOBS,
        icon: Briefcase,
      },
      {
        id: "placements",
        label: "Placements",
        href: OPERATIONS_ROUTES.PLACEMENTS,
        icon: MapPin,
      },
      {
        id: "support",
        label: "Support",
        href: OPERATIONS_ROUTES.SUPPORT_TICKETS,
        icon: Ticket,
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
      },
      {
        id: "analytics",
        label: "Analytics",
        href: `${OPERATIONS_ROUTES.JOBS}?view=analytics`,
        icon: BarChart3,
      },
      {
        id: "organization",
        label: "Organization",
        href: OPERATIONS_ROUTES.TEAM_MANAGEMENT,
        icon: UsersRound,
      },
    ],
  },
    {
      id: "system",
      label: "SYSTEM",
      items: [
      {
        id: "settings",
        label: "Settings",
        href: OPERATIONS_ROUTES.SETTINGS,
        icon: Settings,
      },
    ],
  },
];

export const OPERATIONS_NAV_ITEM_PERMISSION_MODULE: Record<
  string,
  import("./operations-permissions").OperationsPermissionModule
> = {
  home: "dashboard",
  "my-work": "my_work",
  inbox: "whatsapp",
  jobseekers: "candidates",
  employers: "employers",
  jobs: "jobs",
  placements: "jobs",
  support: "support",
  "operations-dashboard": "dashboard",
  analytics: "jobs",
  organization: "team",
  settings: "settings",
};

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
