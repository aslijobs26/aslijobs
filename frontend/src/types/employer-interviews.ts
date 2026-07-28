import type {
  ApplicationInterviewMode,
  ApplicationStatus,
} from "@/types/job-seeker-applications";
import type { EmployerApplicationsPagination } from "@/types/employer-applications";

export type EmployerInterviewListItem = {
  id: string;
  publicJobId: string;
  jobTitle: string;
  jobLocation: string;
  status: ApplicationStatus;
  wasRescheduled: boolean;
  isCancelled: boolean;
  cancellationReason: string;
  cancelledAt: string | null;
  candidateName: string;
  candidatePhone: string;
  interviewDate: string;
  interviewTime: string;
  interviewMode: ApplicationInterviewMode;
  interviewerName: string;
  interviewerDesignation: string;
  meetingLink: string;
  venue: string;
  appliedAt: string;
  updatedAt: string | null;
};

export type EmployerInterviewStats = {
  total: number;
  today: number;
  thisWeek: number;
  scheduled: number;
  completed: number;
  rescheduled: number;
  byMode: {
    online: number;
    offline: number;
    phone: number;
  };
};

export type EmployerInterviewStatsPeriod =
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "all_time";

export type EmployerInterviewStatusOverviewKey =
  | "scheduled"
  | "completed"
  | "rescheduled"
  | "cancelled";

export type EmployerInterviewStatusOverviewItem = {
  key: EmployerInterviewStatusOverviewKey;
  label: string;
  count: number;
  percentage: number;
};

export type EmployerInterviewStatusOverview = {
  total: number;
  period: string;
  statuses: EmployerInterviewStatusOverviewItem[];
};

export type EmployerInterviewJobTab = {
  publicJobId: string;
  jobTitle: string;
  count: number;
};

export type EmployerInterviewsListParams = {
  publicJobId?: string;
  status?: "interview_scheduled" | "interview_completed";
  mode?: "online" | "offline" | "phone";
  search?: string;
  interviewer?: string;
  interviewFrom?: string;
  interviewTo?: string;
  quickDate?: "today" | "tomorrow" | "this_week" | "this_month" | "";
  rescheduledOnly?: boolean;
  cancelledOnly?: boolean;
  sort?: "interview_asc" | "interview_desc" | "newest" | "oldest";
  page?: number;
  limit?: number;
};

export type EmployerInterviewsListResult = {
  interviews: EmployerInterviewListItem[];
  pagination: EmployerApplicationsPagination;
};

export type EmployerInterviewStatsResult = {
  stats: EmployerInterviewStats;
  todaysSchedule: EmployerInterviewListItem[];
  jobTabs: EmployerInterviewJobTab[];
  statusOverview: EmployerInterviewStatusOverview;
};

export function formatInterviewModeLabel(
  mode: ApplicationInterviewMode | string,
): string {
  switch (mode) {
    case "online":
      return "Online";
    case "offline":
      return "Offline";
    case "phone":
      return "Phone";
    default:
      return mode || "—";
  }
}

export type InterviewTypeDisplay = {
  label: string;
  variant: "meet" | "zoom" | "teams" | "whatsapp" | "phone" | "offline" | "online";
};

/** ATS-style interview type label derived from mode + meeting link. */
export function resolveInterviewTypeDisplay(input: {
  mode: ApplicationInterviewMode | string;
  meetingLink?: string;
}): InterviewTypeDisplay {
  const mode = input.mode;
  const link = (input.meetingLink ?? "").trim().toLowerCase();

  if (mode === "phone") {
    return { label: "Phone", variant: "phone" };
  }

  if (mode === "offline") {
    return { label: "In Person", variant: "offline" };
  }

  if (mode === "online") {
    if (link.includes("meet.google") || link.includes("google.com/meet")) {
      return { label: "Google Meet", variant: "meet" };
    }
    if (link.includes("zoom.us") || link.includes("zoom.com")) {
      return { label: "Zoom", variant: "zoom" };
    }
    if (link.includes("teams.microsoft") || link.includes("teams.live")) {
      return { label: "Microsoft Teams", variant: "teams" };
    }
    if (link.includes("wa.me") || link.includes("whatsapp")) {
      return { label: "WhatsApp Call", variant: "whatsapp" };
    }
    return { label: "Video Call", variant: "online" };
  }

  return { label: formatInterviewModeLabel(mode), variant: "online" };
}

export function formatInterviewTime12h(time: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) {
    return time.trim() || "—";
  }
  const hour24 = Number(match[1]);
  const minute = match[2];
  if (!Number.isFinite(hour24) || hour24 < 0 || hour24 > 23) {
    return time.trim() || "—";
  }
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${period}`;
}

export function interviewDisplayStatus(item: EmployerInterviewListItem): {
  label: string;
  className: string;
} {
  if (item.isCancelled) {
    return {
      label: "Cancelled",
      className: "bg-red-50 text-pin-state ring-red-200",
    };
  }
  if (item.status === "interview_completed") {
    return {
      label: "Completed",
      className: "bg-primary-light text-primary ring-primary/20",
    };
  }
  if (item.wasRescheduled) {
    return {
      label: "Rescheduled",
      className: "bg-amber-50 text-amber-800 ring-amber-200",
    };
  }
  return {
    label: "Confirmed",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };
}
