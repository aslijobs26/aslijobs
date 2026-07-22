"use client";

import {
  JOB_POSTED_SUCCESS_APPLICATIONS_SUFFIX,
  JOB_POSTED_SUCCESS_META_APPLICATIONS,
  JOB_POSTED_SUCCESS_META_JOB_TYPE,
  JOB_POSTED_SUCCESS_META_POSTED_ON,
  JOB_POSTED_SUCCESS_META_VISIBILITY,
  JOB_POSTED_SUCCESS_STATUS_ACTIVE,
} from "@/constants/job-posted-success";
import type { JobPostedSuccessSummary } from "@/types/job-posted-success";
import { formatJobPostedSuccessDate } from "@/utils/build-job-posted-success-summary";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  Eye,
  MapPin,
  Users,
} from "lucide-react";

type JobPostedSuccessSummaryCardProps = {
  summary: JobPostedSuccessSummary;
};

export function JobPostedSuccessSummaryCard({
  summary,
}: JobPostedSuccessSummaryCardProps) {
  const statusLabel =
    summary.status === "active"
      ? JOB_POSTED_SUCCESS_STATUS_ACTIVE
      : summary.status.charAt(0).toUpperCase() + summary.status.slice(1);

  const metaItems = [
    {
      id: "posted-on",
      label: JOB_POSTED_SUCCESS_META_POSTED_ON,
      value: formatJobPostedSuccessDate(summary.publishedAt),
      icon: CalendarDays,
    },
    {
      id: "job-type",
      label: JOB_POSTED_SUCCESS_META_JOB_TYPE,
      value: summary.jobTypeLabel,
      icon: Clock3,
    },
    {
      id: "applications",
      label: JOB_POSTED_SUCCESS_META_APPLICATIONS,
      value: `${summary.applications} ${JOB_POSTED_SUCCESS_APPLICATIONS_SUFFIX}`,
      icon: Users,
    },
    {
      id: "visibility",
      label: JOB_POSTED_SUCCESS_META_VISIBILITY,
      value: summary.visibility,
      icon: Eye,
    },
  ] as const;

  return (
    <article className="job-posted-success-fade-up job-posted-success-fade-up-delay-1 w-full rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary sm:size-12">
          <BriefcaseBusiness className="size-5 sm:size-6" strokeWidth={2} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-foreground sm:text-lg">
              {summary.jobTitle}
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">
              <span
                className="size-1.5 rounded-full bg-primary-soft"
                aria-hidden="true"
              />
              {statusLabel}
            </span>
          </div>

          <ul className="mt-2.5 flex flex-col gap-2 text-sm text-muted sm:mt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
            <li className="inline-flex min-w-0 items-center gap-1.5">
              <Building2 className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
              <span className="truncate">{summary.companyName}</span>
            </li>
            <li className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
              <span className="truncate">{summary.location}</span>
            </li>
            <li className="inline-flex min-w-0 items-center gap-1.5">
              <span className="truncate">{summary.salaryLabel}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4 border-t border-border-subtle pt-4 sm:mt-5 sm:pt-5">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-0">
          {metaItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={
                  index > 0
                    ? "sm:border-l sm:border-border-subtle sm:px-4 lg:px-5"
                    : "sm:pr-4 lg:pr-5"
                }
              >
                <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                  <Icon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm font-bold text-foreground">
                  {item.value}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </article>
  );
}
