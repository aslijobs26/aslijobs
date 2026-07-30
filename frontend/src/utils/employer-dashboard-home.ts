import type {
  EmployerDashboardFunnelPeriod,
  EmployerDashboardFunnelStageId,
  EmployerDashboardStatKey,
} from "@/constants/employer-dashboard-home";
import type { EmployerApplicationStats } from "@/types/employer-applications";
import type { EmployerLoginPublic } from "@/services/employer-login.service";

export type EmployerDashboardGrowth = {
  percent: number | null;
  direction: "up" | "down" | "flat" | "new";
  label: string;
};

export type EmployerDashboardFunnelStage = {
  id: EmployerDashboardFunnelStageId;
  label: string;
  count: number;
};

export type EmployerDashboardInsight = {
  id: string;
  title: string;
  detail: string;
};

export type EmployerDashboardSourceSlice = {
  id: string;
  label: string;
  value: number;
  percent: number;
};

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function toIsoDate(date: Date): string {
  return date.toISOString();
}

export function getEmployerDashboardWeekRanges(now = new Date()): {
  currentFrom: string;
  currentTo: string;
  previousFrom: string;
  previousTo: string;
} {
  const currentEnd = endOfDay(now);
  const currentStart = startOfDay(new Date(now));
  currentStart.setDate(currentStart.getDate() - 6);

  const previousEnd = endOfDay(new Date(currentStart));
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = startOfDay(new Date(previousEnd));
  previousStart.setDate(previousStart.getDate() - 6);

  return {
    currentFrom: toIsoDate(currentStart),
    currentTo: toIsoDate(currentEnd),
    previousFrom: toIsoDate(previousStart),
    previousTo: toIsoDate(previousEnd),
  };
}

export function getEmployerDashboardMonthRange(
  period: Exclude<EmployerDashboardFunnelPeriod, "all">,
  now = new Date(),
): { from: string; to: string } {
  const year = now.getFullYear();
  const month = now.getMonth();

  if (period === "this_month") {
    const from = startOfDay(new Date(year, month, 1));
    const to = endOfDay(now);
    return { from: toIsoDate(from), to: toIsoDate(to) };
  }

  const from = startOfDay(new Date(year, month - 1, 1));
  const to = endOfDay(new Date(year, month, 0));
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

export function calculateEmployerDashboardGrowth(
  current: number,
  previous: number,
): EmployerDashboardGrowth {
  if (previous === 0 && current === 0) {
    return {
      percent: 0,
      direction: "flat",
      label: "No change from last week",
    };
  }

  if (previous === 0 && current > 0) {
    return {
      percent: null,
      direction: "new",
      label: "New activity this week",
    };
  }

  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) {
    return {
      percent: 0,
      direction: "flat",
      label: "No change from last week",
    };
  }

  if (percent > 0) {
    return {
      percent,
      direction: "up",
      label: `↑ ${percent}% from last week`,
    };
  }

  return {
    percent: Math.abs(percent),
    direction: "down",
    label: `↓ ${Math.abs(percent)}% from last week`,
  };
}

export function buildEmployerDashboardFunnelFromStats(
  stats: EmployerApplicationStats,
): EmployerDashboardFunnelStage[] {
  const screening = stats.viewed + stats.under_review;
  const interviews = stats.interview_scheduled + stats.interview_completed;
  const hired = stats.selected + stats.joined;

  return [
    { id: "applications", label: "Applications", count: stats.total },
    { id: "screening", label: "Screening", count: screening },
    { id: "shortlisted", label: "Shortlisted", count: stats.shortlisted },
    { id: "interview", label: "Interviews", count: interviews },
    { id: "offer", label: "Offer Sent", count: stats.offer_sent },
    { id: "hired", label: "Hired", count: hired },
  ];
}

export function calculateEmployerDashboardConversionRate(
  stages: EmployerDashboardFunnelStage[],
): number {
  const applications =
    stages.find((stage) => stage.id === "applications")?.count ?? 0;
  const hired = stages.find((stage) => stage.id === "hired")?.count ?? 0;
  if (applications <= 0) {
    return 0;
  }
  return Math.round((hired / applications) * 1000) / 10;
}

export function buildEmployerDashboardMetricValues(input: {
  activeJobs: number;
  applicationStats: EmployerApplicationStats | undefined;
}): Record<EmployerDashboardStatKey, number> {
  const stats = input.applicationStats;
  return {
    activeJobs: input.activeJobs,
    applications: stats?.total ?? 0,
    shortlisted: stats?.shortlisted ?? 0,
    interviews:
      (stats?.interview_scheduled ?? 0) + (stats?.interview_completed ?? 0),
    hired: (stats?.selected ?? 0) + (stats?.joined ?? 0),
  };
}

export function buildEmployerDashboardInsights(input: {
  activeJobs: number;
  applicationStats: EmployerApplicationStats | undefined;
  interviewsToday: number;
  profileCompletionPercentage: number | null;
  topJobTitle?: string;
  topJobApplications?: number;
}): EmployerDashboardInsight[] {
  const insights: EmployerDashboardInsight[] = [];
  const stats = input.applicationStats;

  if (stats && stats.total > 0) {
    const unreviewed = stats.submitted + stats.viewed + stats.under_review;
    if (unreviewed > 0) {
      insights.push({
        id: "unreviewed",
        title: `${unreviewed} applications need review`,
        detail: "Clear your screening queue to keep candidates engaged.",
      });
    }

    if (stats.shortlisted > 0 && stats.interview_scheduled === 0) {
      insights.push({
        id: "schedule-interviews",
        title: `${stats.shortlisted} shortlisted candidates`,
        detail: "Schedule interviews to keep your hiring pipeline moving.",
      });
    }

    if (stats.offer_sent > 0) {
      insights.push({
        id: "offers",
        title: `${stats.offer_sent} offers awaiting response`,
        detail: "Follow up promptly to improve offer acceptance.",
      });
    }
  }

  if (input.interviewsToday > 0) {
    insights.push({
      id: "interviews-today",
      title: `${input.interviewsToday} interview${input.interviewsToday === 1 ? "" : "s"} today`,
      detail: "Review candidate profiles before each conversation.",
    });
  }

  if (
    typeof input.topJobTitle === "string" &&
    input.topJobTitle.trim() &&
    (input.topJobApplications ?? 0) > 0
  ) {
    insights.push({
      id: "top-job",
      title: `${input.topJobApplications} applications for ${input.topJobTitle}`,
      detail: "This role is attracting strong candidate interest.",
    });
  }

  if (
    input.profileCompletionPercentage !== null &&
    input.profileCompletionPercentage < 100
  ) {
    insights.push({
      id: "profile",
      title: `Profile ${input.profileCompletionPercentage}% complete`,
      detail: "A complete profile builds trust with candidates.",
    });
  }

  if (input.activeJobs === 0) {
    insights.push({
      id: "post-job",
      title: "No active jobs yet",
      detail: "Post a job to start receiving verified candidates.",
    });
  }

  return insights.slice(0, 3);
}

/**
 * Application acquisition source is not yet stored by the backend.
 * Until channel attribution exists, all applications are attributed to the
 * AsliJobs platform (the only verified intake channel).
 */
export function buildEmployerDashboardSourceSlices(input: {
  totalApplications: number;
}): EmployerDashboardSourceSlice[] {
  const total = Math.max(0, input.totalApplications);
  if (total === 0) {
    return [];
  }

  return [
    {
      id: "platform",
      label: "asliJobs Platform",
      value: total,
      percent: 100,
    },
  ];
}

export function getEmployerDashboardDisplayName(
  employer: EmployerLoginPublic,
): string {
  if (employer.accountType === "individual") {
    const fullName = `${employer.firstName} ${employer.lastName}`.trim();
    return (
      employer.establishmentName.trim() ||
      fullName ||
      "Employer"
    );
  }

  const companyName = employer.companyName.trim();
  if (companyName) {
    return companyName;
  }

  const fullName = `${employer.firstName} ${employer.lastName}`.trim();
  return fullName || "Employer";
}

export function formatEmployerDashboardRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
}
