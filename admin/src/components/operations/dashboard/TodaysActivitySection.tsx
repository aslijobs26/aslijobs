import {
  Activity,
  Briefcase,
  Building2,
  FileText,
  MapPin,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type { TodaysActivityMetric } from "../../../types/operations-dashboard";
import { OperationsCard } from "../../ui/OperationsCard";
import { cn } from "../../../utils/cn";

interface TodaysActivitySectionProps {
  metrics: TodaysActivityMetric[];
}

const METRIC_STYLE: Record<
  string,
  { icon: LucideIcon; wrap: string; color: string }
> = {
  "act-jobseekers": {
    icon: Users,
    wrap: "bg-sky-500/10",
    color: "text-sky-600",
  },
  "act-employers": {
    icon: Building2,
    wrap: "bg-violet-500/10",
    color: "text-violet-600",
  },
  "act-jobs": {
    icon: Briefcase,
    wrap: "bg-success/10",
    color: "text-success",
  },
  "act-applications": {
    icon: FileText,
    wrap: "bg-warning/10",
    color: "text-warning",
  },
  "act-placements": {
    icon: MapPin,
    wrap: "bg-rose-500/10",
    color: "text-rose-600",
  },
};

function formatValue(value: number | null) {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

export function TodaysActivitySection({
  metrics,
}: TodaysActivitySectionProps) {
  return (
    <OperationsCard
      title="Today's Activity"
      subtitle="Live updates from across the platform"
      className="min-w-0"
      badge={
        <span className="inline-flex size-5 items-center justify-center rounded-md bg-primary-light text-primary">
          <Activity className="size-3" strokeWidth={2} aria-hidden="true" />
        </span>
      }
      bodyClassName="p-2 sm:p-2.5 xl:py-2"
      action={
        <Link
          to={OPERATIONS_ROUTES.ACTIVITY_LOG}
          className="text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          View all →
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-5 xl:gap-2">
        {metrics.map((metric) => {
          const style = METRIC_STYLE[metric.id] ?? METRIC_STYLE["act-jobseekers"];
          const Icon = style.icon;
          return (
            <Link
              key={metric.id}
              to={metric.href}
              className="flex min-h-[3.75rem] items-center gap-2.5 rounded-lg border border-border-subtle bg-hero-bg/30 px-3 py-3 transition-colors hover:border-primary/20 hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:min-h-[4rem] xl:gap-2.5 xl:px-3 xl:py-3.5"
            >
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-md xl:size-7",
                  style.wrap,
                )}
              >
                <Icon
                  className={cn("size-3.5 xl:size-3", style.color)}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </span>
              <span className="min-w-0">
                <span className="block text-[17px] font-bold tabular-nums leading-none text-foreground xl:text-[18px]">
                  {formatValue(metric.value)}
                </span>
                <span className="mt-1 block truncate text-[11px] font-medium text-muted">
                  {metric.label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </OperationsCard>
  );
}
