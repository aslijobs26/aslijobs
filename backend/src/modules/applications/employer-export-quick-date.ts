/**
 * Quick date presets for employer candidate export.
 * Ranges are resolved server-side against application appliedAt.
 */

export const EMPLOYER_EXPORT_QUICK_DATE_FILTERS = [
  "all_time",
  "today",
  "yesterday",
  "last_7_days",
  "last_30_days",
  "this_month",
  "last_month",
  "custom",
] as const;

export type EmployerExportQuickDateFilter =
  (typeof EMPLOYER_EXPORT_QUICK_DATE_FILTERS)[number];

export const EMPLOYER_EXPORT_QUICK_DATE_LABELS: Record<
  EmployerExportQuickDateFilter,
  string
> = {
  all_time: "All Time",
  today: "Today",
  yesterday: "Yesterday",
  last_7_days: "Last 7 Days",
  last_30_days: "Last 30 Days",
  this_month: "This Month",
  last_month: "Last Month",
  custom: "Custom Date Range",
};

function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export type ResolvedExportDateRange = {
  appliedFrom?: Date;
  appliedTo?: Date;
};

/**
 * Resolves a quick-date preset to an inclusive appliedAt range.
 * `custom` / `all_time` return null so callers use appliedFrom/appliedTo or no date filter.
 */
export function resolveEmployerExportQuickDateRange(
  filter: EmployerExportQuickDateFilter | "" | undefined,
  nowInput: Date = new Date(),
): ResolvedExportDateRange | null {
  const filterValue = (filter ?? "").trim() as EmployerExportQuickDateFilter | "";
  if (
    !filterValue ||
    filterValue === "all_time" ||
    filterValue === "custom"
  ) {
    return null;
  }

  const now = new Date(nowInput);

  switch (filterValue) {
    case "today": {
      return {
        appliedFrom: startOfLocalDay(now),
        appliedTo: endOfLocalDay(now),
      };
    }
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        appliedFrom: startOfLocalDay(yesterday),
        appliedTo: endOfLocalDay(yesterday),
      };
    }
    case "last_7_days": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return {
        appliedFrom: startOfLocalDay(from),
        appliedTo: endOfLocalDay(now),
      };
    }
    case "last_30_days": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return {
        appliedFrom: startOfLocalDay(from),
        appliedTo: endOfLocalDay(now),
      };
    }
    case "this_month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        appliedFrom: startOfLocalDay(from),
        appliedTo: endOfLocalDay(now),
      };
    }
    case "last_month": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        appliedFrom: startOfLocalDay(from),
        appliedTo: endOfLocalDay(to),
      };
    }
    default:
      return null;
  }
}

export function parseEmployerExportQuickDateFilter(
  value: string | undefined,
): EmployerExportQuickDateFilter | "" {
  const trimmed = (value ?? "").trim();
  if (
    (EMPLOYER_EXPORT_QUICK_DATE_FILTERS as readonly string[]).includes(trimmed)
  ) {
    return trimmed as EmployerExportQuickDateFilter;
  }
  return "";
}
