import {
  ArrowRight,
  BadgeCheck,
  Copy,
  Hammer,
  MapPin,
  Pencil,
  Plus,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { OperationsBadge } from "../../../ui/OperationsBadge";
import { EmployerLogo } from "../../../ui/EmployerLogo";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import { formatBusinessCategoryLabel } from "../../../../constants/operations-post-job-company-options";
import type { OperationsJobDetail } from "../../../../types/operations-jobs";
import { cn } from "../../../../utils/cn";
import {
  formatOperationsDateTime,
  jobDetailStatusTone,
} from "./job-detail-format";

interface JobDetailHeaderProps {
  job: OperationsJobDetail;
  isClosing?: boolean;
  onEdit: () => void;
  onCloseJob: () => void;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted">
      {children}
    </p>
  );
}

function HeaderColumn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 border-t border-border-subtle pt-4 first:border-t-0 first:pt-0 lg:border-t-0 lg:pt-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

function StatMetric({
  label,
  value,
  caption,
}: {
  label: string;
  value: number;
  caption: string;
}) {
  return (
    <div className="min-w-0 text-left lg:text-right">
      <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-[15px] font-semibold leading-none tabular-nums text-foreground">
        {value.toLocaleString("en-IN")}
      </p>
      <p className="mt-1 text-[9px] leading-tight text-muted/90">{caption}</p>
    </div>
  );
}

export function JobDetailHeader({
  job,
  isClosing,
  onEdit,
  onCloseJob,
}: JobDetailHeaderProps) {
  const [copied, setCopied] = useState(false);
  const showVerified =
    job.employer.isWhatsappVerified || job.employer.registrationCompleted;
  const canClose =
    (job.status !== "closed" && job.status !== "draft") ||
    (job.status === "closed" && !job.employerNotified && Boolean(job.closedReason));
  const statusTone = jobDetailStatusTone(job.status);

  const handleCopyJobId = async () => {
    try {
      await navigator.clipboard.writeText(job.jobId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const ghostActionClassName =
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[11px] font-semibold text-foreground shadow-sm transition-colors hover:border-border-subtle hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

  const primaryActionClassName =
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm sm:p-4 lg:p-5">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-5">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-border-subtle">
          {/* Job identity */}
          <HeaderColumn className="flex min-w-0 gap-3 lg:pr-4">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 ring-1 ring-warning/10 sm:size-11">
              <Hammer className="size-5 text-warning" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-[17px]">
                  {job.jobTitle}
                </h1>
                <OperationsBadge
                  variant={statusTone}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-semibold",
                    job.status === "active" && "bg-success/10 text-success",
                  )}
                >
                  {job.statusLabel}
                </OperationsBadge>
              </div>

              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
                <span className="text-muted">Job ID:</span>
                <button
                  type="button"
                  onClick={() => void handleCopyJobId()}
                  className="inline-flex max-w-full items-center gap-1 font-medium text-foreground transition-colors hover:text-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label={`Copy job ID ${job.jobId}`}
                >
                  <span className="truncate">{job.jobId}</span>
                  <Copy className="size-3 shrink-0 text-muted" aria-hidden="true" />
                </button>
                {copied ? (
                  <span className="text-[10px] font-medium text-success">Copied</span>
                ) : null}
              </div>

              <p className="text-[11px] leading-relaxed text-muted">
                <span className="font-medium text-foreground/80">
                  {job.jobTypeLabel || "—"}
                </span>
                <span className="text-muted/70"> • </span>
                Posted on {formatOperationsDateTime(job.publishedAt ?? job.createdAt)}
              </p>
            </div>
          </HeaderColumn>

          {/* Employer */}
          <HeaderColumn className="lg:px-4">
            <FieldLabel>Posted by</FieldLabel>
            <div className="mt-2 flex items-center gap-2">
              <EmployerLogo
                name={job.employer.companyName}
                logoUrl={job.employer.logoUrl}
              />
              <p className="flex min-w-0 items-center gap-1 text-[13px] font-semibold text-foreground">
                <span className="truncate">{job.employer.companyName}</span>
                {showVerified ? (
                  <BadgeCheck
                    className="size-3.5 shrink-0 text-chart-accent"
                    aria-label="Verified employer"
                  />
                ) : null}
              </p>
            </div>
            <Link
              to={OPERATIONS_ROUTES.EMPLOYERS}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-soft transition-colors hover:text-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              View Employer Profile
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </HeaderColumn>

          {/* Location & category */}
          <HeaderColumn className="md:col-span-2 lg:col-span-1 lg:px-4">
            <FieldLabel>Location</FieldLabel>
            <p className="mt-2 flex items-start gap-1.5 text-[13px] font-medium text-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden="true" />
              <span className="min-w-0 break-words">{job.locationLabel || "—"}</span>
            </p>

            <div className="mt-3">
              <FieldLabel>Job Category</FieldLabel>
              <p className="mt-2 break-words text-[13px] font-medium text-foreground">
                {formatBusinessCategoryLabel(job.businessCategory) || "—"}
              </p>
            </div>
          </HeaderColumn>
        </div>

        <aside className="flex shrink-0 flex-col gap-3 border-t border-border-subtle pt-4 lg:min-w-[12rem] lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0">
          <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
            <button
              type="button"
              onClick={onEdit}
              className={ghostActionClassName}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit Job
            </button>
            <button
              type="button"
              onClick={onCloseJob}
              disabled={!canClose || isClosing}
              className={cn(
                primaryActionClassName,
                canClose
                  ? "bg-primary-soft text-surface hover:bg-primary-soft-hover"
                  : "cursor-not-allowed bg-border-subtle text-muted shadow-none",
              )}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              {isClosing
                ? "Closing…"
                : job.status === "closed" && !job.employerNotified && job.closedReason
                  ? "Send notification"
                  : "Close Job"}
            </button>
          </div>

          <div className="flex flex-wrap items-start gap-5 border-t border-border-subtle/80 pt-3 lg:justify-end">
            <StatMetric
              label="Applications"
              value={job.analytics.applications}
              caption="Total Applications"
            />
            <StatMetric
              label="Views"
              value={job.analytics.views}
              caption="Total Views"
            />
          </div>
        </aside>
      </div>
    </section>
  );
}
