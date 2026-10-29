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
}[] = [
  {
    key: "today",
    label: "Today's Interviews",
    icon: CalendarDays,
    iconClassName: "bg-primary-light text-primary",
  },
  {
    key: "thisWeek",
    label: "This Week",
    icon: Clock3,
    iconClassName: "bg-benefit-verified-surface text-benefit-verified-icon",
  },
  {
    key: "scheduled",
    label: "Scheduled",
    icon: RefreshCw,
    iconClassName: "bg-resource-interview-surface text-resource-interview-icon",
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
    iconClassName: "bg-benefit-whatsapp-surface text-benefit-whatsapp-icon",
  },
];

export function InterviewsKpiStrip({
  stats,
  isLoading,
}: InterviewsKpiStripProps) {
  return (
    <section
      aria-label="Interview statistics"
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3"
    >
      {KPI_ITEMS.map((item) => {
        const Icon = item.icon;
        const value = stats?.[item.key];

        return (
          <article
            key={item.key}
            className="flex min-h-[5rem] min-w-0 flex-col rounded-xl border border-border-subtle bg-surface px-2.5 py-2 shadow-sm transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-md sm:min-h-0 sm:px-3 sm:py-2.5 lg:rounded-lg lg:px-2.5 lg:py-2 max-sm:min-h-[6.75rem] max-sm:px-3.5 max-sm:py-3 max-sm:shadow-[0_1px_2px_rgba(15,23,42,0.04)] max-sm:hover:border-primary/20"
          >
            <span
              className={cn(
                "order-1 inline-flex size-6 shrink-0 items-center justify-center rounded-lg sm:size-7 lg:size-6 max-sm:size-8",
                item.iconClassName,
              )}
              aria-hidden="true"
            >
              <Icon className="size-3 sm:size-3.5 lg:size-3 max-sm:size-3.5" strokeWidth={2} />
            </span>
            <p className="order-2 mt-1.5 text-xl font-bold leading-none tracking-tight text-foreground sm:mt-2 sm:text-2xl lg:mt-1 lg:text-base max-sm:order-3 max-sm:mt-auto max-sm:pt-1 max-sm:text-lg">
              {isLoading ? (
                <span className="inline-block h-6 w-8 animate-pulse rounded bg-primary-light/50 sm:h-7 sm:w-9 lg:h-5 lg:w-7" />
              ) : (
                formatEmployerJobCount(value ?? 0)
              )}
            </p>
            <p className="order-3 mt-1 text-[10px] font-semibold leading-tight text-muted sm:mt-1.5 sm:text-xs lg:mt-0.5 lg:text-[10px] max-sm:order-2 max-sm:mt-2 max-sm:font-medium">
              {item.label}
            </p>
          </article>
        );
      })}
    </section>
  );
}
