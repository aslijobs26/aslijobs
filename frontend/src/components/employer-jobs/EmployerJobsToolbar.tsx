"use client";

import {
  EMPLOYER_JOB_STATUS_LABELS,
  EMPLOYER_JOBS_FILTERS_LABEL,
  EMPLOYER_JOBS_SEARCH_PLACEHOLDER,
  EMPLOYER_JOBS_STATUS_TABS,
  type EmployerJobsStatusTabId,
} from "@/constants/employer-jobs";
import type { EmployerJobCounts } from "@/types/employer-jobs";
import { cn } from "@/utils/cn";
import { Filter, Search } from "lucide-react";

type EmployerJobsToolbarProps = {
  activeTab: EmployerJobsStatusTabId;
  counts?: EmployerJobCounts;
  searchValue: string;
  onTabChange: (tab: EmployerJobsStatusTabId) => void;
  onSearchChange: (value: string) => void;
};

function getTabCount(
  tab: EmployerJobsStatusTabId,
  counts?: EmployerJobCounts,
): number | undefined {
  if (!counts) {
    return undefined;
  }
  return counts[tab];
}

export function EmployerJobsToolbar({
  activeTab,
  counts,
  searchValue,
  onTabChange,
  onSearchChange,
}: EmployerJobsToolbarProps) {
  return (
    <section
      aria-label="Job filters"
      className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-3"
    >
      <div
        role="tablist"
        aria-label="Filter jobs by status"
        className="flex min-w-0 flex-wrap items-center gap-1.5"
      >
        {EMPLOYER_JOBS_STATUS_TABS.map((tab) => {
          const isActive = tab === activeTab;
          const count = getTabCount(tab, counts);
          const label = EMPLOYER_JOB_STATUS_LABELS[tab];

          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={
                count === undefined ? label : `${label}, ${count}`
              }
              onClick={() => onTabChange(tab)}
              className={cn(
                "inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isActive
                  ? "border-primary-soft bg-primary-light text-primary-soft"
                  : "border-border bg-surface text-muted hover:border-primary-soft/40 hover:bg-primary-light/50 hover:text-foreground",
              )}
            >
              <span>{label}</span>
              {count !== undefined ? (
                <span
                  className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums",
                    isActive
                      ? "bg-primary-soft/15 text-primary-soft"
                      : "bg-hero-bg text-muted",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex w-full shrink-0 items-center gap-2 lg:w-auto">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Filters coming soon"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-muted opacity-70"
        >
          <Filter className="size-3.5" aria-hidden="true" strokeWidth={2} />
          {EMPLOYER_JOBS_FILTERS_LABEL}
        </button>

        <label className="relative min-w-0 flex-1 lg:w-[17.5rem] lg:flex-none">
          <span className="sr-only">Search jobs</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted"
            aria-hidden="true"
            strokeWidth={2}
          />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={EMPLOYER_JOBS_SEARCH_PLACEHOLDER}
            className="h-10 w-full rounded-lg border border-border bg-surface py-2 pr-3 pl-9 text-sm text-foreground placeholder:text-muted/80 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </label>
      </div>
    </section>
  );
}
