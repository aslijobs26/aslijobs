/**
 * Employer Interviews dashboard query helpers.
 * Reuses candidate search patterns and extends with interview-specific fields.
 */

import { buildEmployerCandidateSearchMatch } from "./employer-candidate-search.js";
import { normalizeEmployerCandidateSearchQuery } from "./employer-candidate-search.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function formatLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfWeekMonday(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

export function endOfWeekSunday(date: Date): Date {
  const start = startOfWeekMonday(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

export type EmployerInterviewStatsPeriod =
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "all_time";

export function getInterviewStatsPeriodRange(
  period: EmployerInterviewStatsPeriod,
  today: Date = new Date(),
): { from: string; to: string } | null {
  if (period === "all_time") {
    return null;
  }

  if (period === "today") {
    const day = formatLocalDateString(today);
    return { from: day, to: day };
  }

  if (period === "this_week") {
    return {
      from: formatLocalDateString(startOfWeekMonday(today)),
      to: formatLocalDateString(endOfWeekSunday(today)),
    };
  }

  if (period === "this_month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      from: formatLocalDateString(start),
      to: formatLocalDateString(end),
    };
  }

  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 0);
  return {
    from: formatLocalDateString(start),
    to: formatLocalDateString(end),
  };
}

export function isInterviewDateInPeriod(
  interviewDate: string,
  period: EmployerInterviewStatsPeriod,
  today: Date = new Date(),
): boolean {
  const range = getInterviewStatsPeriodRange(period, today);
  if (!range) {
    return true;
  }
  const date = interviewDate.trim();
  if (!date) {
    return false;
  }
  return date >= range.from && date <= range.to;
}

/** Applications that have a scheduled interview date. */
export function buildEmployerInterviewBaseMatch(
  employerObjectId: unknown,
): Record<string, unknown> {
  return {
    employerId: employerObjectId,
    "interview.date": { $type: "string", $ne: "" },
  };
}

/**
 * Search candidate identity/job fields plus interviewer and employer notes.
 */
export function buildEmployerInterviewSearchMatch(
  rawSearch: string | undefined,
): Record<string, unknown> | null {
  const search = normalizeEmployerCandidateSearchQuery(rawSearch);
  if (!search) {
    return null;
  }

  const pattern = escapeRegex(search);
  const candidateMatch = buildEmployerCandidateSearchMatch(search);
  const interviewClauses: Record<string, unknown>[] = [
    { "interview.interviewerName": { $regex: pattern, $options: "i" } },
    { "interview.interviewerDesignation": { $regex: pattern, $options: "i" } },
    { "interview.interviewerEmail": { $regex: pattern, $options: "i" } },
    { "interview.interviewerPhone": { $regex: pattern, $options: "i" } },
    { "interview.venue": { $regex: pattern, $options: "i" } },
    { "interview.meetingLink": { $regex: pattern, $options: "i" } },
    { "interview.instructions": { $regex: pattern, $options: "i" } },
    { employerNotes: { $regex: pattern, $options: "i" } },
    { publicJobId: { $regex: pattern, $options: "i" } },
    { "job.jobTitle": { $regex: pattern, $options: "i" } },
    { "job.jobId": { $regex: pattern, $options: "i" } },
  ];

  if (candidateMatch && Array.isArray((candidateMatch as { $or?: unknown }).$or)) {
    return {
      $or: [
        ...((candidateMatch as { $or: Record<string, unknown>[] }).$or ?? []),
        ...interviewClauses,
      ],
    };
  }

  return { $or: interviewClauses };
}

export function hasInterviewRescheduleRemark(
  statusHistory: unknown,
): boolean {
  if (!Array.isArray(statusHistory)) {
    return false;
  }
  return statusHistory.some((entry) => {
    if (!entry || typeof entry !== "object") {
      return false;
    }
    const remark =
      typeof (entry as { remark?: unknown }).remark === "string"
        ? (entry as { remark: string }).remark.trim()
        : "";
    return remark.startsWith("Interview Rescheduled");
  });
}
