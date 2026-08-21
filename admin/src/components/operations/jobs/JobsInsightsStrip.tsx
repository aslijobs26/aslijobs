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
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3 xl:grid-cols-5">
      {insights.map((insight) => {
        const visual = ICON_BY_ID[insight.id] ?? {
          icon: FileText,
          wrap: "bg-primary-light",
          color: "text-primary",
        };
        const Icon = visual.icon;

        return (
          <article
            key={insight.id}
            className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2 py-2 shadow-sm sm:gap-2 sm:px-2.5"
          >
            <span
              className={cn(
                "inline-flex size-7 shrink-0 items-center justify-center rounded-md sm:size-8",
                visual.wrap,
              )}
            >
              <Icon className={cn("size-3.5", visual.color)} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] text-muted sm:text-[11px]">
                {insight.label}
              </p>
              <p className="text-sm font-bold leading-none text-foreground sm:text-base">
                {insight.count.toLocaleString("en-IN")}
              </p>
              <button
                type="button"
                onClick={() => onSelect(insight)}
                className="mt-0.5 text-[10px] font-medium text-primary-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                View →
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
