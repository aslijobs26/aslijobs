"use client";

import {
  JOB_DETAILS_NEAR_YOU,
  JOB_DETAILS_POPULAR_SEARCHES,
  JOB_DETAILS_RECENTLY_VIEWED,
  type JobDetailsRailJob,
} from "@/constants/job-details-page";
import { ROUTES } from "@/constants/routes";
import {
  fetchSimilarPublicJobs,
  type PublicJobListItem,
} from "@/services/public-jobs.service";
import {
  buildJobSearchLocationLabel,
  createEmptyJobSearchUrlState,
  jobSearchStateToSearchParams,
} from "@/utils/job-search-url";
import { formatJobSearchSalaryCompact } from "@/utils/job-search-format";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Wallet } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const SIMILAR_JOBS_FETCH_LIMIT = 3;

type SimilarJobsSource = {
  jobId: string;
  jobTitle: string;
  city: string;
  state: string;
};

function RailCard({
  title,
  actionHref,
  actionLabel = "View all",
  children,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-[0_1px_4px_rgba(26,43,60,0.04)]">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {actionHref ? (
          <Link
            href={actionHref}
            className="text-[11px] font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function RailJobRow({
  job,
  showSalary = true,
}: {
  job: JobDetailsRailJob;
  showSalary?: boolean;
}) {
  return (
    <Link
      href={job.href}
      className="group flex gap-2.5 rounded-lg px-0.5 py-2 transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <span
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-[10px] font-bold text-primary"
        aria-hidden="true"
      >
        {job.title.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-foreground group-hover:text-primary">
          {job.title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted">
          {job.company}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted">
          {job.meta && !showSalary ? (
            <span>{job.meta}</span>
          ) : (
            <>
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="size-2.5" aria-hidden="true" />
                {job.location}
              </span>
              {showSalary ? (
                <span className="inline-flex items-center gap-0.5">
                  <Wallet className="size-2.5" aria-hidden="true" />
                  {job.salary}
                </span>
              ) : null}
              {job.meta ? <span>{job.meta}</span> : null}
            </>
          )}
        </span>
      </span>
    </Link>
  );
}

function toRailJob(job: PublicJobListItem): JobDetailsRailJob {
  return {
    id: job.jobId,
    title: job.jobTitle,
    company: job.companyName,
    location: buildJobSearchLocationLabel(
      job.cityName,
      job.stateName,
      job.city,
      job.state,
    ),
    salary: formatJobSearchSalaryCompact(job),
    href: ROUTES.jobPublic(job.jobId),
  };
}

function buildSimilarJobsViewAllHref(source: SimilarJobsSource): string {
  const params = jobSearchStateToSearchParams({
    ...createEmptyJobSearchUrlState(),
    q: source.jobTitle.trim(),
    cities: source.city ? [source.city] : [],
    state: source.state || "",
  });
  const query = params.toString();
  return query ? `${ROUTES.FIND_JOBS}?${query}` : ROUTES.FIND_JOBS;
}

function SimilarJobsRailCard({ source }: { source: SimilarJobsSource | null }) {
  const similarQuery = useQuery({
    queryKey: ["public-job-similar", source?.jobId],
    queryFn: ({ signal }) =>
      fetchSimilarPublicJobs(
        source!.jobId,
        { limit: SIMILAR_JOBS_FETCH_LIMIT },
        { signal },
      ),
    enabled: Boolean(source?.jobId),
    retry: false,
  });

  const railJobs =
    similarQuery.data?.jobs
      .filter((job) => job.jobId !== source?.jobId)
      .map(toRailJob) ?? [];

  const viewAllHref = source ? buildSimilarJobsViewAllHref(source) : undefined;
  const showViewAll = Boolean(viewAllHref && railJobs.length > 0);

  return (
    <RailCard
      title="Similar Jobs"
      actionHref={showViewAll ? viewAllHref : undefined}
    >
      {similarQuery.isPending || !source ? (
        <p className="py-2 text-[12px] text-muted">Loading similar jobs…</p>
      ) : similarQuery.isError || railJobs.length === 0 ? (
        <p className="py-2 text-[12px] text-muted">
          No similar jobs available.
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {railJobs.map((job) => (
            <li key={job.id}>
              <RailJobRow job={job} />
            </li>
          ))}
        </ul>
      )}
    </RailCard>
  );
}

type JobDetailsLeftRailProps = {
  job?: SimilarJobsSource | null;
};

export function JobDetailsLeftRail({ job = null }: JobDetailsLeftRailProps) {
  return (
    <aside className="flex flex-col gap-3.5" aria-label="Job discovery">
      <SimilarJobsRailCard source={job} />

      <RailCard title="Recently Viewed">
        <ul className="divide-y divide-border-subtle">
          {JOB_DETAILS_RECENTLY_VIEWED.map((railJob) => (
            <li key={railJob.id}>
              <RailJobRow job={railJob} showSalary={false} />
            </li>
          ))}
        </ul>
      </RailCard>

      <RailCard title="Jobs Near You" actionHref={ROUTES.FIND_JOBS}>
        <ul className="divide-y divide-border-subtle">
          {JOB_DETAILS_NEAR_YOU.map((railJob) => (
            <li key={railJob.id}>
              <RailJobRow job={railJob} />
            </li>
          ))}
        </ul>
      </RailCard>

      <RailCard title="Popular Searches">
        <ul className="flex flex-wrap gap-1.5">
          {JOB_DETAILS_POPULAR_SEARCHES.map((term) => (
            <li key={term}>
              <Link
                href={`${ROUTES.FIND_JOBS}?search=${encodeURIComponent(term)}`}
                className="inline-flex rounded-full border border-border-subtle bg-hero-bg px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-primary/25 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {term}
              </Link>
            </li>
          ))}
        </ul>
      </RailCard>
    </aside>
  );
}
