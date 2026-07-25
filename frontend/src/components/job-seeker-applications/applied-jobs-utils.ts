import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
  type SeekerApplicationListItem,
  type SeekerApplicationStats,
} from "@/types/job-seeker-applications";
import { cn } from "@/utils/cn";

export type AppliedJobsStatsFilter =
  | "all"
  | "applied"
  | "viewed"
  | "underReview"
  | "shortlisted"
  | "interview"
  | "offer"
  | "selected"
  | "rejected"
  | "joined"
  | "withdrawn";

export type AppliedJobsSort =
  | "newest"
  | "oldest"
  | "updated"
  | "company";

export const APPLIED_JOBS_PAGE_SIZE = 12;

export const APPLIED_JOBS_STATS_FILTERS: {
  key: AppliedJobsStatsFilter;
  label: string;
  statuses?: ApplicationStatus[];
  backendStatus?: ApplicationStatus;
  statsKey?: keyof SeekerApplicationStats;
}[] = [
  { key: "all", label: "All" },
  {
    key: "applied",
    label: "Applied",
    statuses: ["submitted"],
    backendStatus: "submitted",
  },
  {
    key: "viewed",
    label: "Viewed",
    statuses: ["viewed"],
    backendStatus: "viewed",
  },
  {
    key: "underReview",
    label: "Under Review",
    statuses: ["under_review"],
    backendStatus: "under_review",
    statsKey: "underReview",
  },
  {
    key: "shortlisted",
    label: "Shortlisted",
    statuses: ["shortlisted"],
    backendStatus: "shortlisted",
    statsKey: "shortlisted",
  },
  {
    key: "interview",
    label: "Interview",
    statuses: ["interview_scheduled", "interview_completed"],
    statsKey: "interview",
  },
  {
    key: "offer",
    label: "Offer",
    statuses: ["offer_sent"],
    backendStatus: "offer_sent",
    statsKey: "offer",
  },
  {
    key: "selected",
    label: "Selected",
    statuses: ["selected"],
    backendStatus: "selected",
    statsKey: "selected",
  },
  {
    key: "rejected",
    label: "Rejected",
    statuses: ["rejected"],
    backendStatus: "rejected",
    statsKey: "rejected",
  },
  {
    key: "joined",
    label: "Joined",
    statuses: ["joined"],
    backendStatus: "joined",
    statsKey: "joined",
  },
  {
    key: "withdrawn",
    label: "Withdrawn",
    statuses: ["withdrawn"],
    backendStatus: "withdrawn",
  },
];

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
    case "offer_sent":
    case "joined":
      return "bg-primary-light text-primary ring-primary/20";
    case "interview_scheduled":
    case "interview_completed":
      return "bg-resource-interview-surface text-resource-interview-icon ring-resource-interview-icon/20";
    case "under_review":
    case "viewed":
      return "bg-resource-salary-surface text-resource-salary-icon ring-resource-salary-icon/20";
    case "rejected":
    case "withdrawn":
      return "bg-primary-light text-pin-state ring-pin-state/20";
    default:
      return "bg-workflow-neutral-surface text-muted ring-border-subtle";
  }
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

export function resolveBackendSort(
  sort: AppliedJobsSort,
): "newest" | "oldest" {
  return sort === "oldest" ? "oldest" : "newest";
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
      stats.joined
    );
  }

  const config = APPLIED_JOBS_STATS_FILTERS.find((item) => item.key === filter);
  if (!config?.statsKey) {
    return null;
  }

  return stats[config.statsKey];
}

export function filterByStatsGroup(
  applications: SeekerApplicationListItem[],
  filter: AppliedJobsStatsFilter,
): SeekerApplicationListItem[] {
  const config = APPLIED_JOBS_STATS_FILTERS.find((item) => item.key === filter);
  if (!config?.statuses?.length || config.backendStatus) {
    return applications;
  }
  return applications.filter((item) => config.statuses!.includes(item.status));
}

export function statusBadgeClasses(
  status: ApplicationStatus,
  className?: string,
): string {
  return cn(
    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
    applicationStatusBadgeClass(status),
    className,
  );
}
