import {
  startOfKolkataDay,
  startOfNextKolkataDay,
  toKolkataIsoDate,
} from "../registration-awareness/operations-registration-time.js";
import type { DashboardDatePreset } from "./operations-dashboard.validation.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type DashboardDateRange = {
  preset: DashboardDatePreset;
  from: Date;
  toExclusive: Date;
  previousFrom: Date;
  previousToExclusive: Date;
  label: string;
};

function parseDateOnly(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [year, month, day] = trimmed.split("-").map(Number);
  const parsed = startOfKolkataDay(new Date(Date.UTC(year, month - 1, day, 12)));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function completionRate(
  completed: number,
  total: number,
): number | null {
  if (total <= 0) return null;
  return Math.round((completed / total) * 1000) / 10;
}

/**
 * Inclusive business-day range in Asia/Kolkata with equal-length previous window.
 */
export function resolveDashboardDateRange(input: {
  datePreset: DashboardDatePreset;
  dateFrom?: string;
  dateTo?: string;
  now?: Date;
}): DashboardDateRange {
  const now = input.now ?? new Date();
  const todayStart = startOfKolkataDay(now);
  const tomorrowStart = startOfNextKolkataDay(now);

  let from: Date;
  let toExclusive: Date;
  let label: string;

  switch (input.datePreset) {
    case "last_7_days": {
      toExclusive = tomorrowStart;
      from = new Date(todayStart.getTime() - 6 * MS_PER_DAY);
      label = "Last 7 days";
      break;
    }
    case "last_90_days": {
      toExclusive = tomorrowStart;
      from = new Date(todayStart.getTime() - 89 * MS_PER_DAY);
      label = "Last 90 days";
      break;
    }
    case "this_year": {
      const iso = toKolkataIsoDate(now);
      const year = Number(iso.slice(0, 4));
      from = startOfKolkataDay(new Date(Date.UTC(year, 0, 1, 12)));
      toExclusive = tomorrowStart;
      label = "This year";
      break;
    }
    case "custom": {
      const start = input.dateFrom ? parseDateOnly(input.dateFrom) : null;
      const end = input.dateTo ? parseDateOnly(input.dateTo) : null;
      if (!start || !end) {
        throw new Error("Invalid custom date range.");
      }
      from = start <= end ? start : end;
      const endDay = start <= end ? end : start;
      toExclusive = startOfNextKolkataDay(endDay);
      label = "Custom range";
      break;
    }
    case "last_30_days":
    default: {
      toExclusive = tomorrowStart;
      from = new Date(todayStart.getTime() - 29 * MS_PER_DAY);
      label = "Last 30 days";
      break;
    }
  }

  const durationMs = Math.max(toExclusive.getTime() - from.getTime(), MS_PER_DAY);
  const previousToExclusive = from;
  const previousFrom = new Date(previousToExclusive.getTime() - durationMs);

  return {
    preset: input.datePreset,
    from,
    toExclusive,
    previousFrom,
    previousToExclusive,
    label,
  };
}

/** Map WorkItem statuses into Overview Task Status buckets. */
export function mapWorkStatusToTaskBucket(
  status: string,
  dueAt: Date | null | undefined,
  now: Date,
): "completed" | "in_progress" | "pending" | "overdue" | null {
  if (status === "completed") return "completed";
  if (status === "cancelled") return null;
  const overdue =
    dueAt instanceof Date &&
    !Number.isNaN(dueAt.getTime()) &&
    dueAt.getTime() < now.getTime();
  if (overdue) return "overdue";
  if (status === "in_progress" || status === "waiting") return "in_progress";
  if (status === "queued" || status === "assigned") return "pending";
  return null;
}

export function enumerateKolkataDays(from: Date, toExclusive: Date): string[] {
  const days: string[] = [];
  let cursor = startOfKolkataDay(from);
  const end = toExclusive.getTime();
  while (cursor.getTime() < end) {
    days.push(toKolkataIsoDate(cursor));
    cursor = new Date(cursor.getTime() + MS_PER_DAY);
  }
  return days;
}
