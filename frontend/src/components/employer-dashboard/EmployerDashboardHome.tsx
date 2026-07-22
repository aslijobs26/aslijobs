"use client";

import { EmployerJobsStats } from "@/components/employer-jobs/EmployerJobsStats";
import {
  EMPLOYER_DASHBOARD_HOME_SUBTITLE,
  EMPLOYER_DASHBOARD_HOME_TITLE,
  EMPLOYER_DASHBOARD_POST_JOB_CTA,
  EMPLOYER_DASHBOARD_RECENT_JOBS_EMPTY,
  EMPLOYER_DASHBOARD_RECENT_JOBS_TITLE,
  EMPLOYER_DASHBOARD_VIEW_ALL_JOBS,
  EMPLOYER_JOB_STATUS_LABELS,
  EMPLOYER_JOB_STATUS_PILL_CLASS,
  EMPLOYER_JOB_TYPE_LABELS,
  EMPLOYER_JOBS_QUERY_KEYS,
} from "@/constants/employer-jobs";
import { ROUTES } from "@/constants/routes";
import { fetchEmployerJobStats } from "@/services/employer-jobs.service";
import { cn } from "@/utils/cn";
import {
  formatEmployerJobCount,
  formatEmployerJobLocation,
  formatEmployerJobPostedAbsolute,
  getEmployerJobPostedAt,
} from "@/utils/employer-jobs-format";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Plus } from "lucide-react";
import Link from "next/link";

export function EmployerDashboardHome() {
  const statsQuery = useQuery({
    queryKey: EMPLOYER_JOBS_QUERY_KEYS.stats(),
    queryFn: fetchEmployerJobStats,
  });

  const stats = statsQuery.data?.stats;
  const recentJobs = statsQuery.data?.recentJobs ?? [];

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
            {EMPLOYER_DASHBOARD_HOME_TITLE}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            {EMPLOYER_DASHBOARD_HOME_SUBTITLE}
          </p>
        </div>

        <Link
          href={ROUTES.POST_JOB}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-soft px-4 text-sm font-bold text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <Plus className="size-4" aria-hidden="true" strokeWidth={2.5} />
          {EMPLOYER_DASHBOARD_POST_JOB_CTA}
        </Link>
      </header>

      <EmployerJobsStats
        isLoading={statsQuery.isLoading}
        values={
          stats
            ? {
                activeJobs: stats.activeJobs,
                applications: stats.applications,
                shortlisted: stats.shortlisted,
                interviews: stats.interviews,
                hired: stats.hired,
                views: stats.views,
              }
            : undefined
        }
      />

      <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3.5 sm:px-5">
          <h2 className="text-base font-bold text-foreground">
            {EMPLOYER_DASHBOARD_RECENT_JOBS_TITLE}
          </h2>
          <Link
            href={ROUTES.EMPLOYER_JOBS}
            className="text-sm font-semibold text-primary-soft transition-colors hover:text-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {EMPLOYER_DASHBOARD_VIEW_ALL_JOBS}
          </Link>
        </div>

        {statsQuery.isLoading ? (
          <div className="space-y-3 px-4 py-5 sm:px-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-lg bg-border-subtle"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : statsQuery.isError ? (
          <div className="px-4 py-12 text-center sm:px-5">
            <p className="text-sm font-semibold text-foreground">
              Unable to load dashboard data
            </p>
            <button
              type="button"
              onClick={() => {
                void statsQuery.refetch();
              }}
              className="mt-3 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary-soft transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Try again
            </button>
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-12 text-center sm:px-5">
            <span
              className="inline-flex size-11 items-center justify-center rounded-full bg-primary-light text-primary-soft"
              aria-hidden="true"
            >
              <Briefcase className="size-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-foreground">
              {EMPLOYER_DASHBOARD_RECENT_JOBS_EMPTY}
            </p>
            <Link
              href={ROUTES.POST_JOB}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary-soft px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {EMPLOYER_DASHBOARD_POST_JOB_CTA}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {recentJobs.map((job) => {
              const location = formatEmployerJobLocation(
                job.cityName,
                job.stateName,
                job.city,
                job.state,
              );

              return (
                <li key={job.id}>
                  <Link
                    href={ROUTES.EMPLOYER_JOBS}
                    className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-hero-bg/50 focus-visible:bg-hero-bg/50 focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {job.jobTitle}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {job.jobType
                          ? EMPLOYER_JOB_TYPE_LABELS[job.jobType]
                          : "—"}{" "}
                        · {location} ·{" "}
                        {formatEmployerJobPostedAbsolute(
                          getEmployerJobPostedAt(job),
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                      <span className="text-xs text-muted">
                        {formatEmployerJobCount(job.applications)} applications
                      </span>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          EMPLOYER_JOB_STATUS_PILL_CLASS[job.status],
                        )}
                      >
                        {EMPLOYER_JOB_STATUS_LABELS[job.status]}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
