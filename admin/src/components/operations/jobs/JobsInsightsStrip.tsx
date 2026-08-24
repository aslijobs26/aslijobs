import {
  Ban,
  CalendarDays,
  FileText,
  TrendingDown,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { OperationsJobsInsight } from "../../../types/operations-jobs";
import { cn } from "../../../utils/cn";

interface JobsInsightsStripProps {
  insights: OperationsJobsInsight[];
  onSelect: (insight: OperationsJobsInsight) => void;
}

const ICON_BY_ID: Record<string, { icon: LucideIcon; wrap: string; color: string }> = {
  "expiring-soon": {
    icon: CalendarDays,
    wrap: "bg-warning/10",
    color: "text-warning",
  },
  "low-applications": {
    icon: TrendingDown,
    wrap: "bg-chart-accent/10",
    color: "text-chart-accent",
  },
  "pending-payment": {
    icon: Wallet,
    wrap: "bg-danger/10",
    color: "text-danger",
  },
  "inactive-30": {
    icon: Ban,
    wrap: "bg-muted/20",
    color: "text-muted",
  },
  drafts: {
    icon: FileText,
    wrap: "bg-primary-light",
    color: "text-primary",
  },
};

export function JobsInsightsStrip({ insights, onSelect }: JobsInsightsStripProps) {
  const hasTrailingSingleOnTwoCol =
    insights.length % 2 === 1 && insights.length > 1;

  return (
    <div className="grid grid-cols-1 gap-2 min-[540px]:grid-cols-2 xl:grid-cols-5">
      {insights.map((insight, index) => {
        const visual = ICON_BY_ID[insight.id] ?? {
          icon: FileText,
          wrap: "bg-primary-light",
          color: "text-primary",
        };
        const Icon = visual.icon;
        const isTrailingSingle =
          hasTrailingSingleOnTwoCol && index === insights.length - 1;

        return (
          <article
            key={insight.id}
            className={cn(
              "flex min-w-0 items-start gap-3 rounded-lg border border-border-subtle bg-surface px-3.5 py-4 shadow-sm sm:px-4 sm:py-5",
              isTrailingSingle && "min-[540px]:col-span-2 xl:col-span-1",
            )}
          >
            <span
              className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-md",
                visual.wrap,
              )}
            >
              <Icon className={cn("size-4", visual.color)} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] leading-snug text-muted sm:text-xs">
                {insight.label}
              </p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
                <p className="text-base font-bold leading-none text-foreground sm:text-lg">
                  {insight.count.toLocaleString("en-IN")}
                </p>
                <button
                  type="button"
                  onClick={() => onSelect(insight)}
                  className="shrink-0 text-[11px] font-medium text-primary-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  View →
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
