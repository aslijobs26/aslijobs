import type { AnalyticsDatePreset } from "./operations-analytics.types.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const KOLKATA_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export type AnalyticsComparisonLabel =
  | "percent"
  | "new"
  | "no_baseline"
  | "unavailable";

export type AnalyticsComparisonBasis =
  | "equivalent_length"
  | "previous_calendar_period"
  | "unavailable";

type CalendarDate = { y: number; m: number; d: number };

export function kolkataParts(date: Date): CalendarDate {
  const shifted = new Date(date.getTime() + KOLKATA_OFFSET_MS);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
  };
}

export function kolkataDateKey(date: Date): string {
  const parts = kolkataParts(date);
  return `${parts.y}-${String(parts.m + 1).padStart(2, "0")}-${String(parts.d).padStart(2, "0")}`;
}

export function parseCalendarDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const d = Number(match[3]);
  if (m < 0 || m > 11 || d < 1 || d > 31) return null;
  const probe = new Date(Date.UTC(y, m, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

export function startOfKolkataDay(parts: CalendarDate): Date {
  return new Date(Date.UTC(parts.y, parts.m, parts.d) - KOLKATA_OFFSET_MS);
}

export function endOfKolkataDay(parts: CalendarDate): Date {
  return new Date(
    Date.UTC(parts.y, parts.m, parts.d, 23, 59, 59, 999) - KOLKATA_OFFSET_MS,
  );
}

function addDays(parts: CalendarDate, days: number): CalendarDate {
  const probe = new Date(Date.UTC(parts.y, parts.m, parts.d + days));
  return {
    y: probe.getUTCFullYear(),
    m: probe.getUTCMonth(),
    d: probe.getUTCDate(),
  };
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function shiftMonth(parts: CalendarDate, delta: number): CalendarDate {
  const probe = new Date(Date.UTC(parts.y, parts.m + delta, 1));
  return { y: probe.getUTCFullYear(), m: probe.getUTCMonth(), d: 1 };
}

function quarterStartMonth(monthIndex: number): number {
  return Math.floor(monthIndex / 3) * 3;
}

export function resolveAnalyticsDateRange(
  input: {
    preset: AnalyticsDatePreset;
    dateFrom?: string;
    dateTo?: string;
  },
  now: Date = new Date(),
): {
  preset: AnalyticsDatePreset;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  label: string;
  comparisonBasis: AnalyticsComparisonBasis;
} {
  const today = kolkataParts(now);
  let fromParts = today;
  let toParts = today;
  let label = "Today";
  let comparisonBasis: AnalyticsComparisonBasis = "equivalent_length";
  let previousFromParts: CalendarDate | null = null;
  let previousToParts: CalendarDate | null = null;

  switch (input.preset) {
    case "today": {
      label = "Today";
      previousFromParts = addDays(today, -1);
      previousToParts = addDays(today, -1);
      comparisonBasis = "previous_calendar_period";
      break;
    }
    case "yesterday": {
      fromParts = addDays(today, -1);
      toParts = fromParts;
      label = "Yesterday";
      previousFromParts = addDays(today, -2);
      previousToParts = previousFromParts;
      comparisonBasis = "previous_calendar_period";
      break;
    }
    case "last_7_days": {
      fromParts = addDays(today, -6);
      label = "Last 7 days";
      break;
    }
    case "last_30_days": {
      fromParts = addDays(today, -29);
      label = "Last 30 days";
      break;
    }
    case "last_90_days": {
      fromParts = addDays(today, -89);
      label = "Last 3 months";
      break;
    }
    case "last_6_months": {
      fromParts = shiftMonth(today, -6);
      fromParts = { ...fromParts, d: Math.min(today.d, daysInMonth(fromParts.y, fromParts.m)) };
      label = "Last 6 months";
      break;
    }
    case "last_12_months": {
      fromParts = shiftMonth(today, -12);
      fromParts = { ...fromParts, d: Math.min(today.d, daysInMonth(fromParts.y, fromParts.m)) };
      label = "Last 12 months";
      break;
    }
    case "this_month": {
      fromParts = { y: today.y, m: today.m, d: 1 };
      label = "This month";
      const prev = shiftMonth(today, -1);
      previousFromParts = prev;
      previousToParts = {
        y: prev.y,
        m: prev.m,
        d: daysInMonth(prev.y, prev.m),
      };
      comparisonBasis = "previous_calendar_period";
      break;
    }
    case "last_month": {
      const prev = shiftMonth(today, -1);
      fromParts = prev;
      toParts = { y: prev.y, m: prev.m, d: daysInMonth(prev.y, prev.m) };
      label = "Last month";
      const before = shiftMonth(today, -2);
      previousFromParts = before;
      previousToParts = {
        y: before.y,
        m: before.m,
        d: daysInMonth(before.y, before.m),
      };
      comparisonBasis = "previous_calendar_period";
      break;
    }
    case "this_quarter": {
      const startMonth = quarterStartMonth(today.m);
      fromParts = { y: today.y, m: startMonth, d: 1 };
      label = "This quarter";
      const prevStart = shiftMonth({ y: today.y, m: startMonth, d: 1 }, -3);
      previousFromParts = prevStart;
      const prevEndMonth = shiftMonth(prevStart, 2);
      previousToParts = {
        y: prevEndMonth.y,
        m: prevEndMonth.m,
        d: daysInMonth(prevEndMonth.y, prevEndMonth.m),
      };
      comparisonBasis = "previous_calendar_period";
      break;
    }
    case "this_year": {
      fromParts = { y: today.y, m: 0, d: 1 };
      label = "This year";
      previousFromParts = { y: today.y - 1, m: 0, d: 1 };
      previousToParts = { y: today.y - 1, m: 11, d: 31 };
      comparisonBasis = "previous_calendar_period";
      break;
    }
    case "custom": {
      const parsedFrom = parseCalendarDate(input.dateFrom ?? "");
      const parsedTo = parseCalendarDate(input.dateTo ?? "");
      fromParts = parsedFrom ?? today;
      toParts = parsedTo ?? today;
      label = "Custom range";
      break;
    }
    case "all":
    default: {
      fromParts = { y: 2020, m: 0, d: 1 };
      label = "Overall";
      comparisonBasis = "unavailable";
      break;
    }
  }

  const from = startOfKolkataDay(fromParts);
  const to = endOfKolkataDay(toParts);
  let previousFrom = new Date(0);
  let previousTo = new Date(0);

  if (comparisonBasis === "unavailable") {
    previousFrom = from;
    previousTo = new Date(from.getTime() - 1);
  } else if (previousFromParts && previousToParts) {
    previousFrom = startOfKolkataDay(previousFromParts);
    previousTo = endOfKolkataDay(previousToParts);
  } else {
    const durationMs = Math.max(to.getTime() - from.getTime(), MS_PER_DAY - 1);
    previousTo = new Date(from.getTime() - 1);
    previousFrom = new Date(previousTo.getTime() - durationMs);
  }

  return {
    preset: input.preset,
    from: from.toISOString(),
    to: to.toISOString(),
    previousFrom: previousFrom.toISOString(),
    previousTo: previousTo.toISOString(),
    label,
    comparisonBasis,
  };
}

export function toIsoDateOnly(iso: string): string {
  return kolkataDateKey(new Date(iso));
}

export function percentOf(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function compareMetric(
  current: number,
  previous: number | null,
): {
  previousValue: number | null;
  absoluteDifference: number | null;
  changePercent: number | null;
  trendDirection: "up" | "down" | "flat" | null;
  changeLabel: AnalyticsComparisonLabel;
} {
  if (previous == null) {
    return {
      previousValue: null,
      absoluteDifference: null,
      changePercent: null,
      trendDirection: null,
      changeLabel: "unavailable",
    };
  }
  if (previous <= 0 && current <= 0) {
    return {
      previousValue: 0,
      absoluteDifference: 0,
      changePercent: null,
      trendDirection: "flat",
      changeLabel: "no_baseline",
    };
  }
  if (previous <= 0 && current > 0) {
    return {
      previousValue: 0,
      absoluteDifference: current,
      changePercent: null,
      trendDirection: "up",
      changeLabel: "new",
    };
  }
  const changePercent = percentChange(current, previous);
  const absoluteDifference = current - previous;
  return {
    previousValue: previous,
    absoluteDifference,
    changePercent,
    trendDirection:
      absoluteDifference > 0 ? "up" : absoluteDifference < 0 ? "down" : "flat",
    changeLabel: "percent",
  };
}

export function consecutiveConversionPercent(
  current: number,
  previous: number,
): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round((current / previous) * 100);
}

export function classifySupplyDemand(
  supply: number,
  demand: number,
): "shortage" | "surplus" | "balanced" {
  if (demand <= 0 && supply <= 0) return "balanced";
  if (demand <= 0) return "surplus";
  const ratio = supply / demand;
  if (ratio < 0.85) return "shortage";
  if (ratio > 1.15) return "surplus";
  return "balanced";
}

export function classifyLevel(
  value: number,
  highThreshold: number,
  mediumThreshold: number,
): "high" | "medium" | "low" {
  if (value >= highThreshold) return "high";
  if (value >= mediumThreshold) return "medium";
  return "low";
}

export function marketStatusForLevels(
  talentSupply: "high" | "medium" | "low",
  jobDemand: "high" | "medium" | "low",
  placementRate: "high" | "medium" | "low",
): {
  status: string;
  tone: "danger" | "success" | "warning" | "info" | "neutral";
} {
  if (jobDemand === "high" && talentSupply === "low") {
    return { status: "More talent needed", tone: "danger" };
  }
  if (talentSupply === "high" && jobDemand === "low") {
    return { status: "Underserved", tone: "warning" };
  }
  if (talentSupply === "high" && jobDemand === "medium" && placementRate === "low") {
    return { status: "More jobs needed", tone: "danger" };
  }
  if (talentSupply === "high" && jobDemand === "high") {
    return { status: "Growth market", tone: "success" };
  }
  if (jobDemand === "high" && placementRate === "high") {
    return { status: "Healthy market", tone: "success" };
  }
  if (jobDemand === "high") {
    return { status: "Good opportunity", tone: "info" };
  }
  return { status: "Watch closely", tone: "neutral" };
}
