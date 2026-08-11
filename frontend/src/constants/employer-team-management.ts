import type { DepartmentColor, DepartmentIcon } from "@/types/employer-team";
import {
  Building2,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export const EMPLOYER_TEAM_PAGE_TITLE = "Team Management";
export const EMPLOYER_TEAM_PAGE_SUBTITLE =
  "Manage your team, roles, departments and permissions.";

export const EMPLOYER_TEAM_TABS = [
  { id: "members", label: "Team Members" },
  { id: "roles", label: "Roles & Permissions" },
  { id: "departments", label: "Departments" },
] as const;

export type EmployerTeamTabId = (typeof EMPLOYER_TEAM_TABS)[number]["id"];

export const EMPLOYER_TEAM_DEFAULT_TAB: EmployerTeamTabId = "members";

export const EMPLOYER_TEAM_SEARCH_PLACEHOLDER =
  "Search by name, code, description or head...";
export const EMPLOYER_TEAM_SEARCH_DEBOUNCE_MS = 300;
export const EMPLOYER_TEAM_DEFAULT_PAGE_SIZE = 10;
export const EMPLOYER_TEAM_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export const EMPLOYER_TEAM_QUERY_KEYS = {
  all: ["employer-team"] as const,
  stats: () => [...EMPLOYER_TEAM_QUERY_KEYS.all, "stats"] as const,
  departments: (params: unknown) =>
    [...EMPLOYER_TEAM_QUERY_KEYS.all, "departments", params] as const,
  department: (id: string) =>
    [...EMPLOYER_TEAM_QUERY_KEYS.all, "department", id] as const,
  departmentDetails: (id: string) =>
    [...EMPLOYER_TEAM_QUERY_KEYS.all, "department-details", id] as const,
  memberOptions: (params: unknown) =>
    [...EMPLOYER_TEAM_QUERY_KEYS.all, "member-options", params] as const,
  members: (params: unknown) =>
    [...EMPLOYER_TEAM_QUERY_KEYS.all, "members", params] as const,
  member: (id: string) =>
    [...EMPLOYER_TEAM_QUERY_KEYS.all, "member", id] as const,
  memberMe: () => [...EMPLOYER_TEAM_QUERY_KEYS.all, "member", "me"] as const,
  roles: () => [...EMPLOYER_TEAM_QUERY_KEYS.all, "roles"] as const,
  rolesManage: (params: unknown) =>
    [...EMPLOYER_TEAM_QUERY_KEYS.all, "roles-manage", params] as const,
  role: (id: string) => [...EMPLOYER_TEAM_QUERY_KEYS.all, "role", id] as const,
  roleDetails: (id: string) =>
    [...EMPLOYER_TEAM_QUERY_KEYS.all, "role-details", id] as const,
  permissionMatrixMeta: () =>
    [...EMPLOYER_TEAM_QUERY_KEYS.all, "permission-matrix-meta"] as const,
  sidebar: () => [...EMPLOYER_TEAM_QUERY_KEYS.all, "sidebar"] as const,
};

export type TeamStatKey =
  | "totalMembers"
  | "activeMembers"
  | "roles"
  | "pendingInvitations"
  | "departments";

export type TeamStatCardConfig = {
  key: TeamStatKey;
  label: string;
  subtitle: (value: number, stats: Record<TeamStatKey, number>) => string;
  icon: LucideIcon;
  iconWrapClassName: string;
};

export const EMPLOYER_TEAM_STAT_CARDS: readonly TeamStatCardConfig[] = [
  {
    key: "totalMembers",
    label: "Total Members",
    subtitle: (_value, stats) =>
      `Across ${stats.departments} department${stats.departments === 1 ? "" : "s"}`,
    icon: Users,
    iconWrapClassName: "bg-primary-light text-primary",
  },
  {
    key: "roles",
    label: "Roles",
    subtitle: () => "Custom roles created",
    icon: ShieldCheck,
    iconWrapClassName: "bg-violet-50 text-violet-600",
  },
  {
    key: "departments",
    label: "Departments",
    subtitle: () => "Across the organization",
    icon: Building2,
    iconWrapClassName: "bg-orange-50 text-orange-600",
  },
  {
    key: "pendingInvitations",
    label: "Pending Invites",
    subtitle: () => "Invites not accepted",
    icon: UserPlus,
    iconWrapClassName: "bg-sky-50 text-sky-600",
  },
] as const;

export const DEPARTMENT_COLOR_OPTIONS: readonly {
  value: DepartmentColor;
  label: string;
  swatchClassName: string;
}[] = [
  { value: "primary", label: "Teal", swatchClassName: "bg-primary" },
  { value: "sky", label: "Sky", swatchClassName: "bg-sky-500" },
  { value: "violet", label: "Violet", swatchClassName: "bg-violet-500" },
  { value: "amber", label: "Amber", swatchClassName: "bg-amber-500" },
  { value: "orange", label: "Orange", swatchClassName: "bg-orange-500" },
  { value: "rose", label: "Rose", swatchClassName: "bg-rose-500" },
  { value: "emerald", label: "Emerald", swatchClassName: "bg-emerald-500" },
  { value: "slate", label: "Slate", swatchClassName: "bg-slate-500" },
] as const;

export const DEPARTMENT_ICON_OPTIONS: readonly {
  value: DepartmentIcon;
  label: string;
}[] = [
  { value: "building", label: "Building" },
  { value: "users", label: "Users" },
  { value: "briefcase", label: "Briefcase" },
  { value: "headphones", label: "Support" },
  { value: "wallet", label: "Finance" },
  { value: "megaphone", label: "Marketing" },
  { value: "settings", label: "Operations" },
  { value: "shield", label: "Security" },
] as const;

export const DEPARTMENT_COLOR_ICON_WRAP: Record<DepartmentColor, string> = {
  primary: "bg-primary-light text-primary",
  sky: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
  amber: "bg-amber-50 text-amber-700",
  orange: "bg-orange-50 text-orange-700",
  rose: "bg-rose-50 text-rose-700",
  emerald: "bg-emerald-50 text-emerald-700",
  slate: "bg-slate-100 text-slate-600",
};

export const DEPARTMENT_STATUS_PILL_CLASS = {
  active: "bg-primary-light text-primary",
  inactive: "bg-slate-100 text-slate-600",
} as const;

export const MEMBER_STATUS_PILL_CLASS = {
  active: "bg-primary-light text-primary",
  invited: "bg-amber-50 text-amber-700",
  inactive: "bg-slate-100 text-slate-600",
  suspended: "bg-orange-50 text-orange-700",
  removed: "bg-red-50 text-red-600",
} as const;

export const ACCESS_LEVEL_LABELS = {
  full_access: "Full Access",
  limited: "Limited Access",
  view_only: "View Only",
  custom: "Custom Access",
} as const;

export const ACCESS_LEVEL_PILL_CLASS = {
  full_access: "bg-primary-light text-primary",
  limited: "bg-sky-50 text-sky-700",
  view_only: "bg-slate-100 text-slate-600",
  custom: "bg-violet-50 text-violet-700",
} as const;

export const ROLE_STATUS_PILL_CLASS = {
  active: "bg-primary-light text-primary",
  inactive: "bg-slate-100 text-slate-600",
  archived: "bg-amber-50 text-amber-700",
} as const;

export const ROLE_COLOR_ICON_WRAP: Record<
  import("@/types/employer-team").TeamRoleColor,
  string
> = {
  primary: "bg-primary-light text-primary",
  sky: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
  amber: "bg-amber-50 text-amber-700",
  orange: "bg-orange-50 text-orange-700",
  rose: "bg-rose-50 text-rose-700",
  emerald: "bg-emerald-50 text-emerald-700",
  slate: "bg-slate-100 text-slate-600",
};

export const ROLE_COLOR_OPTIONS: readonly {
  value: import("@/types/employer-team").TeamRoleColor;
  label: string;
  swatchClassName: string;
}[] = [
  { value: "primary", label: "Teal", swatchClassName: "bg-primary" },
  { value: "sky", label: "Sky", swatchClassName: "bg-sky-500" },
  { value: "violet", label: "Violet", swatchClassName: "bg-violet-500" },
  { value: "amber", label: "Amber", swatchClassName: "bg-amber-500" },
  { value: "orange", label: "Orange", swatchClassName: "bg-orange-500" },
  { value: "rose", label: "Rose", swatchClassName: "bg-rose-500" },
  { value: "emerald", label: "Emerald", swatchClassName: "bg-emerald-500" },
  { value: "slate", label: "Slate", swatchClassName: "bg-slate-500" },
] as const;

export const ROLE_ICON_OPTIONS: readonly {
  value: import("@/types/employer-team").TeamRoleIcon;
  label: string;
}[] = [
  { value: "shield", label: "Shield" },
  { value: "users", label: "Users" },
  { value: "briefcase", label: "Briefcase" },
  { value: "settings", label: "Settings" },
  { value: "eye", label: "Viewer" },
  { value: "star", label: "Star" },
  { value: "building", label: "Building" },
  { value: "headphones", label: "Support" },
] as const;

export const PERMISSION_MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  jobs: "Jobs",
  candidates: "Candidates",
  interviews: "Interviews",
  messages: "Messages",
  campaigns: "Campaigns",
  reports: "Reports",
  subscription: "Subscription",
  company_profile: "Company Profile",
  team_management: "Team Management",
  settings: "Settings",
};

export const PERMISSION_ACTION_LABELS: Record<string, string> = {
  fullAccess: "Full Access",
  create: "Create",
  read: "Read",
  update: "Update",
  delete: "Delete",
  export: "Export",
};

export const PERMISSION_MODULES = [
  "dashboard",
  "jobs",
  "candidates",
  "interviews",
  "messages",
  "campaigns",
  "reports",
  "subscription",
  "company_profile",
  "team_management",
  "settings",
] as const;

export const PERMISSION_ACTIONS = [
  "fullAccess",
  "create",
  "read",
  "update",
  "delete",
  "export",
] as const;

export const EMPLOYER_TEAM_SELECT_TRIGGER_CLASSNAME =
  "!h-10 w-full rounded-lg border-border-subtle bg-surface !text-sm shadow-none transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

export const EMPLOYER_TEAM_SELECT_TRIGGER_COMPACT_CLASSNAME =
  "!h-8 min-w-0 flex-1 rounded-md border-border-subtle bg-surface !text-xs shadow-none";
