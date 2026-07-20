import type { EmployerDashboardNavItem } from "@/types/employer-dashboard";
import { ROUTES } from "@/constants/routes";
import {
  Briefcase,
  Building2,
  CalendarDays,
  CreditCard,
  FileBarChart,
  Headphones,
  Home,
  LineChart,
  Megaphone,
  MessageSquare,
  Settings,
  Star,
  Users,
  UsersRound,
} from "lucide-react";

export const EMPLOYER_DASHBOARD_SIDEBAR_WIDTH = "16.5rem";
export const EMPLOYER_DASHBOARD_SIDEBAR_COLLAPSED_WIDTH = "4.5rem";

export const EMPLOYER_DASHBOARD_LOGO_TAGLINE = "Asli Jobs. Asli People.";

export const EMPLOYER_DASHBOARD_NAV_ITEMS: EmployerDashboardNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: ROUTES.EMPLOYER_DASHBOARD,
    icon: Home,
  },
  {
    id: "jobs",
    label: "Jobs",
    href: "#",
    icon: Briefcase,
  },
  {
    id: "candidates",
    label: "Candidates",
    href: "#",
    icon: Users,
  },
  {
    id: "interviews",
    label: "Interviews",
    href: "#",
    icon: CalendarDays,
  },
  {
    id: "messages",
    label: "Messages",
    href: "#",
    icon: MessageSquare,
    badge: 24,
  },
  {
    id: "saved-candidates",
    label: "Saved Candidates",
    href: "#",
    icon: Star,
  },
  {
    id: "campaigns",
    label: "Campaigns",
    href: "#",
    icon: Megaphone,
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "#",
    icon: LineChart,
  },
  {
    id: "reports",
    label: "Reports",
    href: "#",
    icon: FileBarChart,
  },
  {
    id: "subscription",
    label: "Subscription",
    href: "#",
    icon: CreditCard,
  },
  {
    id: "company-profile",
    label: "Company Profile",
    href: "#",
    icon: Building2,
  },
  {
    id: "team-management",
    label: "Team Management",
    href: "#",
    icon: UsersRound,
  },
  {
    id: "settings",
    label: "Settings",
    href: "#",
    icon: Settings,
  },
];

export const EMPLOYER_DASHBOARD_HELP_TITLE = "Need Help?";
export const EMPLOYER_DASHBOARD_HELP_SUBTITLE = "We are here to help you";
export const EMPLOYER_DASHBOARD_HELP_CTA = "Contact Support";
export const EMPLOYER_DASHBOARD_HELP_ICON = Headphones;

export const EMPLOYER_DASHBOARD_SEARCH_PLACEHOLDER =
  "Search candidates, jobs, applications...";

export const EMPLOYER_DASHBOARD_POST_JOB_LABEL = "Post New Job";

export const EMPLOYER_DASHBOARD_NOTIFICATION_COUNT = 12;

export const EMPLOYER_DASHBOARD_LANGUAGE_LABEL = "English";

export const EMPLOYER_DASHBOARD_COMPANY_NAME = "ABC Industries";
export const EMPLOYER_DASHBOARD_ROLE_LABEL = "Employer";
export const EMPLOYER_DASHBOARD_AVATAR_INITIALS = "AI";

export const EMPLOYER_DASHBOARD_PROFILE_MENU_MY_PROFILE = "My Profile";
export const EMPLOYER_DASHBOARD_PROFILE_MENU_SETTINGS = "Settings";
export const EMPLOYER_DASHBOARD_PROFILE_MENU_LOGOUT = "Logout";

export const EMPLOYER_DASHBOARD_PLACEHOLDER_TITLE = "Employer Dashboard";
export const EMPLOYER_DASHBOARD_PLACEHOLDER_HEADING = "Coming Soon...";
export const EMPLOYER_DASHBOARD_PLACEHOLDER_DESCRIPTION =
  "This section is under development.";
