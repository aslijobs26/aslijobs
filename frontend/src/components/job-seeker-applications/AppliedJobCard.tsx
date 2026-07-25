"use client";

import { ROUTES } from "@/constants/routes";
import type { SeekerApplicationListItem } from "@/types/job-seeker-applications";
import { APPLICATION_STATUS_LABELS } from "@/types/job-seeker-applications";
import { cn } from "@/utils/cn";
import { Building2, CalendarDays, FileText, MapPin } from "lucide-react";
import Link from "next/link";
import {
  buildQuickSummary,
  formatAppliedDate,
  statusBadgeClasses,
} from "./applied-jobs-utils";

type AppliedJobCardProps = {
  application: SeekerApplicationListItem;
};

export function AppliedJobCard({ application }: AppliedJobCardProps) {
  const href = ROUTES.jobSeekerApplicationDetail(application.id);
  const summary = buildQuickSummary(application);

  return (
    <article className="group relative h-full">
      <Link
        href={href}
        className={cn(
          "flex h-full flex-col rounded-xl border border-border-subtle bg-surface p-4 transition-colors sm:p-5",
          "hover:border-primary/35 hover:bg-primary-light/20",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        )}
        aria-label={`${application.jobTitle} at ${application.companyName || "company"}. Status ${APPLICATION_STATUS_LABELS[application.status]}. View details.`}
      >
        <div className="flex gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary-light/60 ring-1 ring-border-subtle">
            {application.companyLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- employer CDN hosts vary
              <img
                src={application.companyLogoUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <Building2 className="size-5 text-primary" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-foreground">
                  {application.jobTitle}
                </h2>
                <p className="truncate text-sm text-muted">
                  {application.companyName || "Company"}
                </p>
              </div>
              <span className={statusBadgeClasses(application.status)}>
                {APPLICATION_STATUS_LABELS[application.status]}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
          {application.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{application.location}</span>
            </span>
          ) : null}
          <span className="truncate">{application.salaryLabel}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            Applied {formatAppliedDate(application.appliedAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3.5 shrink-0" aria-hidden="true" />
            Resume v{application.resumeVersion}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border-subtle pt-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {summary.headline}
            </p>
            <p className="text-xs text-muted">Updated {summary.timeLabel}</p>
          </div>
          <span className="inline-flex rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-surface transition-colors group-hover:bg-primary-hover">
            View Details
          </span>
        </div>
      </Link>
    </article>
  );
}
