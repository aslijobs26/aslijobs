"use client";

import type { EmployerInterviewStats } from "@/types/employer-interviews";
import { cn } from "@/utils/cn";
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
    <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
      {KPI_ITEMS.map((item) => {
        const Icon = item.icon;
        const value = stats?.[item.key];

        return (
          <div
            key={item.key}
            className="flex min-h-[5rem] w-full flex-col rounded-xl border border-border-subtle bg-surface px-2.5 py-2 shadow-sm transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-md sm:min-h-0 sm:max-w-40 sm:w-40 sm:px-3 sm:py-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-lg sm:size-7",
                  item.iconClassName,
                )}
              >
                <Icon className="size-3 sm:size-3.5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-1.5 text-xl font-bold leading-none tracking-tight text-foreground sm:mt-2 sm:text-2xl">
              {isLoading ? (
                <span className="inline-block h-6 w-8 animate-pulse rounded bg-primary-light/50 sm:h-7 sm:w-9" />
              ) : (
                (value ?? 0)
              )}
            </p>
            <p className="mt-1 text-[10px] font-semibold leading-tight text-muted sm:mt-1.5 sm:text-xs">
              {item.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
