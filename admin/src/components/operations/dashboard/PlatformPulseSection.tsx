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
  { icon: LucideIcon; iconWrap: string; iconColor: string }
> = {
  blue: {
    icon: Users,
    iconWrap: "bg-sky-500/10",
    iconColor: "text-sky-600",
  },
  purple: {
    icon: Building2,
    iconWrap: "bg-violet-500/10",
    iconColor: "text-violet-600",
  },
  green: {
    icon: Briefcase,
    iconWrap: "bg-success/10",
    iconColor: "text-success",
  },
  orange: {
    icon: FileText,
    iconWrap: "bg-warning/10",
    iconColor: "text-warning",
  },
  red: {
    icon: MapPin,
    iconWrap: "bg-rose-500/10",
    iconColor: "text-rose-600",
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
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5">
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
              className="group flex h-full flex-col rounded-xl border border-border-subtle bg-surface p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-primary/20 hover:bg-primary-light/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[22px] font-bold leading-none tracking-tight tabular-nums text-foreground">
                    {formatMetricValue(metric.value)}
                  </p>
                  <p className="mt-2 text-[12px] font-medium text-muted">
                    {metric.label}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                    config.iconWrap,
                  )}
                >
                  <Icon
                    className={cn("size-4", config.iconColor)}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </span>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-[11px]">
                {hasTrend ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 font-semibold",
                      metric.trendDirection === "down"
                        ? "text-danger"
                        : "text-success",
                    )}
                  >
                    <TrendIcon className="size-3" aria-hidden="true" />
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
