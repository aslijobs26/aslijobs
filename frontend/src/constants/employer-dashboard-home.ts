import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  UserCheck,
  Users,
} from "lucide-react";

export const EMPLOYER_DASHBOARD_HOME_QUERY_KEYS = {
  all: ["employer-dashboard-home"] as const,
  applicationStats: () =>
    [...EMPLOYER_DASHBOARD_HOME_QUERY_KEYS.all, "application-stats"] as const,
  recentApplications: () =>
    [...EMPLOYER_DASHBOARD_HOME_QUERY_KEYS.all, "recent-applications"] as const,
  growth: () =>
    [...EMPLOYER_DASHBOARD_HOME_QUERY_KEYS.all, "growth"] as const,
  funnel: (period: string) =>
    [...EMPLOYER_DASHBOARD_HOME_QUERY_KEYS.all, "funnel", period] as const,
  notifications: () =>
    [...EMPLOYER_DASHBOARD_HOME_QUERY_KEYS.all, "notifications"] as const,
} as const;

export const EMPLOYER_DASHBOARD_WELCOME_TAGLINE =
  "Let's hire the best talent today.";
export const EMPLOYER_DASHBOARD_WELCOME_BADGE = "Glad to see you again!";
export const EMPLOYER_DASHBOARD_WELCOME_TIP =
  "Find, connect and hire top talent faster.";

export const EMPLOYER_DASHBOARD_POST_JOB_LABEL = "Post New Job";
export const EMPLOYER_DASHBOARD_SEARCH_CANDIDATES_LABEL = "Search Candidates";

/** Shared height for the welcome banner hero row. */
export const EMPLOYER_DASHBOARD_HERO_ROW_HEIGHT_CLASS = "sm:min-h-[15.5rem]";

export const EMPLOYER_DASHBOARD_AI_TITLE = "AI Hiring Assistant";
export const EMPLOYER_DASHBOARD_AI_EMPTY =
  "Post a job or review candidates to unlock personalized hiring insights.";

export type EmployerDashboardFunnelPeriod =
  | "this_month"
  | "last_month"
  | "all";

export const EMPLOYER_DASHBOARD_FUNNEL_PERIOD_OPTIONS: {
  value: EmployerDashboardFunnelPeriod;
  label: string;
}[] = [
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "all", label: "All Time" },
];

/**
 * Each stage renders a light track with a proportional darker fill.
 * `fillTextClassName` keeps the label readable over the fill: light text on
 * dark fills, dark text on light (amber/orange) fills.
 */
export const EMPLOYER_DASHBOARD_FUNNEL_STAGES = [
  {
    id: "applications",
    label: "Applications",
    trackClassName: "bg-primary-light text-primary",
    fillClassName: "bg-primary/65",
    fillTextClassName: "text-surface",
    widthPercent: 100,
  },
  {
    id: "screening",
    label: "Screening",
    trackClassName: "bg-employer-cta text-employer-button",
    fillClassName: "bg-employer-button/60",
    fillTextClassName: "text-surface",
    widthPercent: 88,
  },
  {
    id: "shortlisted",
    label: "Shortlisted",
    trackClassName: "bg-benefit-free-surface text-benefit-free-icon",
    fillClassName: "bg-benefit-free-icon/60",
    fillTextClassName: "text-foreground",
    widthPercent: 76,
  },
  {
    id: "interview",
    label: "Interviews",
    trackClassName: "bg-resource-resume-surface text-resource-resume-icon",
    fillClassName: "bg-resource-resume-icon/60",
    fillTextClassName: "text-surface",
    widthPercent: 64,
  },
  {
    id: "offer",
    label: "Offer Sent",
    trackClassName: "bg-resource-interview-surface text-resource-interview-icon",
    fillClassName: "bg-resource-interview-icon/60",
    fillTextClassName: "text-foreground",
    widthPercent: 52,
  },
  {
    id: "hired",
    label: "Hired",
    trackClassName: "bg-primary-light text-primary",
    fillClassName: "bg-primary/65",
    fillTextClassName: "text-surface",
    widthPercent: 40,
  },
] as const;

export type EmployerDashboardFunnelStageId =
  (typeof EMPLOYER_DASHBOARD_FUNNEL_STAGES)[number]["id"];

export type EmployerDashboardStatKey =
  | "activeJobs"
  | "applications"
  | "shortlisted"
  | "interviews"
  | "hired";

export type EmployerDashboardStatCardConfig = {
  key: EmployerDashboardStatKey;
  label: string;
  icon: LucideIcon;
  iconWrapClassName: string;
  iconClassName: string;
};

export const EMPLOYER_DASHBOARD_STAT_CARDS: EmployerDashboardStatCardConfig[] = [
  {
    key: "activeJobs",
    label: "Active Jobs",
    icon: Briefcase,
    iconWrapClassName: "bg-primary-light text-primary",
    iconClassName: "text-primary",
  },
  {
    key: "applications",
    label: "Applications",
    icon: Users,
    iconWrapClassName: "bg-sky-50 text-sky-600",
    iconClassName: "text-sky-600",
  },
  {
    key: "shortlisted",
    label: "Shortlisted",
    icon: UserCheck,
    iconWrapClassName: "bg-amber-50 text-amber-600",
    iconClassName: "text-amber-600",
  },
  {
    key: "interviews",
    label: "Interviews",
    icon: CalendarDays,
    iconWrapClassName: "bg-violet-50 text-violet-600",
    iconClassName: "text-violet-600",
  },
  {
    key: "hired",
    label: "Hired",
    icon: CheckCircle2,
    iconWrapClassName: "bg-emerald-50 text-emerald-600",
    iconClassName: "text-emerald-600",
  },
];

export const EMPLOYER_DASHBOARD_SUPPORT_PHONE =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || "";

export const EMPLOYER_DASHBOARD_ACADEMY_TITLE = "asliJobs Academy";
export const EMPLOYER_DASHBOARD_ACADEMY_DESCRIPTION =
  "Learn best hiring practices";
export const EMPLOYER_DASHBOARD_ACADEMY_CTA = "Coming soon";
