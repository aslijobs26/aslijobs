"use client";

import { JOB_SEARCH_SORT_OPTIONS } from "@/constants/job-search";
import type { PublicJobSort } from "@/services/public-jobs.service";
import { ChevronDown } from "lucide-react";

type JobSearchResultsHeaderProps = {
  total: number;
  locationLabel: string;
  sort: PublicJobSort;
  onSortChange: (sort: PublicJobSort) => void;
};

export function JobSearchResultsHeader({
  total,
  locationLabel,
  sort,
  onSortChange,
}: JobSearchResultsHeaderProps) {
  const formattedTotal = total.toLocaleString("en-IN");
  const title = locationLabel
    ? `${formattedTotal} jobs found in ${locationLabel}`
    : `${formattedTotal} jobs found`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-base font-bold text-foreground sm:text-lg">{title}</h2>
      <label className="relative hidden items-center gap-2 text-sm text-muted md:inline-flex">
        <span className="shrink-0 font-medium">Sort by:</span>
        <select
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as PublicJobSort)
          }
          className="h-10 appearance-none rounded-lg border border-border bg-surface py-2 pr-9 pl-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {JOB_SEARCH_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 size-4 text-foreground/70"
          strokeWidth={2}
          aria-hidden="true"
        />
      </label>
    </div>
  );
}
