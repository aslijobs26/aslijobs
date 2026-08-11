"use client";

import type { EmployerApplicationStats } from "@/types/employer-applications";
import { cn } from "@/utils/cn";
import { Briefcase, FileText, Star, Users } from "lucide-react";

type CandidatesKpiStripProps = {
  stats: EmployerApplicationStats | undefined;
  isLoading: boolean;
};

const KPI_ITEMS: {
  key: keyof EmployerApplicationStats;
  label: string;
  icon: typeof Users;
  iconClassName: string;
}[] = [
  {
    key: "total",
    label: "Total Candidates",
    icon: Users,
    iconClassName: "bg-primary-light text-primary",
  },
  {
    key: "submitted",
    label: "New Applications",
    icon: FileText,
    iconClassName: "bg-benefit-verified-surface text-benefit-verified-icon",
  },
  {
    key: "shortlisted",
    label: "Shortlisted",
    icon: Star,
    iconClassName: "bg-benefit-free-surface text-benefit-free-icon",
  },
  {
    key: "interview_scheduled",
    label: "Interview Scheduled",
    icon: Briefcase,
    iconClassName: "bg-benefit-languages-surface text-benefit-languages-icon",
  },
];

export function CandidatesKpiStrip({
  stats,
  isLoading,
}: CandidatesKpiStripProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:flex lg:flex-wrap">
      {KPI_ITEMS.map((item) => {
        const Icon = item.icon;
        const value = stats?.[item.key];

        return (
          <div
            key={item.key}
            className={cn(
              "flex h-full min-h-[5rem] flex-col rounded-xl border border-border-subtle bg-surface px-2.5 py-2 shadow-sm transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-md sm:min-h-[5.5rem] sm:px-3 sm:py-2.5",
              "lg:h-auto lg:w-40 lg:max-w-40 lg:min-h-0",
            )}
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
