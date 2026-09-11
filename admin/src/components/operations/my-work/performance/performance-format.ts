import type { LucideIcon } from "lucide-react";
import type { OperationsWorkPerformanceResult } from "../../../../types/operations-work";

export type TrendDirection = "up" | "down" | "flat" | "none";

export interface PerformanceMetricCardModel {
  id: string;
  label: string;
  value: string;
  Icon: LucideIcon;
  iconWrapClassName: string;
  iconClassName: string;
  cardClassName: string;
  trend: {
    direction: TrendDirection;
    label: string;
    caption: string;
  };
}

export function formatPerformanceMetric(
  value: number | null | undefined,
  options?: { suffix?: string; decimals?: number },
): string {
  if (value == null || Number.isNaN(value)) return "—";
  const decimals = options?.decimals;
  const formatted =
    decimals != null
      ? value.toLocaleString("en-IN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: decimals,
        })
      : value.toLocaleString("en-IN");
  return `${formatted}${options?.suffix ?? ""}`;
}

export function percentChange(
  current: number,
  previous: number,
): { direction: Exclude<TrendDirection, "none">; percent: number } {
  if (previous === 0 && current === 0) {
    return { direction: "flat", percent: 0 };
  }
  if (previous === 0 && current > 0) {
    return { direction: "up", percent: 100 };
  }
  if (previous === 0 && current < 0) {
    return { direction: "down", percent: 100 };
  }
  const raw = ((current - previous) / Math.abs(previous)) * 100;
  const percent = Math.round(Math.abs(raw));
  if (raw > 0) return { direction: "up", percent };
  if (raw < 0) return { direction: "down", percent };
  return { direction: "flat", percent: 0 };
}

export function formatTrendRangeLabel(
  trend: OperationsWorkPerformanceResult["completionTrend"],
): string {
  if (!trend.length) return "Last 7 days";
  const first = trend[0]?.date;
  const last = trend[trend.length - 1]?.date;
  if (!first || !last) return "Last 7 days";
  return `${formatShortDate(first)} - ${formatShortDate(last)}`;
}

export function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTrendAxisLabel(isoDate: string, fallback: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return fallback;
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  return `${weekday} ${day} ${month}`;
}

export function sumTrendHalf(
  trend: OperationsWorkPerformanceResult["completionTrend"],
  half: "first" | "second",
): number {
  if (trend.length === 0) return 0;
  const mid = Math.floor(trend.length / 2);
  const slice = half === "first" ? trend.slice(0, mid) : trend.slice(mid);
  return slice.reduce((sum, point) => sum + point.completed, 0);
}
