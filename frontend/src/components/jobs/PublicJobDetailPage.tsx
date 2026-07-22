"use client";

import { ROUTES } from "@/constants/routes";
import { fetchPublicActiveJobByPublicId } from "@/services/public-jobs.service";
import { formatEmployerJobLocation } from "@/utils/employer-jobs-format";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

type PublicJobDetailPageProps = {
  publicJobId: string;
};

export function PublicJobDetailPage({ publicJobId }: PublicJobDetailPageProps) {
  const jobQuery = useQuery({
    queryKey: ["public-job", publicJobId],
    queryFn: () => fetchPublicActiveJobByPublicId(publicJobId),
    retry: false,
  });

  const job = jobQuery.data?.job;
  const location = job
    ? formatEmployerJobLocation(
        job.cityName,
        job.stateName,
        job.city,
        job.state,
      )
    : "";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {jobQuery.isLoading ? (
        <p className="text-sm text-muted">Loading job…</p>
      ) : jobQuery.isError || !job ? (
        <section className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
          <h1 className="text-xl font-bold text-foreground">Job unavailable</h1>
          <p className="mt-2 text-sm text-muted">
            This job is not available. It may be closed, paused, expired, or the
            link is invalid.
          </p>
          <Link
            href={ROUTES.HOME}
            className="mt-4 inline-flex text-sm font-semibold text-primary-soft hover:text-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Back to home
          </Link>
        </section>
      ) : (
        <article className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            {job.jobId}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">
            {job.jobTitle}
          </h1>
          <p className="mt-1 text-sm text-muted">{job.companyName}</p>
          <p className="mt-3 text-sm text-foreground">
            {location}
            {job.vacancies ? ` · ${job.vacancies} openings` : null}
          </p>

          <section className="mt-6">
            <h2 className="text-sm font-bold text-foreground">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {job.description}
            </p>
          </section>

          {job.address ? (
            <section className="mt-6">
              <h2 className="text-sm font-bold text-foreground">Address</h2>
              <p className="mt-2 text-sm text-foreground/90">{job.address}</p>
              {job.landmark ? (
                <p className="mt-1 text-sm text-muted">
                  Landmark: {job.landmark}
                </p>
              ) : null}
            </section>
          ) : null}
        </article>
      )}
    </main>
  );
}
