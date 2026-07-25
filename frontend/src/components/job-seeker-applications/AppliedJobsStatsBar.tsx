"use client";

import type { SeekerApplicationStats } from "@/types/job-seeker-applications";
import { cn } from "@/utils/cn";
import {
  APPLIED_JOBS_STATS_FILTERS,
  getStatsChipCount,
  type AppliedJobsStatsFilter,
} from "./applied-jobs-utils";

type AppliedJobsStatsBarProps = {
  activeFilter: AppliedJobsStatsFilter;
  stats: SeekerApplicationStats | undefined;
  isLoading: boolean;
  onChange: (filter: AppliedJobsStatsFilter) => void;
};

export function AppliedJobsStatsBar({
  activeFilter,
  stats,
  isLoading,
  onChange,
}: AppliedJobsStatsBarProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      role="tablist"
      aria-label="Application status filters"
    >
      {APPLIED_JOBS_STATS_FILTERS.map((chip) => {
        const count = getStatsChipCount(chip.key, stats);
        const isActive = activeFilter === chip.key;

        return (
          <button
            key={chip.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(chip.key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ring-1 ring-inset transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              isActive
                ? "bg-primary text-surface ring-primary"
                : "bg-surface text-foreground ring-border-subtle hover:bg-primary-light/50",
            )}
          >
            {chip.label}
            {isLoading ? (
              <span className="inline-block h-3 w-4 animate-pulse rounded bg-current/20" />
            ) : typeof count === "number" ? (
              <span className={cn(isActive ? "opacity-90" : "text-muted")}>
                ({count})
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
