import { ROUTES } from "@/constants/routes";
import type { TeamPermissionModule } from "@/types/employer-team";
import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  Briefcase,
  CalendarDays,
  FileText,
  Home,
  PlusCircle,
  UserRound,
  Users,
} from "lucide-react";

export type FloatingBottomNavAudience =
  | "public"
  | "job-seeker"
  | "employer";

export type FloatingBottomNavItemId =
  | "home"
  | "jobs"
  | "post"
  | "saved"
  | "profile"
  | "dashboard"
  | "candidates"
  | "messages"
  | "interviews"
  | "applications";

export type FloatingBottomNavItem = {
  id: FloatingBottomNavItemId;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Filled Bootstrap icon class used when the tab is active. */
  activeIconClass: string;
  /** Employer RBAC module; omitted items are always shown. */
  permissionModule?: TeamPermissionModule;
  /** Badge source wired in the nav component. */
  badgeKey?: "messagesUnread" | "savedJobs" | "notificationsUnread";
  exact?: boolean;
  matchPrefixes?: string[];
};

/**
 * Guest / public website — discovery + conversion.
 * Sourced from public routes used by Navbar CTAs.
 */
export const FLOATING_BOTTOM_NAV_PUBLIC: FloatingBottomNavItem[] = [
  {
    id: "home",
    label: "Home",
    href: ROUTES.HOME,
    icon: Home,
    activeIconClass: "bi bi-house-door-fill",
    exact: true,
  },
  {
    id: "jobs",
    label: "Jobs",
    href: ROUTES.FIND_JOBS,
    icon: Briefcase,
    activeIconClass: "bi bi-briefcase-fill",
    matchPrefixes: [ROUTES.FIND_JOBS],
  },
  {
    id: "post",
    label: "Post",
    href: ROUTES.POST_JOB,
    icon: PlusCircle,
    activeIconClass: "bi bi-plus-circle-fill",
    matchPrefixes: [ROUTES.POST_JOB],
  },
  {
    id: "saved",
    label: "Saved",
    href: ROUTES.JOB_SEEKER_SAVED_JOBS,
    icon: Bookmark,
    activeIconClass: "bi bi-bookmark-fill",
    badgeKey: "savedJobs",
    matchPrefixes: [ROUTES.JOB_SEEKER_SAVED_JOBS],
  },
  {
    id: "profile",
    label: "Profile",
    href: ROUTES.JOB_SEEKER_LOGIN,
    icon: UserRound,
    activeIconClass: "bi bi-person-fill",
    matchPrefixes: [
      ROUTES.JOB_SEEKER_PROFILE,
      ROUTES.JOB_SEEKER_LOGIN,
      ROUTES.JOB_SEEKER_REGISTER,
      ROUTES.EMPLOYER_LOGIN,
      ROUTES.EMPLOYER_REGISTER,
    ],
  },
];

/**
 * Job seeker — primary journey from sidebar + public job search:
 * Home → Find Jobs → Saved → Applications → Profile.
 */
export const FLOATING_BOTTOM_NAV_JOB_SEEKER: FloatingBottomNavItem[] = [
  {
    id: "home",
    label: "Home",
    href: ROUTES.HOME,
    icon: Home,
    activeIconClass: "bi bi-house-door-fill",
    exact: true,
  },
  {
    id: "jobs",
    label: "Jobs",
    href: ROUTES.FIND_JOBS,
    icon: Briefcase,
    activeIconClass: "bi bi-briefcase-fill",
    matchPrefixes: [ROUTES.FIND_JOBS],
  },
  {
    id: "saved",
    label: "Saved",
    href: ROUTES.JOB_SEEKER_SAVED_JOBS,
    icon: Bookmark,
    activeIconClass: "bi bi-bookmark-fill",
    badgeKey: "savedJobs",
    matchPrefixes: [ROUTES.JOB_SEEKER_SAVED_JOBS],
  },
  {
    id: "applications",
    label: "Apps",
    href: ROUTES.JOB_SEEKER_APPLIED_JOBS,
    icon: FileText,
    activeIconClass: "bi bi-file-earmark-text-fill",
    matchPrefixes: [ROUTES.JOB_SEEKER_APPLIED_JOBS],
  },
  {
    id: "profile",
    label: "Profile",
    href: ROUTES.JOB_SEEKER_PROFILE,
    icon: UserRound,
    activeIconClass: "bi bi-person-fill",
    badgeKey: "notificationsUnread",
    matchPrefixes: [
      ROUTES.JOB_SEEKER_PROFILE,
      ROUTES.JOB_SEEKER_NOTIFICATIONS,
      ROUTES.JOB_SEEKER_SETTINGS,
      ROUTES.JOB_SEEKER_MY_RESUME,
    ],
  },
];

/**
 * Employer — primary mobile actions:
 * Dashboard → Jobs → Post Job → Candidates → Interviews.
 * Remaining modules (including Messages) stay in the sidebar.
 */
export const FLOATING_BOTTOM_NAV_EMPLOYER: FloatingBottomNavItem[] = [
  {
    id: "dashboard",
    label: "Home",
    href: ROUTES.EMPLOYER_DASHBOARD,
    icon: Home,
    activeIconClass: "bi bi-house-door-fill",
    permissionModule: "dashboard",
    matchPrefixes: [ROUTES.EMPLOYER_DASHBOARD],
  },
  {
    id: "jobs",
    label: "Jobs",
    href: ROUTES.EMPLOYER_JOBS,
    icon: Briefcase,
    activeIconClass: "bi bi-briefcase-fill",
    permissionModule: "jobs",
    matchPrefixes: [ROUTES.EMPLOYER_JOBS],
  },
  {
    id: "post",
    label: "Post",
    href: ROUTES.POST_JOB,
    icon: PlusCircle,
    activeIconClass: "bi bi-plus-circle-fill",
    permissionModule: "jobs",
    matchPrefixes: [ROUTES.POST_JOB],
  },
  {
    id: "candidates",
    label: "Candidates",
    href: ROUTES.EMPLOYER_CANDIDATES,
    icon: Users,
    activeIconClass: "bi bi-people-fill",
    permissionModule: "candidates",
    matchPrefixes: [ROUTES.EMPLOYER_CANDIDATES],
  },
  {
    id: "interviews",
    label: "Interviews",
    href: ROUTES.EMPLOYER_INTERVIEWS,
    icon: CalendarDays,
    activeIconClass: "bi bi-calendar-check-fill",
    permissionModule: "interviews",
    matchPrefixes: [ROUTES.EMPLOYER_INTERVIEWS],
  },
];

export function getFloatingBottomNavItems(
  audience: FloatingBottomNavAudience,
): FloatingBottomNavItem[] {
  switch (audience) {
    case "employer":
      return FLOATING_BOTTOM_NAV_EMPLOYER;
    case "job-seeker":
      return FLOATING_BOTTOM_NAV_JOB_SEEKER;
    default:
      return FLOATING_BOTTOM_NAV_PUBLIC;
  }
}

export function isFloatingBottomNavItemActive(
  item: FloatingBottomNavItem,
  pathname: string,
): boolean {
  if (item.exact) {
    if (pathname === item.href) {
      return true;
    }
    // Allow secondary exact-adjacent prefixes (e.g. seeker dashboard as Home).
    return (item.matchPrefixes ?? []).some((prefix) => pathname === prefix);
  }
  const prefixes = item.matchPrefixes ?? [item.href];
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
