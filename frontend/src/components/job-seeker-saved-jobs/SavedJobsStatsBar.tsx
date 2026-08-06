"use client";

import type { SavedJobsStats, SavedJobsStatsFilter } from "@/types/saved-jobs";
import { cn } from "@/utils/cn";
import { SAVED_JOBS_STATS_TABS, statsTabToneClasses } from "./saved-jobs-utils";

type SavedJobsStatsBarProps = {
  activeFilter: SavedJobsStatsFilter;
  stats: SavedJobsStats | undefined;
  isLoading: boolean;
  onChange: (filter: SavedJobsStatsFilter) => void;
};

export function SavedJobsStatsBar({
  activeFilter,
  stats,
  isLoading,
  onChange,
}: SavedJobsStatsBarProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden"
      role="tablist"
      aria-label="Saved jobs filters"
    >
      {SAVED_JOBS_STATS_TABS.map((tab) => {
        const count = stats?.[tab.statsKey];
        const isActive = activeFilter === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold ring-1 ring-inset transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              statsTabToneClasses(tab.tone, isActive),
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums leading-none",
                isActive
                  ? "bg-surface/80 text-current"
                  : "bg-current/10 text-current",
                isLoading && "animate-pulse",
              )}
            >
              {typeof count === "number" ? count : 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
