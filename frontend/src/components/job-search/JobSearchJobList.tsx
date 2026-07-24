"use client";

import { JobSearchJobCard } from "@/components/job-search/JobSearchJobCard";
import { JobSearchListSkeleton } from "@/components/job-search/JobSearchSkeletons";
import type { PublicJobListItem } from "@/services/public-jobs.service";

type JobSearchJobListProps = {
  jobs: PublicJobListItem[];
  selectedJobId: string;
  bookmarkedIds: Set<string>;
  isLoading: boolean;
  isError: boolean;
  emptyMessage?: string;
  onSelect: (jobId: string) => void;
  onToggleBookmark: (jobId: string) => void;
  onRetry: () => void;
  onClearFilters: () => void;
};

export function JobSearchJobList({
  jobs,
  selectedJobId,
  bookmarkedIds,
  isLoading,
  isError,
  emptyMessage,
  onSelect,
  onToggleBookmark,
  onRetry,
  onClearFilters,
}: JobSearchJobListProps) {
  if (isLoading) {
    return <JobSearchListSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface p-6 text-center">
        <h3 className="text-base font-bold text-foreground">
          Unable to load jobs
        </h3>
        <p className="mt-2 text-sm text-muted">
          Something went wrong while fetching jobs. Please try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Retry
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface p-8 text-center">
        <h3 className="text-lg font-bold text-foreground">No Jobs Found</h3>
        <p className="mt-2 text-sm text-muted">
          {emptyMessage ??
            "Try adjusting your search or clearing filters to see more roles."}
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {jobs.map((job) => (
        <li key={job.jobId}>
          <JobSearchJobCard
            job={job}
            selected={selectedJobId === job.jobId}
            bookmarked={bookmarkedIds.has(job.jobId)}
            onSelect={() => onSelect(job.jobId)}
            onToggleBookmark={() => onToggleBookmark(job.jobId)}
          />
        </li>
      ))}
    </ul>
  );
}
