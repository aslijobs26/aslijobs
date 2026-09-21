import type { AnalyticsDatePreset } from "./operations-analytics.types.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function resolveAnalyticsDateRange(input: {
  preset: AnalyticsDatePreset;
  dateFrom?: string;
  dateTo?: string;
}): {
  preset: AnalyticsDatePreset;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  label: string;
} {
  const now = new Date();
  const todayEnd = endOfLocalDay(now);
  let from: Date;
  let to: Date = todayEnd;
  let label: string;

  switch (input.preset) {
    case "today": {
      from = startOfLocalDay(now);
      label = "Today";
      break;
    }
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      from = startOfLocalDay(yesterday);
      to = endOfLocalDay(yesterday);
      label = "Yesterday";
      break;
    }
    case "last_7_days": {
      from = startOfLocalDay(now);
      from.setDate(from.getDate() - 6);
      label = "Last 7 days";
      break;
    }
    case "last_30_days": {
      from = startOfLocalDay(now);
      from.setDate(from.getDate() - 29);
      label = "Last 30 days";
      break;
    }
    case "last_90_days": {
      from = startOfLocalDay(now);
      from.setDate(from.getDate() - 89);
      label = "Last 3 months";
      break;
    }
    case "last_6_months": {
      from = startOfLocalDay(now);
      from.setMonth(from.getMonth() - 6);
      label = "Last 6 months";
      break;
    }
    case "last_12_months": {
      from = startOfLocalDay(now);
      from.setMonth(from.getMonth() - 12);
      label = "Last 12 months";
      break;
    }
    case "this_year": {
      from = startOfLocalDay(new Date(now.getFullYear(), 0, 1));
      label = "This year";
      break;
    }
    case "custom": {
      from = startOfLocalDay(
        input.dateFrom ? new Date(input.dateFrom) : now,
      );
      to = endOfLocalDay(input.dateTo ? new Date(input.dateTo) : now);
      label = "Custom range";
      break;
    }
    case "all":
    default: {
      from = startOfLocalDay(new Date(2020, 0, 1));
      label = "Overall";
      break;
    }
  }

  const durationMs = Math.max(to.getTime() - from.getTime(), MS_PER_DAY);
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - durationMs);

  return {
    preset: input.preset,
    from: from.toISOString(),
    to: to.toISOString(),
    previousFrom: previousFrom.toISOString(),
    previousTo: previousTo.toISOString(),
    label,
  };
}

export function toIsoDateOnly(iso: string): string {
  return toIsoDate(new Date(iso));
}

export function percentOf(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous <= 0) {
    return current > 0 ? 100 : current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
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
