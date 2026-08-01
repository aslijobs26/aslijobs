"use client";

import { Can } from "@/components/rbac/Can";
import {
  EMPLOYER_JOB_STATUS_LABELS,
  EMPLOYER_JOB_STATUS_PILL_CLASS,
} from "@/constants/employer-jobs";
import { ROUTES } from "@/constants/routes";
import { useCan } from "@/providers/employer-permission-provider";
import type { EmployerJobListItem } from "@/types/employer-jobs";
import { cn } from "@/utils/cn";
import {
  formatEmployerJobCount,
  formatEmployerJobLocation,
} from "@/utils/employer-jobs-format";
import {
  buildAbsolutePublicJobUrl,
  shareOrCopyText,
} from "@/utils/share-job";
import { Eye, Pencil, Share2, Trash2 } from "lucide-react";
import Link from "next/link";

type DashboardJobsOverviewProps = {
  jobs: EmployerJobListItem[];
  isLoading?: boolean;
  isError?: boolean;
  isDeleting?: boolean;
  onRetry?: () => void;
  onDelete?: (jobId: string) => void;
};

export function DashboardJobsOverview({
  jobs,
  isLoading = false,
  isError = false,
  isDeleting = false,
  onRetry,
  onDelete,
}: DashboardJobsOverviewProps) {
  const { can } = useCan();
  const canUpdateJobs = can("jobs", "update");
  const canDeleteJobs = can("jobs", "delete");
  const canCreateJobs = can("jobs", "create");

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3.5 sm:px-5">
        <h2 className="text-base font-bold text-foreground">Jobs Overview</h2>
        <Can module="jobs" action="read">
          <Link
            href={ROUTES.EMPLOYER_JOBS}
            className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            View All
          </Link>
        </Can>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-4 sm:p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-lg bg-hero-bg"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="px-4 py-10 text-center sm:px-5">
          <p className="text-sm font-semibold text-foreground">
            Unable to load jobs
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle px-4 text-sm font-semibold text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !isError && jobs.length === 0 ? (
        <div className="px-4 py-10 text-center sm:px-5">
          <p className="text-sm font-semibold text-foreground">No jobs yet</p>
          <p className="mt-1 text-xs text-muted">
            Post your first job to start hiring.
          </p>
          {canCreateJobs ? (
            <Link
              href={ROUTES.POST_JOB}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Post New Job
            </Link>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !isError && jobs.length > 0 ? (
        <div className="overflow-x-auto scrollbar-hidden">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-subtle bg-hero-bg/70">
                {[
                  "Job",
                  "Status",
                  "Applications",
                  "Shortlisted",
                  "Hired",
                  "Views",
                  "Actions",
                ].map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="whitespace-nowrap px-3 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted first:pl-4 last:pr-4 sm:px-4"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {jobs.map((job) => {
                const location = formatEmployerJobLocation(
                  job.cityName,
                  job.stateName,
                  job.city,
                  job.state,
                );
                const publicUrl = buildAbsolutePublicJobUrl(job.jobId);

                return (
                  <tr
                    key={job.id}
                    className="transition-colors hover:bg-hero-bg/40"
                  >
                    <td className="px-3 py-3 first:pl-4 sm:px-4">
                      <p className="max-w-[12rem] truncate text-sm font-semibold text-foreground">
                        {job.jobTitle}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {location}
                      </p>
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold",
                          EMPLOYER_JOB_STATUS_PILL_CLASS[job.status],
                        )}
                      >
                        {EMPLOYER_JOB_STATUS_LABELS[job.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold tabular-nums text-foreground sm:px-4">
                      {formatEmployerJobCount(job.applications)}
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold tabular-nums text-foreground sm:px-4">
                      {formatEmployerJobCount(job.shortlisted)}
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold tabular-nums text-foreground sm:px-4">
                      {formatEmployerJobCount(job.hired)}
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold tabular-nums text-foreground sm:px-4">
                      {formatEmployerJobCount(job.views)}
                    </td>
                    <td className="px-3 py-3 last:pr-4 sm:px-4">
                      <div className="flex items-center gap-1">
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          aria-label={`View ${job.jobTitle}`}
                        >
                          <Eye className="size-4" aria-hidden="true" />
                        </a>
                        {canUpdateJobs ? (
                          <Link
                            href={`${ROUTES.POST_JOB}/${job.id}`}
                            className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                            aria-label={`Edit ${job.jobTitle}`}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            void shareOrCopyText({
                              url: publicUrl,
                              title: job.jobTitle,
                              text: `Hiring for ${job.jobTitle} on AsliJobs`,
                              successMessage: "Job link copied.",
                            });
                          }}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          aria-label={`Share ${job.jobTitle}`}
                        >
                          <Share2 className="size-4" aria-hidden="true" />
                        </button>
                        {canDeleteJobs ? (
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => onDelete?.(job.id)}
                            className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-pin-state focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
                            aria-label={`Delete ${job.jobTitle}`}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
