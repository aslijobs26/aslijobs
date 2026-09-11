import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { PerformanceMetricCardModel } from "./performance-format";
import { cn } from "../../../../utils/cn";

interface MyWorkPerformanceKpiGridProps {
  metrics: PerformanceMetricCardModel[];
}

export function MyWorkPerformanceKpiGrid({
  metrics,
}: MyWorkPerformanceKpiGridProps) {
  return (
    <section
      aria-label="Performance metrics"
      className="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map((metric) => {
        const Icon = metric.Icon;
        const trend = metric.trend;
        return (
          <article
            key={metric.id}
            className={cn(
              "rounded-lg border px-2.5 py-2 shadow-sm",
              metric.cardClassName,
            )}
          >
            <div className="flex items-start justify-between gap-1.5">
              <p className="text-[11px] font-medium leading-tight text-muted">
                {metric.label}
              </p>
              <span
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-full",
                  metric.iconWrapClassName,
                )}
              >
                <Icon
                  className={cn("size-3", metric.iconClassName)}
                  strokeWidth={2}
                  aria-hidden
                />
              </span>
            </div>
            <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-foreground">
              {metric.value}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {trend.direction === "none" ? (
                <span className="text-[10px] font-medium text-muted">
                  {trend.label}
                </span>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1 py-px text-[9px] font-semibold",
                    trend.direction === "up" && "bg-success/10 text-success",
                    trend.direction === "down" && "bg-danger/10 text-danger",
                    trend.direction === "flat" && "bg-border-subtle text-muted",
                  )}
                >
                  {trend.direction === "up" ? (
                    <ArrowUpRight className="size-2.5" aria-hidden />
                  ) : trend.direction === "down" ? (
                    <ArrowDownRight className="size-2.5" aria-hidden />
                  ) : (
                    <Minus className="size-2.5" aria-hidden />
                  )}
                  {trend.label}
                </span>
              )}
              <span className="text-[9px] text-muted">{trend.caption}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
