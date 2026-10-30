"use client";

import type { EmployerInterviewStats } from "@/types/employer-interviews";
import { cn } from "@/utils/cn";
import { formatEmployerJobCount } from "@/utils/employer-jobs-format";
import { CalendarDays, CheckCircle2, Clock3, RefreshCw } from "lucide-react";

type InterviewsKpiStripProps = {
  stats: EmployerInterviewStats | undefined;
  isLoading: boolean;
};

const KPI_ITEMS: {
  key: keyof Pick<
    EmployerInterviewStats,
    "today" | "thisWeek" | "scheduled" | "completed" | "rescheduled"
  >;
  label: string;
  icon: typeof CalendarDays;
  iconClassName: string;
  cardClassName: string;
  valueClassName: string;
}[] = [
  {
    key: "today",
    label: "Today's Interviews",
    icon: CalendarDays,
    iconClassName: "bg-primary-light text-primary",
    cardClassName:
      "border-primary/20 bg-gradient-to-br from-primary/10 to-white hover:border-primary/35",
    valueClassName: "text-primary",
  },
  {
    key: "thisWeek",
    label: "This Week",
    icon: Clock3,
    iconClassName: "bg-sky-50 text-sky-600",
    cardClassName:
      "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white hover:border-sky-300",
    valueClassName: "text-sky-700",
  },
  {
    key: "scheduled",
    label: "Scheduled",
    icon: RefreshCw,
    iconClassName: "bg-violet-50 text-violet-600",
    cardClassName:
      "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white hover:border-violet-300",
    valueClassName: "text-violet-700",
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
    iconClassName: "bg-emerald-50 text-emerald-600",
    cardClassName:
      "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white hover:border-emerald-300",
    valueClassName: "text-emerald-700",
  },
];

export function InterviewsKpiStrip({
  stats,
  isLoading,
}: InterviewsKpiStripProps) {
  return (
    <section
      aria-label="Interview statistics"
      className="employer-interviews-kpi grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:gap-2"
    >
      {KPI_ITEMS.map((item) => {
        const Icon = item.icon;
        const value = stats?.[item.key];

        return (
          <article
            key={item.key}
            className={cn(
              "employer-interviews-kpi-card flex min-h-[5rem] min-w-0 flex-col rounded-xl border px-2.5 py-2 shadow-sm transition-[border-color,box-shadow] hover:shadow-md sm:min-h-0 sm:px-3 sm:py-2.5 lg:min-h-0 lg:rounded-lg lg:px-2 lg:py-1.5 max-sm:min-h-[6.75rem] max-sm:px-3.5 max-sm:py-3 max-sm:shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
              item.cardClassName,
            )}
          >
            <span
              className={cn(
                "employer-interviews-kpi-card__icon order-1 inline-flex size-6 shrink-0 items-center justify-center rounded-lg sm:size-7 lg:size-5 max-sm:size-8",
                item.iconClassName,
              )}
              aria-hidden="true"
            >
              <Icon className="size-3 sm:size-3.5 lg:size-2.5 max-sm:size-3.5" strokeWidth={2} />
            </span>
            <p
              className={cn(
                "employer-interviews-kpi-card__value order-2 mt-1.5 text-xl font-bold leading-none tracking-tight sm:mt-2 sm:text-2xl lg:mt-1 lg:text-sm max-sm:order-3 max-sm:mt-auto max-sm:pt-1 max-sm:text-lg",
                item.valueClassName,
              )}
            >
              {isLoading ? (
                <span className="inline-block h-6 w-8 animate-pulse rounded bg-primary-light/50 sm:h-7 sm:w-9 lg:h-3.5 lg:w-5" />
              ) : (
                formatEmployerJobCount(value ?? 0)
              )}
            </p>
            <p className="employer-interviews-kpi-card__label order-3 mt-1 text-[10px] font-semibold leading-tight text-muted sm:mt-1.5 sm:text-xs lg:mt-0.5 lg:text-[0.625rem] max-sm:order-2 max-sm:mt-2 max-sm:font-medium">
              {item.label}
            </p>
          </article>
        );
      })}
    </section>
  );
}
