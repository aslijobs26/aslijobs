"use client";

import { formatSavedCandidateChangePercent } from "@/components/employer-saved-candidates/saved-candidates-utils";
import type { SavedCandidateStats } from "@/types/saved-candidates";
import { cn } from "@/utils/cn";
import { formatEmployerJobCount } from "@/utils/employer-jobs-format";
import {
  Briefcase,
  CalendarCheck,
  PhoneCall,
  Sparkles,
  Users,
} from "lucide-react";

type SavedCandidatesStatsCardsProps = {
  stats: SavedCandidateStats | undefined;
  isLoading: boolean;
};

type KpiConfig = {
  key: keyof SavedCandidateStats;
  changeKey?: keyof SavedCandidateStats;
  label: string;
  icon: typeof Users;
  iconClassName: string;
  cardClassName: string;
  valueClassName: string;
  showChange?: boolean;
};

const KPI_ITEMS: KpiConfig[] = [
  {
    key: "totalSaved",
    label: "Total Shortlisted",
    icon: Users,
    iconClassName: "bg-primary-light text-primary",
    cardClassName:
      "border-primary/20 bg-gradient-to-br from-primary/10 to-white hover:border-primary/35",
    valueClassName: "text-primary",
    showChange: false,
  },
  {
    key: "newThisWeek",
    changeKey: "newThisWeekChangePercent",
    label: "New This Week",
    icon: Sparkles,
    iconClassName: "bg-sky-50 text-sky-600",
    cardClassName:
      "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white hover:border-sky-300",
    valueClassName: "text-sky-700",
    showChange: true,
  },
  {
    key: "contacted",
    changeKey: "contactedChangePercent",
    label: "Contacted",
    icon: PhoneCall,
    iconClassName: "bg-amber-50 text-amber-600",
    cardClassName:
      "border-amber-200/80 bg-gradient-to-br from-amber-50 to-white hover:border-amber-300",
    valueClassName: "text-amber-700",
    showChange: true,
  },
  {
    key: "interviewed",
    changeKey: "interviewedChangePercent",
    label: "Interviewed",
    icon: CalendarCheck,
    iconClassName: "bg-violet-50 text-violet-600",
    cardClassName:
      "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white hover:border-violet-300",
    valueClassName: "text-violet-700",
    showChange: true,
  },
  {
    key: "hired",
    changeKey: "hiredChangePercent",
    label: "Hired",
    icon: Briefcase,
    iconClassName: "bg-emerald-50 text-emerald-700",
    cardClassName:
      "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white hover:border-emerald-300",
    valueClassName: "text-emerald-700",
    showChange: true,
  },
];

function ChangeBadge({
  changePercent,
  className,
}: {
  changePercent: number | null | undefined;
  className?: string;
}) {
  const label = formatSavedCandidateChangePercent(changePercent);
  if (!label) {
    return null;
  }
  const value = changePercent ?? 0;
  return (
    <span
      className={cn(
        "text-[9px] font-semibold leading-none sm:text-[11px]",
        className,
        value > 0 && "text-emerald-600",
        value < 0 && "text-red-600",
        value === 0 && "text-muted",
      )}
    >
      {label} vs last week
    </span>
  );
}

export function SavedCandidatesStatsCards({
  stats,
  isLoading,
}: SavedCandidatesStatsCardsProps) {
  return (
    <section
      aria-label="Shortlisted candidate statistics"
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5"
    >
      {KPI_ITEMS.map((item) => {
        const Icon = item.icon;
        const value = stats?.[item.key];
        const changeValue =
          item.changeKey && stats
            ? (stats[item.changeKey] as number | null | undefined)
            : null;

        return (
          <article
            key={item.key}
            className={cn(
              "flex min-h-[5rem] min-w-0 flex-col rounded-xl border px-2.5 py-2 shadow-sm transition-[border-color,box-shadow] hover:shadow-md sm:min-h-[5.5rem] sm:px-3 sm:py-2.5 lg:min-h-0 lg:rounded-lg lg:px-2.5 lg:py-2 max-sm:min-h-[6.75rem] max-sm:px-3.5 max-sm:py-3 max-sm:shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
              item.cardClassName,
            )}
          >
            <div className="order-1 flex items-center justify-between gap-1.5 sm:gap-2">
              <span
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-lg sm:size-7 lg:size-6 max-sm:size-8",
                  item.iconClassName,
                )}
                aria-hidden="true"
              >
                <Icon
                  className="size-3 sm:size-3.5 lg:size-3 max-sm:size-3.5"
                  strokeWidth={2}
                />
              </span>
              {item.showChange && !isLoading ? (
                <ChangeBadge
                  changePercent={changeValue}
                  className="hidden sm:inline lg:text-[10px]"
                />
              ) : null}
            </div>
            <p
              className={cn(
                "order-2 mt-1.5 text-lg font-bold leading-none tracking-tight sm:mt-2 sm:text-2xl lg:mt-1 lg:text-base max-sm:order-3 max-sm:mt-auto max-sm:pt-1 max-sm:text-lg",
                item.valueClassName,
              )}
            >
              {isLoading ? (
                <span className="inline-block h-5 w-7 animate-pulse rounded bg-primary-light/50 sm:h-7 sm:w-9 lg:h-5 lg:w-7" />
              ) : (
                formatEmployerJobCount(typeof value === "number" ? value : 0)
              )}
            </p>
            <p className="order-3 mt-1 break-words text-[10px] font-semibold leading-tight text-muted sm:mt-1.5 sm:text-xs lg:mt-0.5 lg:text-[10px] max-sm:order-2 max-sm:mt-2 max-sm:font-medium">
              {item.label}
            </p>
            {item.showChange && !isLoading ? (
              <ChangeBadge
                changePercent={changeValue}
                className="order-4 mt-1 sm:hidden"
              />
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
