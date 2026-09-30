"use client";

import { EmployerPostJobLink } from "@/components/post-job/EmployerPostJobLink";
import { Can } from "@/components/rbac/Can";
import {
  EMPLOYER_JOBS_DELETE_UI_ENABLED,
  EMPLOYER_JOB_STATUS_PILL_CLASS,
} from "@/constants/employer-jobs";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
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
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const t = useTranslate();
  const { can } = useCan();
  const canReadJobs = can("jobs", "read");
  const canUpdateJobs = can("jobs", "update");
  const canDeleteJobs =
    EMPLOYER_JOBS_DELETE_UI_ENABLED && can("jobs", "delete");
  const canCreateJobs = can("jobs", "create");

  const openEmployerJobs = () => {
    router.push(ROUTES.EMPLOYER_JOBS);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3.5 sm:px-5">
        <h2 className="min-w-0 break-words text-base font-bold text-foreground">
          {t("employer.dashboard.jobsOverview")}
        </h2>
        <Can module="jobs" action="read">
          <Link
            href={ROUTES.EMPLOYER_JOBS}
            className="shrink-0 text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {t("employer.common.viewAll")}
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
            {t("employer.jobs.errorTitle")}
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle px-4 text-sm font-semibold text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {t("employer.common.tryAgain")}
            </button>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !isError && jobs.length === 0 ? (
        <div className="px-4 py-10 text-center sm:px-5">
          <p className="text-sm font-semibold text-foreground">
            {t("employer.dashboard.noJobsTitle")}
          </p>
          <p className="mt-1 text-xs text-muted">
            {t("employer.dashboard.noJobsDescription")}
          </p>
          {canCreateJobs ? (
            <EmployerPostJobLink className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
              {t("employer.common.postNewJob")}
            </EmployerPostJobLink>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !isError && jobs.length > 0 ? (
        <div className="overflow-x-auto scrollbar-hidden">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-subtle bg-hero-bg/70">
                {(
                  [
                    "employer.columns.job",
                    "employer.columns.status",
                    "employer.columns.applications",
                    "employer.columns.shortlisted",
                    "employer.columns.hired",
                    "employer.columns.views",
                    "employer.columns.actions",
                  ] as const
                ).map((columnKey) => (
                  <th
                    key={columnKey}
                    scope="col"
                    className="whitespace-nowrap px-3 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted first:pl-4 last:pr-4 sm:px-4"
                  >
                    {t(columnKey)}
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
                    className={cn(
                      "transition-colors hover:bg-hero-bg/40",
                      canReadJobs && "cursor-pointer",
                    )}
                    tabIndex={canReadJobs ? 0 : undefined}
                    aria-label={
                      canReadJobs
                        ? t("employer.dashboard.openJobAria", {
                            title: job.jobTitle,
                          })
                        : undefined
                    }
                    onClick={canReadJobs ? openEmployerJobs : undefined}
                    onKeyDown={
                      canReadJobs
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openEmployerJobs();
                            }
                          }
                        : undefined
                    }
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
                      {job.status === "active" &&
                      (job.liveChangeReviewStatus === "pending_approval" ||
                        job.liveChangeReviewStatus === "rejected") ? (
                        <div
                          className={cn(
                            "inline-flex max-w-full flex-col gap-0.5 rounded-lg px-2 py-1 ring-1 ring-inset",
                            job.liveChangeReviewStatus === "pending_approval"
                              ? "bg-amber-50/80 ring-amber-200/80"
                              : "bg-red-50/70 ring-red-200/70",
                          )}
                          title={
                            job.liveChangeReviewStatus === "pending_approval"
                              ? t("employer.jobs.liveChangePendingTitle")
                              : t("employer.jobs.liveChangeRejectedTitle")
                          }
                        >
                          <span
                            className={cn(
                              "inline-flex w-fit rounded-full px-1.5 py-0.5 text-[0.625rem] font-semibold",
                              EMPLOYER_JOB_STATUS_PILL_CLASS.active,
                            )}
                          >
                            {t("employer.status.job.active")}
                          </span>
                          <span
                            className={cn(
                              "text-[0.625rem] font-semibold leading-snug",
                              job.liveChangeReviewStatus === "pending_approval"
                                ? "text-amber-800"
                                : "text-red-700",
                            )}
                          >
                            {job.liveChangeReviewStatus === "pending_approval"
                              ? t("employer.jobs.liveChangePendingShort")
                              : t("employer.jobs.liveChangeRejectedShort")}
                          </span>
                        </div>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex w-fit rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold",
                            EMPLOYER_JOB_STATUS_PILL_CLASS[job.status],
                          )}
                        >
                          {t(`employer.status.job.${job.status}`)}
                        </span>
                      )}
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
                    <td
                      className="px-3 py-3 last:pr-4 sm:px-4"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          aria-label={t("employer.jobs.viewJobAria", {
                            title: job.jobTitle,
                          })}
                        >
                          <Eye className="size-4" aria-hidden="true" />
                        </a>
                        {canUpdateJobs ? (
                          <Link
                            href={`${ROUTES.POST_JOB}/${job.id}`}
                            className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                            aria-label={t("employer.jobs.editJobAria", {
                              title: job.jobTitle,
                            })}
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
                              text: t("employer.jobs.shareText", {
                                title: job.jobTitle,
                              }),
                              successMessage: t("employer.jobs.linkCopied"),
                            });
                          }}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          aria-label={t("employer.jobs.shareJobAria", {
                            title: job.jobTitle,
                          })}
                        >
                          <Share2 className="size-4" aria-hidden="true" />
                        </button>
                        {canDeleteJobs ? (
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => onDelete?.(job.id)}
                            className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-pin-state focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
                            aria-label={t("employer.jobs.deleteJobAria", {
                              title: job.jobTitle,
                            })}
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
