import { BadgeCheck, CalendarDays, MapPin, Users } from "lucide-react";
import { OperationsBadge } from "../../ui/OperationsBadge";
import { EmployerLogo } from "../../ui/EmployerLogo";
import type {
  OperationsJobListItem,
  OperationsJobStatusAction,
} from "../../../types/operations-jobs";
import { cn } from "../../../utils/cn";
import { JobsRowActions } from "./JobsRowActions";

interface JobsMobileJobCardProps {
  job: OperationsJobListItem;
  pendingStatusJobId?: string | null;
  onStatusAction?: (
    job: OperationsJobListItem,
    action: OperationsJobStatusAction,
  ) => void;
  formatJobType: (jobType: string) => string;
  formatPostedDate: (iso: string | null) => { date: string; time: string };
  statusBadgeVariant: (
    status: OperationsJobListItem["status"],
  ) => "default" | "high" | "medium" | "low" | "job";
  paymentBadgeClass: (
    status: OperationsJobListItem["listingPaymentStatus"],
  ) => string;
}

export function JobsMobileJobCard({
  job,
  pendingStatusJobId,
  onStatusAction,
  formatJobType,
  formatPostedDate,
  statusBadgeVariant,
  paymentBadgeClass,
}: JobsMobileJobCardProps) {
  const posted = formatPostedDate(job.publishedAt ?? job.createdAt);
  const showVerified =
    job.employer.isWhatsappVerified || job.employer.registrationCompleted;

  return (
    <article className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="border-b border-border-subtle/80 bg-hero-bg/35 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-sm font-semibold leading-snug text-foreground">
                {job.jobTitle}
              </h3>
              {job.isFeatured ? (
                <OperationsBadge
                  variant="default"
                  className="shrink-0 px-1.5 py-0 text-[9px]"
                >
                  Featured
                </OperationsBadge>
              ) : null}
            </div>
            <p className="mt-1 font-mono text-[10px] font-medium tracking-wide text-muted">
              {job.jobId}
              <span className="mx-1.5 text-border-subtle" aria-hidden="true">
                ·
              </span>
              {formatJobType(job.jobType)}
            </p>
          </div>
          <JobsRowActions
            job={job}
            pendingStatusJobId={pendingStatusJobId}
            onStatusAction={onStatusAction}
          />
        </div>
      </div>

      <div className="space-y-3 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <EmployerLogo
            name={job.employer.companyName}
            logoUrl={job.employer.logoUrl}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-xs font-semibold text-foreground">
              <span className="truncate">{job.employer.companyName}</span>
              {showVerified ? (
                <BadgeCheck
                  className="size-3.5 shrink-0 text-chart-accent"
                  aria-label="Verified employer"
                />
              ) : null}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-medium tabular-nums text-muted">
              {job.vacancies.toLocaleString("en-IN")} vacancies
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <OperationsBadge
            variant={statusBadgeVariant(job.status)}
            className="px-2 py-0.5 text-[10px]"
          >
            {job.isLiveChangeReview
              ? "Edited Live Job"
              : job.status === "pending_approval"
                ? "Pending"
                : job.statusLabel}
          </OperationsBadge>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
              paymentBadgeClass(job.listingPaymentStatus),
            )}
          >
            {job.paymentStatusLabel}
          </span>
        </div>

        <dl className="grid grid-cols-3 gap-1.5">
          <div className="min-w-0 rounded-lg bg-hero-bg/60 px-2 py-2">
            <dt className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-muted">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              Location
            </dt>
            <dd className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-foreground">
              {job.locationLabel || "—"}
            </dd>
          </div>
          <div className="min-w-0 rounded-lg bg-hero-bg/60 px-2 py-2">
            <dt className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-muted">
              <CalendarDays className="size-3 shrink-0" aria-hidden="true" />
              Posted
            </dt>
            <dd className="mt-1 text-[11px] font-medium leading-snug text-foreground">
              {posted.date}
            </dd>
            {posted.time ? (
              <dd className="text-[10px] leading-snug text-muted">{posted.time}</dd>
            ) : null}
          </div>
          <div className="min-w-0 rounded-lg bg-hero-bg/60 px-2 py-2">
            <dt className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-muted">
              <Users className="size-3 shrink-0" aria-hidden="true" />
              Apps
            </dt>
            <dd className="mt-1 text-sm font-bold tabular-nums text-foreground">
              {job.applications.toLocaleString("en-IN")}
            </dd>
            {job.applicationsToday > 0 ? (
              <dd className="text-[10px] font-medium text-success">
                +{job.applicationsToday} today
              </dd>
            ) : null}
          </div>
        </dl>
      </div>
    </article>
  );
}
