import {
  Ban,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Inbox,
  Star,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { OperationsCandidatesInsight } from "../../../types/operations-candidates";
import { cn } from "../../../utils/cn";

interface CandidatesInsightsStripProps {
  insights: OperationsCandidatesInsight[];
  onSelect: (insight: OperationsCandidatesInsight) => void;
}

const ICON_BY_ID: Record<
  string,
  { icon: LucideIcon; wrap: string; color: string }
> = {
  "new-today": {
    icon: UserPlus,
    wrap: "bg-success/10",
    color: "text-success",
  },
  "registered-7d": {
    icon: CalendarDays,
    wrap: "bg-chart-accent/10",
    color: "text-chart-accent",
  },
  "needs-review": {
    icon: ClipboardList,
    wrap: "bg-warning/10",
    color: "text-warning",
  },
  shortlisted: {
    icon: Star,
    wrap: "bg-chart-accent-alt/10",
    color: "text-chart-accent-alt",
  },
  hired: {
    icon: CheckCircle2,
    wrap: "bg-success/10",
    color: "text-success",
  },
  "no-active-app": {
    icon: Ban,
    wrap: "bg-muted/20",
    color: "text-muted",
  },
  "applications-today": {
    icon: Inbox,
    wrap: "bg-primary-light",
    color: "text-primary",
  },
};

export function CandidatesInsightsStrip({
  insights,
  onSelect,
}: CandidatesInsightsStripProps) {
  return (
    <div className="grid grid-cols-1 gap-2 min-[540px]:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {insights.map((insight) => {
        const visual = ICON_BY_ID[insight.id] ?? {
          icon: ClipboardList,
          wrap: "bg-primary-light",
          color: "text-primary",
        };
        const Icon = visual.icon;

        return (
          <article
            key={insight.id}
            className="flex min-w-0 items-start gap-3 rounded-lg border border-border-subtle bg-surface px-3.5 py-4 shadow-sm sm:px-4 sm:py-5"
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
