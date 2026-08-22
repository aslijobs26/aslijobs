import { MoreVertical } from "lucide-react";
import { JobsPaginationBar } from "../JobsPaginationBar";
import { OperationsBadge } from "../../../ui/OperationsBadge";
import { OperationsCard } from "../../../ui/OperationsCard";
import type {
  OperationsJobApplicationItem,
  OperationsJobsPagination,
} from "../../../../types/operations-jobs";
import {
  candidateInitials,
  formatOperationsDateTime,
} from "./job-detail-format";

interface JobApplicationsPanelProps {
  applications: OperationsJobApplicationItem[];
  total: number;
  pagination: OperationsJobsPagination;
  isLoading: boolean;
  isError: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onRetry?: () => void;
  onViewAll: () => void;
}

function applicationBadgeVariant(
  status: string,
): "default" | "candidate" | "job" | "high" | "medium" | "low" {
  switch (status) {
    case "submitted":
      return "candidate";
    case "shortlisted":
    case "selected":
    case "joined":
      return "default";
    case "rejected":
    case "withdrawn":
      return "high";
    case "interview_scheduled":
    case "interview_completed":
    case "offer_sent":
      return "job";
    default:
      return "medium";
  }
}

export function JobApplicationsPanel({
  applications,
  total,
  pagination,
  isLoading,
  isError,
  onPageChange,
  onLimitChange,
  onRetry,
  onViewAll,
}: JobApplicationsPanelProps) {
  return (
    <OperationsCard
      title={`Applications (${total.toLocaleString("en-IN")})`}
      action={
        <button
          type="button"
          onClick={onViewAll}
          className="text-[11px] font-semibold text-primary-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          View All Applications →
        </button>
      }
      bodyClassName="p-0 sm:p-0"
    >
      {isLoading ? (
        <p className="px-3 py-8 text-center text-xs text-muted">
          Loading applications…
        </p>
      ) : null}

      {!isLoading && isError ? (
        <div className="px-3 py-8 text-center">
          <p className="text-xs text-danger">Failed to load applications.</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 text-xs font-semibold text-primary-soft hover:underline"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !isError && applications.length === 0 ? (
        <p className="px-3 py-8 text-center text-xs text-muted">
          No applications for this job yet.
        </p>
      ) : null}

      {!isLoading && !isError && applications.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto overscroll-x-contain scrollbar-hidden md:block">
            <table className="w-full min-w-[860px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-hero-bg/40 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  <th className="px-3 py-2.5">Candidate</th>
                  <th className="px-3 py-2.5">Contact</th>
                  <th className="px-3 py-2.5">Experience</th>
                  <th className="px-3 py-2.5">Applied On</th>
                  <th className="px-3 py-2.5">Source</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr
                    key={application.id}
                    className="border-b border-border-subtle/80 last:border-0"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-[10px] font-semibold text-primary">
                          {candidateInitials(application.candidateName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">
                            {application.candidateName}
                          </p>
                          <p className="truncate text-[11px] text-muted">
                            {application.candidateHeadline || "View Profile →"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted">
                      <p>{application.candidatePhone || "—"}</p>
                      <p className="text-[11px]">
                        {application.candidateLocation || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-foreground">
                      {application.candidateExperienceLabel || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">
                      {formatOperationsDateTime(application.appliedAt)}
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {application.sourceLabel}
                    </td>
                    <td className="px-3 py-3">
                      <OperationsBadge
                        variant={applicationBadgeVariant(application.status)}
                      >
                        {application.statusLabel}
                      </OperationsBadge>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          className="rounded-md border border-border-subtle px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          className="inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-hero-bg"
                          aria-label={`More actions for ${application.candidateName}`}
                        >
                          <MoreVertical className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-border-subtle md:hidden">
            {applications.map((application) => (
              <li key={application.id} className="px-3 py-3">
                <div className="flex items-start gap-2">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-[10px] font-semibold text-primary">
                    {candidateInitials(application.candidateName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {application.candidateName}
                    </p>
                    <p className="text-[11px] text-muted">
                      {application.candidateExperienceLabel || "—"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {application.candidatePhone || "—"} ·{" "}
                      {application.candidateLocation || "—"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <OperationsBadge
                        variant={applicationBadgeVariant(application.status)}
                      >
                        {application.statusLabel}
                      </OperationsBadge>
                      <span className="text-[11px] text-muted">
                        {formatOperationsDateTime(application.appliedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {!isLoading && !isError ? (
        <div className="border-t border-border-subtle px-3 py-2.5">
          <JobsPaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
            ariaLabel="Applications pagination"
          />
        </div>
      ) : null}
    </OperationsCard>
  );
}
