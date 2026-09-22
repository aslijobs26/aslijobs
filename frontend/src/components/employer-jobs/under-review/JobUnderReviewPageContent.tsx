"use client";

import { EmployerAuthGuard } from "@/components/employer-dashboard/EmployerAuthGuard";
import { JobPostedSuccessIcon } from "@/components/job-posted-success/JobPostedSuccessIcon";
import { EMPLOYER_JOBS_QUERY_KEYS } from "@/constants/employer-jobs";
import {
  JOB_UNDER_REVIEW_EDIT_RESUBMIT,
  JOB_UNDER_REVIEW_ERROR_RETRY,
  JOB_UNDER_REVIEW_ERROR_TITLE,
  JOB_UNDER_REVIEW_FIELD_STATUS,
  JOB_UNDER_REVIEW_FIELD_SUBMITTED,
  JOB_UNDER_REVIEW_FIELD_TYPE,
  JOB_UNDER_REVIEW_GO_TO_JOBS,
  JOB_UNDER_REVIEW_LEAD,
  JOB_UNDER_REVIEW_LIVE_CHANGE_LEAD,
  JOB_UNDER_REVIEW_LIVE_CHANGE_TITLE,
  JOB_UNDER_REVIEW_LIVE_LEAD,
  JOB_UNDER_REVIEW_LIVE_TITLE,
  JOB_UNDER_REVIEW_LOADING,
  JOB_UNDER_REVIEW_NOT_FOUND,
  JOB_UNDER_REVIEW_POST_ANOTHER,
  JOB_UNDER_REVIEW_REFRESH,
  JOB_UNDER_REVIEW_REJECTED_LEAD,
  JOB_UNDER_REVIEW_REJECTED_TITLE,
  JOB_UNDER_REVIEW_SLA,
  JOB_UNDER_REVIEW_STATUS_BADGE,
  JOB_UNDER_REVIEW_SUCCESS_TITLE,
  JOB_UNDER_REVIEW_SUMMARY_HEADING,
  JOB_UNDER_REVIEW_TIMELINE_HEADING,
  JOB_UNDER_REVIEW_TIMELINE_LIVE,
  JOB_UNDER_REVIEW_TIMELINE_PENDING,
  JOB_UNDER_REVIEW_TIMELINE_REJECTED,
  JOB_UNDER_REVIEW_VIEW_LIVE,
} from "@/constants/job-under-review";
import { ROUTES } from "@/constants/routes";
import { fetchEmployerJob } from "@/services/employer-jobs.service";
import { getApiErrorMessage } from "@/utils/normalize-api-error";
import { cn } from "@/utils/cn";
import {
  formatEmployerJobEmploymentTypeLabel,
  formatEmployerJobSubmittedAt,
  formatEmployerJobSummaryLocation,
  getEmployerFacingJobStatusLabel,
  resolveEmployerJobUiPhase,
} from "@/utils/employer-job-under-review";
import { useQuery } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  MapPin,
  Plus,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { isAxiosError } from "axios";

type JobUnderReviewPageContentProps = {
  jobMongoId: string;
};

function JobUnderReviewBody({ jobMongoId }: JobUnderReviewPageContentProps) {
  const jobQuery = useQuery({
    queryKey: EMPLOYER_JOBS_QUERY_KEYS.detail(jobMongoId),
    queryFn: () => fetchEmployerJob(jobMongoId),
    enabled: Boolean(jobMongoId.trim()),
    staleTime: 30_000,
    retry: 1,
  });

  if (jobQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <p className="text-sm text-muted">{JOB_UNDER_REVIEW_LOADING}</p>
      </div>
    );
  }

  if (jobQuery.isError || !jobQuery.data?.job) {
    const status = isAxiosError(jobQuery.error)
      ? jobQuery.error.response?.status
      : undefined;
    const message =
      status === 403 || status === 404
        ? JOB_UNDER_REVIEW_NOT_FOUND
        : getApiErrorMessage(jobQuery.error, JOB_UNDER_REVIEW_ERROR_TITLE);

    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-foreground">
          {JOB_UNDER_REVIEW_ERROR_TITLE}
        </h1>
        <p className="text-sm text-muted">{message}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void jobQuery.refetch()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-surface px-5 text-sm font-bold text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <RefreshCw className="size-4" aria-hidden />
            {JOB_UNDER_REVIEW_ERROR_RETRY}
          </button>
          <Link
            href={ROUTES.employerJobsTab("pending_approval")}
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary-soft px-5 text-sm font-bold text-surface transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {JOB_UNDER_REVIEW_GO_TO_JOBS}
          </Link>
        </div>
      </div>
    );
  }

  const job = jobQuery.data.job;
  const phase = resolveEmployerJobUiPhase(job);
  const statusLabel = getEmployerFacingJobStatusLabel(job);
  const location = formatEmployerJobSummaryLocation(job);
  const employmentType = formatEmployerJobEmploymentTypeLabel(job.jobType);
  const submittedAt = formatEmployerJobSubmittedAt(job);

  const heading =
    phase === "live"
      ? JOB_UNDER_REVIEW_LIVE_TITLE
      : phase === "rejected"
        ? JOB_UNDER_REVIEW_REJECTED_TITLE
        : phase === "live_change_review"
          ? JOB_UNDER_REVIEW_LIVE_CHANGE_TITLE
          : JOB_UNDER_REVIEW_SUCCESS_TITLE;

  const lead =
    phase === "live"
      ? JOB_UNDER_REVIEW_LIVE_LEAD
      : phase === "rejected"
        ? JOB_UNDER_REVIEW_REJECTED_LEAD
        : phase === "live_change_review"
          ? JOB_UNDER_REVIEW_LIVE_CHANGE_LEAD
          : JOB_UNDER_REVIEW_LEAD;

  const timeline =
    phase === "live"
      ? JOB_UNDER_REVIEW_TIMELINE_LIVE
      : phase === "rejected"
        ? JOB_UNDER_REVIEW_TIMELINE_REJECTED
        : JOB_UNDER_REVIEW_TIMELINE_PENDING;

  const completedStepIndex =
    phase === "live" ? 2 : phase === "rejected" ? 1 : 1;

  const rejectionReason =
    phase === "rejected"
      ? job.rejectionReason?.trim() ||
        job.liveChangeRejectionReason?.trim() ||
        ""
      : "";

  return (
    <main className="min-h-0 flex-1 bg-hero-bg">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:gap-7 sm:px-6 sm:py-10 lg:gap-8 lg:px-8 lg:py-12">
        <section
          className="flex flex-col items-center text-center"
          aria-labelledby="job-under-review-heading"
        >
          <div className="mb-5 sm:mb-6">
            <JobPostedSuccessIcon />
          </div>

          <h1
            id="job-under-review-heading"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            {heading}
          </h1>

          {(phase === "under_review" || phase === "live_change_review") && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 sm:text-sm">
              <span
                className="size-1.5 rounded-full bg-amber-500"
                aria-hidden
              />
              {JOB_UNDER_REVIEW_STATUS_BADGE}
            </p>
          )}

          <p className="mt-3 max-w-2xl text-sm text-muted sm:mt-4 sm:text-base">
            {lead}
          </p>

          {phase === "under_review" || phase === "live_change_review" ? (
            <p className="mt-2 max-w-2xl text-sm font-medium text-foreground sm:text-base">
              {JOB_UNDER_REVIEW_SLA}
            </p>
          ) : null}

          {rejectionReason ? (
            <p
              className="mt-4 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700"
              role="status"
            >
              {rejectionReason}
            </p>
          ) : null}
        </section>

        <section
          className="w-full rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5 lg:p-6"
          aria-labelledby="job-under-review-summary-heading"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary sm:size-12">
              <BriefcaseBusiness
                className="size-5 sm:size-6"
                strokeWidth={2}
                aria-hidden
              />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted">
                    {JOB_UNDER_REVIEW_SUMMARY_HEADING}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h2
                      id="job-under-review-summary-heading"
                      className="text-base font-bold text-foreground sm:text-lg"
                    >
                      {job.jobTitle || "—"}
                    </h2>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        phase === "live"
                          ? "bg-emerald-50 text-emerald-700"
                          : phase === "rejected"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          phase === "live"
                            ? "bg-emerald-500"
                            : phase === "rejected"
                              ? "bg-red-500"
                              : "bg-amber-500",
                        )}
                        aria-hidden
                      />
                      {statusLabel}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void jobQuery.refetch()}
                  disabled={jobQuery.isFetching}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
                >
                  <RefreshCw
                    className={cn(
                      "size-3.5",
                      jobQuery.isFetching && "animate-spin",
                    )}
                    aria-hidden
                  />
                  {JOB_UNDER_REVIEW_REFRESH}
                </button>
              </div>

              <ul className="mt-2.5 flex flex-col gap-2 text-sm text-muted sm:mt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                <li className="inline-flex min-w-0 items-center gap-1.5">
                  <Building2
                    className="size-3.5 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="truncate">{job.companyName || "—"}</span>
                </li>
                <li className="inline-flex min-w-0 items-center gap-1.5">
                  <MapPin
                    className="size-3.5 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="truncate">{location}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 border-t border-border-subtle pt-4 sm:mt-5 sm:pt-5">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-0">
              <div className="sm:pr-4 lg:pr-5">
                <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                  <Clock3
                    className="size-3.5 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                  {JOB_UNDER_REVIEW_FIELD_TYPE}
                </dt>
                <dd className="mt-1 text-sm font-bold text-foreground">
                  {employmentType}
                </dd>
              </div>
              <div className="sm:border-l sm:border-border-subtle sm:px-4 lg:px-5">
                <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                  {JOB_UNDER_REVIEW_FIELD_STATUS}
                </dt>
                <dd className="mt-1 text-sm font-bold text-foreground">
                  {statusLabel}
                </dd>
              </div>
              <div className="sm:border-l sm:border-border-subtle sm:px-4 lg:px-5">
                <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                  <CalendarDays
                    className="size-3.5 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                  {JOB_UNDER_REVIEW_FIELD_SUBMITTED}
                </dt>
                <dd className="mt-1 text-sm font-bold text-foreground">
                  {submittedAt}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section
          className="w-full rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5 lg:p-6"
          aria-labelledby="job-under-review-timeline-heading"
        >
          <h2
            id="job-under-review-timeline-heading"
            className="text-base font-bold text-foreground sm:text-lg"
          >
            {JOB_UNDER_REVIEW_TIMELINE_HEADING}
          </h2>
          <ol className="mt-4 space-y-4">
            {timeline.map((step, index) => {
              const done = index < completedStepIndex;
              const current = index === completedStepIndex && phase !== "live";
              return (
                <li key={step.id} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full",
                      done || phase === "live"
                        ? "bg-emerald-100 text-emerald-700"
                        : current
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500",
                    )}
                    aria-hidden
                  >
                    {done || phase === "live" ? (
                      <CheckCircle2 className="size-4" strokeWidth={2} />
                    ) : (
                      <Circle className="size-3.5" strokeWidth={2} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {index + 1}. {step.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted sm:text-sm">
                      {step.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
          <Link
            href={
              phase === "under_review" || phase === "live_change_review"
                ? ROUTES.employerJobsTab("pending_approval")
                : phase === "rejected"
                  ? ROUTES.employerJobsTab("rejected")
                  : phase === "live"
                    ? ROUTES.employerJobsTab("active")
                    : ROUTES.EMPLOYER_JOBS
            }
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-5 text-sm font-bold text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-12 sm:w-auto"
          >
            <BriefcaseBusiness className="size-4" aria-hidden />
            {JOB_UNDER_REVIEW_GO_TO_JOBS}
          </Link>

          {phase === "rejected" ? (
            <Link
              href={ROUTES.postJobEdit(job.id)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary-soft px-5 text-sm font-bold text-surface transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-12 sm:w-auto"
            >
              {JOB_UNDER_REVIEW_EDIT_RESUBMIT}
            </Link>
          ) : null}

          {phase === "live" && job.jobId ? (
            <Link
              href={ROUTES.jobPublic(job.jobId)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary-soft px-5 text-sm font-bold text-surface transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-12 sm:w-auto"
            >
              {JOB_UNDER_REVIEW_VIEW_LIVE}
            </Link>
          ) : null}

          <Link
            href={ROUTES.POST_JOB}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-primary-soft/40 bg-primary-light px-5 text-sm font-bold text-primary transition-colors hover:bg-primary-light/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-12 sm:w-auto"
          >
            <Plus className="size-4" aria-hidden />
            {JOB_UNDER_REVIEW_POST_ANOTHER}
          </Link>
        </div>
      </div>
    </main>
  );
}

export function JobUnderReviewPageContent({
  jobMongoId,
}: JobUnderReviewPageContentProps) {
  return (
    <EmployerAuthGuard>
      <JobUnderReviewBody jobMongoId={jobMongoId} />
    </EmployerAuthGuard>
  );
}
