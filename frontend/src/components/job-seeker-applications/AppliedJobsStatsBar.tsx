"use client";

import type { SeekerApplicationStats } from "@/types/job-seeker-applications";
import { cn } from "@/utils/cn";
import {
  APPLIED_JOBS_STATS_FILTERS,
  getStatsChipCount,
  statsChipToneClasses,
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
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden"
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
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold ring-1 ring-inset transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              statsChipToneClasses(chip.tone, isActive),
            )}
          >
            <span>{chip.label}</span>
            {isLoading ? (
              <span
                className="inline-block size-5 shrink-0 animate-pulse rounded-full bg-current/15"
                aria-hidden="true"
              />
            ) : (
              <span
                className={cn(
                  "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums leading-none",
                  isActive
                    ? "bg-surface/80 text-current"
                    : "bg-current/10 text-current",
                )}
                aria-label={`${typeof count === "number" ? count : 0} applications`}
              >
                {typeof count === "number" ? count : "—"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
