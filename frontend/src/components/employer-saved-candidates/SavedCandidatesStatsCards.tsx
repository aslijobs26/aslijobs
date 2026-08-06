"use client";

import { formatSavedCandidateChangePercent } from "@/components/employer-saved-candidates/saved-candidates-utils";
import type { SavedCandidateStats } from "@/types/saved-candidates";
import { cn } from "@/utils/cn";
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
  showChange?: boolean;
};

const KPI_ITEMS: KpiConfig[] = [
  {
    key: "totalSaved",
    label: "Total Saved",
    icon: Users,
    iconClassName: "bg-primary-light text-primary",
    showChange: false,
  },
  {
    key: "newThisWeek",
    changeKey: "newThisWeekChangePercent",
    label: "New This Week",
    icon: Sparkles,
    iconClassName: "bg-benefit-verified-surface text-benefit-verified-icon",
    showChange: true,
  },
  {
    key: "contacted",
    changeKey: "contactedChangePercent",
    label: "Contacted",
    icon: PhoneCall,
    iconClassName: "bg-benefit-free-surface text-benefit-free-icon",
    showChange: true,
  },
  {
    key: "interviewed",
    changeKey: "interviewedChangePercent",
    label: "Interviewed",
    icon: CalendarCheck,
    iconClassName: "bg-benefit-languages-surface text-benefit-languages-icon",
    showChange: true,
  },
  {
    key: "hired",
    changeKey: "hiredChangePercent",
    label: "Hired",
    icon: Briefcase,
    iconClassName: "bg-emerald-50 text-emerald-700",
    showChange: true,
  },
];

function ChangeBadge({
  changePercent,
}: {
  changePercent: number | null | undefined;
}) {
  const label = formatSavedCandidateChangePercent(changePercent);
  if (!label) {
    return null;
  }
  const value = changePercent ?? 0;
  return (
    <span
      className={cn(
        "text-[10px] font-semibold leading-none sm:text-[11px]",
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {KPI_ITEMS.map((item) => {
        const Icon = item.icon;
        const value = stats?.[item.key];
        const changeValue =
          item.changeKey && stats
            ? (stats[item.changeKey] as number | null | undefined)
            : null;

        return (
          <div
            key={item.key}
            className={cn(
              "flex min-h-[5.5rem] flex-col rounded-xl border border-border-subtle bg-surface px-3 py-2.5 shadow-sm transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-md",
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
              {item.showChange && !isLoading ? (
                <ChangeBadge changePercent={changeValue} />
              ) : null}
            </div>
            <p className="mt-2 text-xl font-bold leading-none tracking-tight text-foreground sm:text-2xl xl:text-[1.75rem]">
              {isLoading ? (
                <span className="inline-block h-6 w-8 animate-pulse rounded bg-primary-light/50 sm:h-7 sm:w-9" />
              ) : typeof value === "number" ? (
                value
              ) : (
                0
              )}
            </p>
            <p className="mt-1.5 text-[11px] font-semibold leading-tight text-muted sm:text-xs">
              {item.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
