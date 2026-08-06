import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
  type SeekerApplicationListItem,
  type SeekerApplicationStats,
} from "@/types/job-seeker-applications";
import { cn } from "@/utils/cn";
import {
  Ban,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gift,
  Send,
  Star,
  type LucideIcon,
  XCircle,
} from "lucide-react";

export type AppliedJobsStatsFilter =
  | "all"
  | "applied"
  | "underReview"
  | "shortlisted"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export type AppliedJobsSort =
  | "newest"
  | "oldest"
  | "updated"
  | "salary_high"
  | "salary_low"
  | "company";

export type AppliedJobsAdvancedFilters = {
  location: string;
  jobType: string;
  workMode: string;
  company: string;
  shift: string;
  appliedFrom: string;
  appliedTo: string;
  minSalary: string;
};

export const EMPTY_APPLIED_JOBS_FILTERS: AppliedJobsAdvancedFilters = {
  location: "",
  jobType: "",
  workMode: "",
  company: "",
  shift: "",
  appliedFrom: "",
  appliedTo: "",
  minSalary: "",
};

export const APPLIED_JOBS_PAGE_SIZE = 12;
/** Max page size allowed by GET /applications/me (backend validation). */
export const APPLIED_JOBS_FILTER_WINDOW_SIZE = 100;

export const APPLIED_JOBS_SORT_OPTIONS: {
  value: AppliedJobsSort;
  label: string;
}[] = [
  { value: "newest", label: "Newest Applied" },
  { value: "oldest", label: "Oldest Applied" },
  { value: "updated", label: "Recently Updated" },
  { value: "salary_high", label: "Salary High" },
  { value: "salary_low", label: "Salary Low" },
  { value: "company", label: "Company A-Z" },
];

export type AppliedJobsStatsChipTone =
  | "primary"
  | "blue"
  | "orange"
  | "purple"
  | "teal"
  | "green"
  | "red"
  | "muted";

export const APPLIED_JOBS_STATS_FILTERS: {
  key: AppliedJobsStatsFilter;
  label: string;
  statuses?: ApplicationStatus[];
  backendStatus?: ApplicationStatus;
  statsKey?: keyof SeekerApplicationStats;
  tone: AppliedJobsStatsChipTone;
}[] = [
  { key: "all", label: "All", tone: "primary" },
  {
    key: "applied",
    label: "Applied",
    statuses: ["submitted", "viewed"],
    statsKey: "applied",
    tone: "blue",
  },
  {
    key: "underReview",
    label: "Under Review",
    statuses: ["under_review"],
    backendStatus: "under_review",
    statsKey: "underReview",
    tone: "orange",
  },
  {
    key: "shortlisted",
    label: "Shortlisted",
    statuses: ["shortlisted"],
    backendStatus: "shortlisted",
    statsKey: "shortlisted",
    tone: "purple",
  },
  {
    key: "interview",
    label: "Interview",
    statuses: ["interview_scheduled", "interview_completed"],
    statsKey: "interview",
    tone: "teal",
  },
  {
    key: "offer",
    label: "Offer",
    statuses: ["offer_sent"],
    backendStatus: "offer_sent",
    statsKey: "offer",
    tone: "green",
  },
  {
    key: "rejected",
    label: "Rejected",
    statuses: ["rejected"],
    backendStatus: "rejected",
    statsKey: "rejected",
    tone: "red",
  },
  {
    key: "withdrawn",
    label: "Withdrawn",
    statuses: ["withdrawn"],
    backendStatus: "withdrawn",
    statsKey: "withdrawn",
    tone: "muted",
  },
];

const STATS_CHIP_TONE_CLASSES: Record<
  AppliedJobsStatsChipTone,
  { idle: string; active: string }
> = {
  primary: {
    idle: "bg-surface text-primary ring-primary/35 hover:bg-primary-light/60",
    active: "bg-primary-light text-primary ring-primary",
  },
  blue: {
    idle: "bg-surface text-resource-salary-icon ring-resource-salary-icon/35 hover:bg-resource-salary-surface",
    active:
      "bg-resource-salary-surface text-resource-salary-icon ring-resource-salary-icon",
  },
  orange: {
    idle: "bg-surface text-resource-interview-icon ring-resource-interview-icon/35 hover:bg-resource-interview-surface",
    active:
      "bg-resource-interview-surface text-resource-interview-icon ring-resource-interview-icon",
  },
  purple: {
    idle: "bg-surface text-resource-resume-icon ring-resource-resume-icon/35 hover:bg-resource-resume-surface",
    active:
      "bg-resource-resume-surface text-resource-resume-icon ring-resource-resume-icon",
  },
  teal: {
    idle: "bg-surface text-primary-soft ring-primary-soft/40 hover:bg-primary-light/50",
    active: "bg-primary-light text-primary ring-primary-soft",
  },
  green: {
    idle: "bg-surface text-resource-guide-icon ring-resource-guide-icon/35 hover:bg-resource-guide-surface",
    active:
      "bg-resource-guide-surface text-resource-guide-icon ring-resource-guide-icon",
  },
  red: {
    idle: "bg-surface text-pin-state ring-pin-state/35 hover:bg-primary-light/40",
    active: "bg-primary-light text-pin-state ring-pin-state",
  },
  muted: {
    idle: "bg-surface text-muted ring-border-subtle hover:bg-workflow-neutral-surface",
    active: "bg-workflow-neutral-surface text-foreground ring-muted",
  },
};

export function statsChipToneClasses(
  tone: AppliedJobsStatsChipTone,
  isActive: boolean,
): string {
  const classes = STATS_CHIP_TONE_CLASSES[tone];
  return isActive ? classes.active : classes.idle;
}

export function formatAppliedDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }
  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }
  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return formatAppliedDate(value);
}

export function applicationStatusBadgeClass(status: ApplicationStatus): string {
  switch (status) {
    case "shortlisted":
    case "selected":
      return "bg-resource-resume-surface text-resource-resume-icon ring-resource-resume-icon/25";
    case "offer_sent":
    case "joined":
      return "bg-resource-guide-surface text-resource-guide-icon ring-resource-guide-icon/25";
    case "interview_scheduled":
    case "interview_completed":
      return "bg-primary-light text-primary ring-primary/25";
    case "under_review":
      return "bg-resource-interview-surface text-resource-interview-icon ring-resource-interview-icon/25";
    case "viewed":
    case "submitted":
      return "bg-resource-salary-surface text-resource-salary-icon ring-resource-salary-icon/25";
    case "rejected":
      return "bg-primary-light text-pin-state ring-pin-state/25";
    case "withdrawn":
      return "bg-workflow-neutral-surface text-muted ring-border-subtle";
    default:
      return "bg-workflow-neutral-surface text-muted ring-border-subtle";
  }
}

export function applicationStatusIcon(
  status: ApplicationStatus,
): LucideIcon {
  switch (status) {
    case "submitted":
    case "viewed":
      return Send;
    case "under_review":
      return Clock3;
    case "shortlisted":
    case "selected":
      return Star;
    case "interview_scheduled":
    case "interview_completed":
      return CalendarDays;
    case "offer_sent":
    case "joined":
      return Gift;
    case "rejected":
      return XCircle;
    case "withdrawn":
      return Ban;
    default:
      return Briefcase;
  }
}

export function buildStatusContext(
  application: SeekerApplicationListItem,
): { label: string; date: string } {
  const status = application.status;
  const statusDate = formatAppliedDate(
    application.lastStatusUpdatedAt ?? application.appliedAt,
  );
  const appliedDate = formatAppliedDate(application.appliedAt);

  if (
    (status === "interview_scheduled" || status === "interview_completed") &&
    application.interviewDate
  ) {
    const dateLabel = formatAppliedDate(application.interviewDate);
    const time = application.interviewTime?.trim();
    return {
      label: "Interview on",
      date: time ? `${dateLabel}, ${time}` : dateLabel,
    };
  }

  if (status === "offer_sent") {
    return { label: "Offer received", date: statusDate };
  }

  if (status === "under_review" || status === "viewed") {
    return { label: "Application seen", date: statusDate };
  }

  if (status === "shortlisted") {
    return { label: "Shortlisted", date: statusDate };
  }

  if (status === "rejected") {
    return { label: "Rejected", date: statusDate };
  }

  if (status === "withdrawn") {
    return { label: "Withdrawn", date: statusDate };
  }

  if (status === "selected" || status === "joined") {
    return {
      label: APPLICATION_STATUS_LABELS[status],
      date: statusDate,
    };
  }

  return { label: "Applied on", date: appliedDate };
}

export function buildStatusContextLine(
  application: SeekerApplicationListItem,
): string {
  const context = buildStatusContext(application);
  return `${context.label} ${context.date}`.trim();
}

export function buildQuickSummary(
  application: SeekerApplicationListItem,
): { headline: string; timeLabel: string } {
  const headline = APPLICATION_STATUS_LABELS[application.status];
  const timeSource =
    application.lastStatusUpdatedAt ?? application.appliedAt;
  return {
    headline,
    timeLabel: formatRelativeTime(timeSource),
  };
}

export function matchesAppliedJobsSearch(
  application: SeekerApplicationListItem,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return (
    application.companyName.toLowerCase().includes(normalized) ||
    application.jobTitle.toLowerCase().includes(normalized) ||
    application.location.toLowerCase().includes(normalized) ||
    application.publicJobId.toLowerCase().includes(normalized)
  );
}

export function sortAppliedJobs(
  applications: SeekerApplicationListItem[],
  sort: AppliedJobsSort,
): SeekerApplicationListItem[] {
  const next = [...applications];

  switch (sort) {
    case "oldest":
      return next.sort(
        (a, b) =>
          new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime(),
      );
    case "updated":
      return next.sort((a, b) => {
        const aTime = new Date(
          a.lastStatusUpdatedAt ?? a.appliedAt,
        ).getTime();
        const bTime = new Date(
          b.lastStatusUpdatedAt ?? b.appliedAt,
        ).getTime();
        return bTime - aTime;
      });
    case "salary_high":
      return next.sort(
        (a, b) => (b.salarySortValue ?? -1) - (a.salarySortValue ?? -1),
      );
    case "salary_low":
      return next.sort(
        (a, b) => (a.salarySortValue ?? Number.MAX_SAFE_INTEGER) -
          (b.salarySortValue ?? Number.MAX_SAFE_INTEGER),
      );
    case "company":
      return next.sort((a, b) =>
        a.companyName.localeCompare(b.companyName, "en", {
          sensitivity: "base",
        }),
      );
    case "newest":
    default:
      return next.sort(
        (a, b) =>
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
      );
  }
}

export function resolveBackendStatus(
  filter: AppliedJobsStatsFilter,
): ApplicationStatus | undefined {
  const config = APPLIED_JOBS_STATS_FILTERS.find((item) => item.key === filter);
  return config?.backendStatus;
}

/** Statuses for backend `$in` when a stats chip maps to multiple statuses. */
export function resolveBackendStatuses(
  filter: AppliedJobsStatsFilter,
): ApplicationStatus[] | undefined {
  const config = APPLIED_JOBS_STATS_FILTERS.find((item) => item.key === filter);
  if (!config?.statuses?.length) {
    return undefined;
  }
  if (config.backendStatus && config.statuses.length === 1) {
    return undefined;
  }
  return config.statuses;
}

export function resolveBackendSort(sort: AppliedJobsSort): AppliedJobsSort {
  return sort;
}

/** @deprecated List pagination is fully backend-driven. */
export function needsClientListWindow(
  _filter: AppliedJobsStatsFilter,
  _sort: AppliedJobsSort,
  _advanced: AppliedJobsAdvancedFilters,
): boolean {
  return false;
}

export function hasAdvancedFilters(
  filters: AppliedJobsAdvancedFilters,
): boolean {
  return Object.values(filters).some((value) => value.trim().length > 0);
}

export function countAdvancedFilters(
  filters: AppliedJobsAdvancedFilters,
): number {
  return Object.values(filters).filter((value) => value.trim().length > 0)
    .length;
}

export function getStatsChipCount(
  filter: AppliedJobsStatsFilter,
  stats: SeekerApplicationStats | undefined,
): number | null {
  if (!stats) {
    return null;
  }

  if (filter === "all") {
    return (
      stats.applied +
      stats.underReview +
      stats.shortlisted +
      stats.interview +
      stats.offer +
      stats.selected +
      stats.rejected +
      stats.joined +
      (stats.withdrawn ?? 0)
    );
  }

  const config = APPLIED_JOBS_STATS_FILTERS.find((item) => item.key === filter);
  if (!config?.statsKey) {
    return null;
  }

  return stats[config.statsKey] ?? 0;
}

export function getTotalAppliedCount(
  stats: SeekerApplicationStats | undefined,
): number {
  if (!stats) {
    return 0;
  }
  return getStatsChipCount("all", stats) ?? 0;
}

export function getSuccessRatePercent(
  stats: SeekerApplicationStats | undefined,
): number {
  const total = getTotalAppliedCount(stats);
  if (!stats || total <= 0) {
    return 0;
  }
  const successes = stats.selected + stats.joined + stats.offer;
  return Math.round((successes / total) * 100);
}

export function filterByStatsGroup(
  applications: SeekerApplicationListItem[],
  filter: AppliedJobsStatsFilter,
): SeekerApplicationListItem[] {
  const config = APPLIED_JOBS_STATS_FILTERS.find((item) => item.key === filter);
  if (!config?.statuses?.length) {
    return applications;
  }
  if (config.backendStatus && config.statuses.length === 1) {
    return applications;
  }
  return applications.filter((item) => config.statuses!.includes(item.status));
}

export function filterByAdvancedFilters(
  applications: SeekerApplicationListItem[],
  filters: AppliedJobsAdvancedFilters,
): SeekerApplicationListItem[] {
  if (!hasAdvancedFilters(filters)) {
    return applications;
  }

  const locationQuery = filters.location.trim().toLowerCase();
  const companyQuery = filters.company.trim().toLowerCase();
  const jobTypeQuery = filters.jobType.trim().toLowerCase();
  const workModeQuery = filters.workMode.trim().toLowerCase();
  const shiftQuery = filters.shift.trim().toLowerCase();
  const minSalary = filters.minSalary.trim()
    ? Number(filters.minSalary)
    : null;

  return applications.filter((item) => {
    if (
      locationQuery &&
      !item.location.toLowerCase().includes(locationQuery)
    ) {
      return false;
    }

    if (
      companyQuery &&
      !item.companyName.toLowerCase().includes(companyQuery)
    ) {
      return false;
    }

    if (jobTypeQuery && item.jobType.trim().toLowerCase() !== jobTypeQuery) {
      return false;
    }

    if (
      workModeQuery &&
      item.workMode.trim().toLowerCase() !== workModeQuery
    ) {
      return false;
    }

    if (shiftQuery && item.shiftLabel.trim().toLowerCase() !== shiftQuery) {
      return false;
    }

    if (filters.appliedFrom.trim()) {
      const from = new Date(`${filters.appliedFrom.trim()}T00:00:00`);
      const applied = new Date(item.appliedAt);
      if (
        !Number.isNaN(from.getTime()) &&
        !Number.isNaN(applied.getTime()) &&
        applied.getTime() < from.getTime()
      ) {
        return false;
      }
    }

    if (filters.appliedTo.trim()) {
      const to = new Date(`${filters.appliedTo.trim()}T23:59:59.999`);
      const applied = new Date(item.appliedAt);
      if (
        !Number.isNaN(to.getTime()) &&
        !Number.isNaN(applied.getTime()) &&
        applied.getTime() > to.getTime()
      ) {
        return false;
      }
    }

    if (minSalary != null && Number.isFinite(minSalary) && minSalary > 0) {
      if (item.salarySortValue == null || item.salarySortValue < minSalary) {
        return false;
      }
    }

    return true;
  });
}

export function buildApplicationFilterFacets(
  applications: SeekerApplicationListItem[],
): {
  locations: string[];
  companies: string[];
  jobTypes: string[];
  workModes: string[];
  shifts: string[];
} {
  const uniqueSorted = (values: string[]) =>
    [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b, "en", { sensitivity: "base" }),
    );

  return {
    locations: uniqueSorted(applications.map((item) => item.location)),
    companies: uniqueSorted(applications.map((item) => item.companyName)),
    jobTypes: uniqueSorted(applications.map((item) => item.jobType)),
    workModes: uniqueSorted(applications.map((item) => item.workMode)),
    shifts: uniqueSorted(applications.map((item) => item.shiftLabel)),
  };
}

export function statusBadgeClasses(
  status: ApplicationStatus,
  className?: string,
): string {
  return cn(
    "inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
    applicationStatusBadgeClass(status),
    className,
  );
}

/** Compact labels for list cards so badges stay single-line across devices. */
export function cardStatusLabel(status: ApplicationStatus): string {
  switch (status) {
    case "interview_scheduled":
    case "interview_completed":
      return "Interview";
    case "offer_sent":
      return "Offer";
    case "under_review":
      return "Under Review";
    default:
      return APPLICATION_STATUS_LABELS[status];
  }
}

export function parseStatsFilterParam(
  value: string | null,
): AppliedJobsStatsFilter {
  const match = APPLIED_JOBS_STATS_FILTERS.find((item) => item.key === value);
  return match?.key ?? "all";
}

export function parseSortParam(value: string | null): AppliedJobsSort {
  const match = APPLIED_JOBS_SORT_OPTIONS.find((item) => item.value === value);
  return match?.value ?? "newest";
}

export { CheckCircle2 };
