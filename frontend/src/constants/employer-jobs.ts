import type { JobStatus } from "@/types/employer-jobs";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Eye,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export const EMPLOYER_JOBS_PAGE_TITLE = "Jobs";
export const EMPLOYER_JOBS_PAGE_SUBTITLE =
  "Manage your job posts, track performance and find the right candidates.";
export const EMPLOYER_JOBS_HOW_IT_WORKS_LABEL = "How it works?";

export const EMPLOYER_JOBS_SEARCH_PLACEHOLDER =
  "Search job title, role or location...";
export const EMPLOYER_JOBS_FILTERS_LABEL = "Filters";
export const EMPLOYER_JOBS_SEARCH_DEBOUNCE_MS = 300;
export const EMPLOYER_JOBS_DEFAULT_PAGE_SIZE = 10;
export const EMPLOYER_JOBS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export const EMPLOYER_JOBS_EMPTY_TITLE = "No jobs found";
export const EMPLOYER_JOBS_EMPTY_DESCRIPTION =
  "Try adjusting your filters or post a new job to get started.";
export const EMPLOYER_JOBS_LOADING_LABEL = "Loading jobs…";
export const EMPLOYER_JOBS_ERROR_TITLE = "Unable to load jobs";
export const EMPLOYER_JOBS_ERROR_DESCRIPTION =
  "Something went wrong while loading your job posts. Please try again.";
export const EMPLOYER_JOBS_RETRY_LABEL = "Try again";

export const EMPLOYER_JOBS_DELETE_CONFIRM =
  "Are you sure you want to delete this job? This action cannot be undone.";

export const EMPLOYER_JOB_TYPE_LABELS = {
  "full-time": "Full Time",
  "part-time": "Part Time",
  contract: "Contract",
} as const satisfies Record<"full-time" | "part-time" | "contract", string>;

export const EMPLOYER_JOB_STATUS_LABELS = {
  all: "All Jobs",
  active: "Active",
  paused: "Paused",
  draft: "Draft",
  closed: "Closed",
  expired: "Expired",
} as const;

export type EmployerJobsStatusTabId = keyof typeof EMPLOYER_JOB_STATUS_LABELS;

export const EMPLOYER_JOBS_STATUS_TABS: readonly EmployerJobsStatusTabId[] = [
  "all",
  "active",
  "paused",
  "draft",
  "closed",
  "expired",
] as const;

export const EMPLOYER_JOB_STATUS_PILL_CLASS: Record<JobStatus, string> = {
  active: "bg-primary-light text-primary-soft",
  paused: "bg-amber-50 text-amber-700",
  draft: "bg-slate-100 text-slate-600",
  closed: "bg-red-50 text-red-600",
  expired: "bg-slate-50 text-slate-400",
};

export type EmployerJobStatKey =
  | "activeJobs"
  | "applications"
  | "shortlisted"
  | "interviews"
  | "hired"
  | "views";

export type EmployerJobStatConfig = {
  key: EmployerJobStatKey;
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  iconWrapClassName: string;
};

export const EMPLOYER_JOB_STAT_CARDS: readonly EmployerJobStatConfig[] = [
  {
    key: "activeJobs",
    label: "Active Jobs",
    icon: Briefcase,
    iconClassName: "text-primary-soft",
    iconWrapClassName: "bg-primary-light",
  },
  {
    key: "applications",
    label: "Applications",
    icon: Users,
    iconClassName: "text-sky-600",
    iconWrapClassName: "bg-sky-50",
  },
  {
    key: "shortlisted",
    label: "Shortlisted",
    icon: UserCheck,
    iconClassName: "text-orange-500",
    iconWrapClassName: "bg-orange-50",
  },
  {
    key: "interviews",
    label: "Interviews",
    icon: CalendarDays,
    iconClassName: "text-violet-600",
    iconWrapClassName: "bg-violet-50",
  },
  {
    key: "hired",
    label: "Hired",
    icon: CheckCircle2,
    iconClassName: "text-emerald-600",
    iconWrapClassName: "bg-emerald-50",
  },
  {
    key: "views",
    label: "Total Views",
    icon: Eye,
    iconClassName: "text-amber-600",
    iconWrapClassName: "bg-amber-50",
  },
] as const;

export const EMPLOYER_JOBS_QUICK_ACTIONS_TITLE = "Quick Actions";
export const EMPLOYER_JOBS_QUICK_ACTION_POST = "Post New Job";
export const EMPLOYER_JOBS_QUICK_ACTION_IMPORT = "Import Jobs in Bulk";
export const EMPLOYER_JOBS_QUICK_ACTION_TEMPLATES = "Manage Job Templates";
export const EMPLOYER_JOBS_QUICK_ACTION_WHATSAPP = "Post from WhatsApp";

export const EMPLOYER_JOBS_BOOST_TITLE = "Job Boost";
export const EMPLOYER_JOBS_BOOST_DESCRIPTION =
  "Increase visibility of your jobs and reach more candidates faster.";
export const EMPLOYER_JOBS_BOOST_CTA = "Boost Your Job";

export const EMPLOYER_JOBS_SEARCH_CANDIDATES_TITLE = "Search Candidates";
export const EMPLOYER_JOBS_SEARCH_CANDIDATES_DESCRIPTION =
  "Looking for the right candidates? Search in our database of verified talent.";
export const EMPLOYER_JOBS_SEARCH_CANDIDATES_CTA = "Search Candidates";

export const EMPLOYER_JOBS_NEED_HELP_TITLE = "Need Help?";
export const EMPLOYER_JOBS_NEED_HELP_DESCRIPTION =
  "View help articles or contact support for assistance with your hiring.";
export const EMPLOYER_JOBS_NEED_HELP_CTA = "Visit Help Center";

export const EMPLOYER_JOBS_TABLE_COLUMNS = [
  "Job Title",
  "Job ID",
  "Location",
  "Applications",
  "Shortlisted",
  "Hired",
  "Views",
  "Status",
  "Posted On",
  "Actions",
] as const;

export const EMPLOYER_JOBS_QUERY_KEYS = {
  all: ["employer-jobs"] as const,
  lists: () => [...EMPLOYER_JOBS_QUERY_KEYS.all, "list"] as const,
  list: (params: {
    status?: JobStatus;
    search?: string;
    page: number;
    limit: number;
  }) => [...EMPLOYER_JOBS_QUERY_KEYS.lists(), params] as const,
  stats: () => [...EMPLOYER_JOBS_QUERY_KEYS.all, "stats"] as const,
};

export const EMPLOYER_DASHBOARD_HOME_TITLE = "Dashboard";
export const EMPLOYER_DASHBOARD_HOME_SUBTITLE =
  "Overview of your hiring activity and recent job posts.";
export const EMPLOYER_DASHBOARD_RECENT_JOBS_TITLE = "Recent Jobs";
export const EMPLOYER_DASHBOARD_RECENT_JOBS_EMPTY =
  "No recent jobs yet. Post your first job to get started.";
export const EMPLOYER_DASHBOARD_VIEW_ALL_JOBS = "View all jobs";
export const EMPLOYER_DASHBOARD_POST_JOB_CTA = "Post New Job";
