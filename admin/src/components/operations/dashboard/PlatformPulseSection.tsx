import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  MapPin,
  Users,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { PlatformPulseMetric } from "../../../types/operations-dashboard";
import { cn } from "../../../utils/cn";

const TONE_CONFIG: Record<
  PlatformPulseMetric["iconTone"],
  { icon: LucideIcon; iconWrap: string; iconColor: string; card: string }
> = {
  blue: {
    icon: Users,
    iconWrap: "bg-sky-500/20",
    iconColor: "text-sky-600",
    card: "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white hover:border-sky-300/80 hover:from-sky-100/80 dark:border-sky-500/25 dark:from-sky-500/10 dark:to-surface dark:hover:border-sky-400/40",
  },
  purple: {
    icon: Building2,
    iconWrap: "bg-violet-500/20",
    iconColor: "text-violet-600",
    card: "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white hover:border-violet-300/80 hover:from-violet-100/80 dark:border-violet-500/25 dark:from-violet-500/10 dark:to-surface dark:hover:border-violet-400/40",
  },
  green: {
    icon: Briefcase,
    iconWrap: "bg-success/20",
    iconColor: "text-success",
    card: "border-success/20 bg-gradient-to-br from-success/10 to-white hover:border-success/35 hover:from-success/15 dark:from-success/15 dark:to-surface dark:hover:border-success/45",
  },
  orange: {
    icon: FileText,
    iconWrap: "bg-warning/20",
    iconColor: "text-warning",
    card: "border-warning/25 bg-gradient-to-br from-warning/10 to-white hover:border-warning/40 hover:from-warning/15 dark:from-warning/15 dark:to-surface dark:hover:border-warning/50",
  },
  red: {
    icon: MapPin,
    iconWrap: "bg-rose-500/20",
    iconColor: "text-rose-600",
    card: "border-rose-200/80 bg-gradient-to-br from-rose-50 to-white hover:border-rose-300/80 hover:from-rose-100/80 dark:border-rose-500/25 dark:from-rose-500/10 dark:to-surface dark:hover:border-rose-400/40",
  },
};

function formatMetricValue(value: number | null) {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

function formatTodayChange(value: number | null) {
  const resolved = value ?? 0;
  const sign = resolved > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("en-IN").format(resolved)} today`;
}

interface PlatformPulseSectionProps {
  metrics: PlatformPulseMetric[];
}

export function PlatformPulseSection({ metrics }: PlatformPulseSectionProps) {
  return (
    <section aria-label="Platform pulse">
      <div className="grid grid-cols-2 gap-1.5 max-sm:gap-1.5 sm:gap-3 lg:grid-cols-5">
        {metrics.map((metric) => {
          const config = TONE_CONFIG[metric.iconTone];
          const Icon = config.icon;
          const TrendIcon =
            metric.trendDirection === "down" ? ArrowDownRight : ArrowUpRight;
          const hasTrend = metric.trendPercent != null;
          const todayLabel = formatTodayChange(metric.todayChange);

          return (
            <Link
              key={metric.id}
              to={metric.href}
              className={cn(
                "group flex h-full flex-col rounded-xl border p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:rounded-lg max-sm:p-2 sm:p-3.5",
                config.card,
              )}
            >
              <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                <div className="min-w-0">
                  <p className="text-[18px] font-bold leading-none tracking-tight tabular-nums text-foreground max-sm:text-[17px] sm:text-[22px]">
                    {formatMetricValue(metric.value)}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-muted max-sm:mt-1 max-sm:text-[10px] sm:mt-2 sm:text-[12px]">
                    {metric.label}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex size-7 shrink-0 items-center justify-center rounded-md max-sm:size-7 sm:size-9 sm:rounded-lg",
                    config.iconWrap,
                  )}
                >
                  <Icon
                    className={cn("size-3.5 sm:size-4", config.iconColor)}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </span>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-0.5 pt-2 text-[10px] max-sm:pt-1.5 sm:gap-x-2 sm:pt-3 sm:text-[11px]">
                {hasTrend ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 font-semibold",
                      metric.trendDirection === "down"
                        ? "text-danger"
                        : "text-success",
                    )}
                  >
                    <TrendIcon className="size-2.5 sm:size-3" aria-hidden="true" />
                    {Math.abs(metric.trendPercent!)}%
                  </span>
                ) : null}
                <span className="font-medium text-muted">{todayLabel}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
