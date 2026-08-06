import type { JobSeekerDashboardNavItem } from "@/types/job-seeker-dashboard";
import { ROUTES } from "@/constants/routes";
import {
  Bell,
  Bookmark,
  Briefcase,
  FileText,
  Home,
  Settings,
  UserRound,
} from "lucide-react";

export const JOB_SEEKER_DASHBOARD_SIDEBAR_WIDTH = "16.5rem";
export const JOB_SEEKER_DASHBOARD_SIDEBAR_COLLAPSED_WIDTH = "4.5rem";

export const JOB_SEEKER_DASHBOARD_LOGO_TAGLINE = "Asli Jobs. Asli People.";

export const JOB_SEEKER_DASHBOARD_NAV_ITEMS: JobSeekerDashboardNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: ROUTES.JOB_SEEKER_DASHBOARD,
    icon: Home,
  },
  {
    id: "profile",
    label: "Profile",
    href: ROUTES.JOB_SEEKER_PROFILE,
    icon: UserRound,
  },
  {
    id: "applied-jobs",
    label: "My Applications",
    href: ROUTES.JOB_SEEKER_APPLIED_JOBS,
    icon: Briefcase,
  },
  {
    id: "my-resume",
    label: "My Resume",
    href: ROUTES.JOB_SEEKER_MY_RESUME,
    icon: FileText,
  },
  {
    id: "notifications",
    label: "Notifications",
    href: ROUTES.JOB_SEEKER_NOTIFICATIONS,
    icon: Bell,
  },
  {
    id: "saved-jobs",
    label: "Saved Jobs",
    href: ROUTES.JOB_SEEKER_SAVED_JOBS,
    icon: Bookmark,
  },
  {
    id: "settings",
    label: "Account Settings",
    href: ROUTES.JOB_SEEKER_SETTINGS,
    icon: Settings,
  },
];
