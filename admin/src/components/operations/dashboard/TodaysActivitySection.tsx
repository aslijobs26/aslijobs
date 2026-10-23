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
      bodyClassName="p-1.5 max-sm:p-1.5 sm:p-2.5 xl:py-2"
      action={
        <Link
          to={OPERATIONS_ROUTES.ACTIVITY_LOG}
          className="text-[11px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-[12px]"
        >
          View all →
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-1.5 max-sm:gap-1.5 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-5 xl:gap-2">
        {metrics.map((metric) => {
          const style = METRIC_STYLE[metric.id] ?? METRIC_STYLE["act-jobseekers"];
          const Icon = style.icon;
          return (
            <Link
              key={metric.id}
              to={metric.href}
              className="flex min-h-[3.25rem] items-center gap-2 rounded-lg border border-border-subtle bg-hero-bg/30 px-2 py-2 transition-colors hover:border-primary/20 hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:min-h-[3rem] sm:min-h-[3.75rem] sm:gap-2.5 sm:px-3 sm:py-3 xl:min-h-[4rem] xl:py-3.5"
            >
              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-md sm:size-8 xl:size-7",
                  style.wrap,
                )}
              >
                <Icon
                  className={cn("size-3 sm:size-3.5 xl:size-3", style.color)}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold tabular-nums leading-none text-foreground max-sm:text-[14px] sm:text-[17px] xl:text-[18px]">
                  {formatValue(metric.value)}
                </span>
                <span className="mt-0.5 block truncate text-[10px] font-medium text-muted sm:mt-1 sm:text-[11px]">
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
