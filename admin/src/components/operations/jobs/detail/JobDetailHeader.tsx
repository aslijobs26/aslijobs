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
import {
  OPERATIONS_ROUTES,
  operationsEmployerDetailPath,
} from "../../../../constants/operations-routes";
import { formatBusinessCategoryLabel } from "../../../../constants/operations-post-job-company-options";
import type { OperationsJobDetail } from "../../../../types/operations-jobs";
import { cn } from "../../../../utils/cn";
import { verificationStatusBadgeVariant } from "../../employers/employers-format";
import { OperationsCanKey } from "../../auth/OperationsCanKey";
import {
  formatOperationsDateTime,
  jobDetailStatusTone,
} from "./job-detail-format";

interface JobDetailHeaderProps {
  job: OperationsJobDetail;
  isClosing?: boolean;
  isReviewing?: boolean;
  onEdit: () => void;
  onCloseJob: () => void;
  onApproveJob?: () => void;
  onRejectJob?: () => void;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[9px] font-medium uppercase tracking-[0.06em] text-muted max-sm:text-[9px] sm:text-[10px]">
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
        "min-w-0 border-t border-border-subtle pt-3 first:border-t-0 first:pt-0 max-sm:pt-3 sm:pt-4 lg:border-t-0 lg:pt-0",
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
      <p className="text-[9px] font-medium uppercase tracking-[0.06em] text-muted sm:text-[10px]">
        {label}
      </p>
      <p className="mt-0.5 text-[14px] font-semibold leading-none tabular-nums text-foreground max-sm:text-[13px] sm:mt-1 sm:text-[15px]">
        {value.toLocaleString("en-IN")}
      </p>
      <p className="mt-0.5 text-[8px] leading-tight text-muted/90 sm:mt-1 sm:text-[9px]">
        {caption}
      </p>
    </div>
  );
}

export function JobDetailHeader({
  job,
  isClosing,
  isReviewing,
  onEdit,
  onCloseJob,
  onApproveJob,
  onRejectJob,
}: JobDetailHeaderProps) {
  const [copied, setCopied] = useState(false);
  const showVerified =
    job.employer.isWhatsappVerified || job.employer.registrationCompleted;
  const canClose =
    (job.status !== "closed" &&
      job.status !== "draft" &&
      job.status !== "pending_approval") ||
    (job.status === "closed" && !job.employerNotified && Boolean(job.closedReason));
  const isPendingApproval =
    job.status === "pending_approval" || Boolean(job.isLiveChangeReview);
  const busy = Boolean(isClosing || isReviewing);
  const statusTone = jobDetailStatusTone(job.status);
  const employerVerificationStatus = job.employer.verificationStatus;
  const employerVerificationLabel =
    job.employer.verificationStatusLabel ||
    (employerVerificationStatus === "verified"
      ? "Verified"
      : employerVerificationStatus === "rejected"
        ? "Rejected"
        : "Pending");
  const isEmployerVerified = employerVerificationStatus === "verified";
  const isEmployerCreatedJob = job.creationSource !== "operations";
  const approvalBlockedByVerification =
    isPendingApproval && isEmployerCreatedJob && !isEmployerVerified;
  const employerProfileHref = job.employer.id
    ? operationsEmployerDetailPath(job.employer.id)
    : OPERATIONS_ROUTES.EMPLOYERS;

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
    "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-[10px] font-semibold text-foreground shadow-sm transition-colors hover:border-border-subtle hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:h-7 sm:h-8 sm:px-2.5 sm:text-[11px]";

  const primaryActionClassName =
    "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-[10px] font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:h-7 sm:h-8 sm:px-2.5 sm:text-[11px]";

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm max-sm:rounded-lg max-sm:p-2.5 sm:p-4 lg:p-5">
      <div className="flex flex-col gap-3 max-sm:gap-3 sm:gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-5">
        <div className="grid min-w-0 grid-cols-1 gap-0 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-border-subtle">
          {/* Job identity */}
          <HeaderColumn className="flex min-w-0 gap-2.5 max-sm:gap-2.5 sm:gap-3 lg:pr-4">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/10 ring-1 ring-warning/10 max-sm:size-9 sm:size-11">
              <Hammer className="size-4 text-warning sm:size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-1 max-sm:space-y-1 sm:space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5 max-sm:gap-1.5 sm:gap-2">
                <h1 className="text-[14px] font-semibold tracking-tight text-foreground max-sm:text-[14px] sm:text-[17px]">
                  {job.jobTitle}
                </h1>
                <OperationsBadge
                  variant={statusTone}
                  className={cn(
                    "px-1.5 py-0 text-[9px] font-semibold sm:px-2 sm:py-0.5 sm:text-[10px]",
                    job.status === "active" &&
                      !job.isLiveChangeReview &&
                      "bg-success/10 text-success",
                  )}
                >
                  {job.statusLabel}
                </OperationsBadge>
                {job.isLiveChangeReview ? (
                  <span className="inline-flex rounded-full bg-warning/15 px-1.5 py-0 text-[9px] font-semibold text-warning sm:px-2 sm:py-0.5 sm:text-[10px]">
                    Edited Live Job
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] max-sm:text-[11px] sm:text-xs">
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
                  <span className="text-[9px] font-medium text-success sm:text-[10px]">
                    Copied
                  </span>
                ) : null}
              </div>

              <p className="text-[10px] leading-relaxed text-muted max-sm:text-[10px] sm:text-[11px]">
                <span className="font-medium text-foreground/80">
                  {job.jobTypeLabel || "—"}
                </span>
                <span className="text-muted/70"> • </span>
                {job.status === "pending_approval"
                  ? `Submitted ${formatOperationsDateTime(job.submittedForApprovalAt ?? job.createdAt)}`
                  : job.isLiveChangeReview
                    ? `Changes submitted ${formatOperationsDateTime(job.liveChangeSubmittedAt ?? job.lastEditedAt)}`
                    : `Posted on ${formatOperationsDateTime(job.publishedAt ?? job.createdAt)}`}
              </p>
              {job.status === "rejected" && job.rejectionReason ? (
                <p className="text-[10px] leading-relaxed text-danger sm:text-[11px]">
                  Rejection reason: {job.rejectionReason}
                </p>
              ) : null}
              {job.liveChangeReviewStatus === "rejected" &&
              job.liveChangeRejectionReason ? (
                <p className="text-[10px] leading-relaxed text-danger sm:text-[11px]">
                  Changes rejected: {job.liveChangeRejectionReason}
                </p>
              ) : null}
            </div>
          </HeaderColumn>

          {/* Employer */}
          <HeaderColumn className="lg:px-4">
            <FieldLabel>Posted by</FieldLabel>
            <div className="mt-1.5 flex items-center gap-2 max-sm:mt-1.5 sm:mt-2">
              <EmployerLogo
                name={job.employer.companyName}
                logoUrl={job.employer.logoUrl}
              />
              <p className="flex min-w-0 items-center gap-1 text-[12px] font-semibold text-foreground max-sm:text-[12px] sm:text-[13px]">
                <span className="truncate">{job.employer.companyName}</span>
                {showVerified ? (
                  <BadgeCheck
                    className="size-3.5 shrink-0 text-chart-accent"
                    aria-label="Verified employer"
                  />
                ) : null}
              </p>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 max-sm:mt-1.5 sm:mt-2">
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-muted sm:text-[10px]">
                Employer Verification
              </span>
              <OperationsBadge
                variant={verificationStatusBadgeVariant(
                  employerVerificationStatus,
                )}
                className="px-1.5 py-0 text-[9px] font-semibold sm:px-2 sm:py-0.5 sm:text-[10px]"
              >
                {employerVerificationLabel}
              </OperationsBadge>
            </div>
            <Link
              to={employerProfileHref}
              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-primary-soft transition-colors hover:text-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:mt-1.5 sm:mt-2 sm:text-[11px]"
            >
              View Employer Profile
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </HeaderColumn>

          {/* Location & category */}
          <HeaderColumn className="md:col-span-2 lg:col-span-1 lg:px-4">
            <FieldLabel>Location</FieldLabel>
            <p className="mt-1.5 flex items-start gap-1.5 text-[12px] font-medium text-foreground max-sm:mt-1.5 sm:mt-2 sm:text-[13px]">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden="true" />
              <span className="min-w-0 break-words">{job.locationLabel || "—"}</span>
            </p>

            <div className="mt-2.5 max-sm:mt-2.5 sm:mt-3">
              <FieldLabel>Job Category</FieldLabel>
              <p className="mt-1.5 break-words text-[12px] font-medium text-foreground max-sm:mt-1.5 sm:mt-2 sm:text-[13px]">
                {formatBusinessCategoryLabel(job.businessCategory) || "—"}
              </p>
            </div>
          </HeaderColumn>
        </div>

        <aside className="flex shrink-0 flex-col gap-2.5 border-t border-border-subtle pt-3 max-sm:gap-2.5 max-sm:pt-3 sm:gap-3 sm:pt-4 lg:min-w-[12rem] lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0">
          <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
            {isPendingApproval ? (
              <>
                <OperationsCanKey permissionKey="jobs.detail.actions.approve">
                  <button
                    type="button"
                    onClick={onApproveJob}
                    disabled={
                      busy || !onApproveJob || approvalBlockedByVerification
                    }
                    title={
                      approvalBlockedByVerification
                        ? "Approval blocked — Employer verification required."
                        : undefined
                    }
                    className={cn(
                      primaryActionClassName,
                      "bg-success text-surface hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    {isReviewing
                      ? "Approving…"
                      : job.isLiveChangeReview
                        ? "Approve & Publish Changes"
                        : "Approve & Publish"}
                  </button>
                </OperationsCanKey>
                <OperationsCanKey permissionKey="jobs.detail.actions.reject">
                  <button
                    type="button"
                    onClick={onRejectJob}
                    disabled={busy || !onRejectJob}
                    className={cn(
                      primaryActionClassName,
                      "bg-danger text-surface hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    {job.isLiveChangeReview ? "Reject Changes" : "Reject"}
                  </button>
                </OperationsCanKey>
              </>
            ) : (
              <>
                <OperationsCanKey permissionKey="jobs.post.update">
                  <button
                    type="button"
                    onClick={onEdit}
                    className={ghostActionClassName}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Edit Job
                  </button>
                </OperationsCanKey>
                <OperationsCanKey permissionKey="jobs.detail.actions.close">
                  <button
                    type="button"
                    onClick={onCloseJob}
                    disabled={!canClose || busy}
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
                      : job.status === "closed" &&
                          !job.employerNotified &&
                          job.closedReason
                        ? "Send notification"
                        : "Close Job"}
                  </button>
                </OperationsCanKey>
              </>
            )}
          </div>

          {approvalBlockedByVerification ? (
            <p
              className="text-[10px] leading-relaxed text-warning max-sm:text-[10px] sm:text-[11px] lg:text-right"
              role="status"
            >
              Approval blocked — Employer verification required.
            </p>
          ) : null}

          <div className="flex flex-wrap items-start gap-4 border-t border-border-subtle/80 pt-2.5 max-sm:gap-4 max-sm:pt-2.5 sm:gap-5 sm:pt-3 lg:justify-end">
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
