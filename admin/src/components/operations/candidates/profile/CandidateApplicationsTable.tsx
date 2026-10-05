import { BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { operationsJobDetailPath } from "../../../../constants/operations-routes";
import type { OperationsCandidateApplicationItem } from "../../../../types/operations-candidates";
import { OperationsBadge } from "../../../ui/OperationsBadge";
import {
  applicationStatusBadgeVariant,
  formatCandidateDateTimeFull,
} from "../candidates-format";

interface CandidateApplicationsTableProps {
  applications: OperationsCandidateApplicationItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

export function CandidateApplicationsTable({
  applications,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: CandidateApplicationsTableProps) {
  if (isLoading) {
    return (
      <div className="px-3 py-8 text-center text-[11px] text-muted max-sm:px-2.5 max-sm:py-6 max-sm:text-[10px] sm:px-4 sm:py-10 sm:text-xs">
        Loading applications…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-2 px-3 py-8 text-center max-sm:px-2.5 max-sm:py-6 sm:px-4 sm:py-10">
        <p className="text-[13px] font-medium text-danger max-sm:text-[12px] sm:text-sm">
          {errorMessage ?? "Failed to load applications."}
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-7 items-center rounded-lg bg-primary-light px-2.5 text-[11px] font-semibold text-primary max-sm:h-6 max-sm:text-[10px] sm:h-8 sm:px-3 sm:text-xs"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="px-3 py-8 text-center max-sm:px-2.5 max-sm:py-6 sm:px-4 sm:py-10">
        <p className="text-[13px] font-medium text-foreground max-sm:text-[12px] sm:text-sm">
          No applications yet
        </p>
        <p className="mt-1 text-[11px] text-muted max-sm:text-[10px] sm:text-xs">
          This candidate has not applied to any jobs.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col divide-y divide-border-subtle sm:hidden">
        {applications.map((application) => (
          <li key={application.id} className="px-2.5 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-foreground">
                  {application.jobTitle}
                </p>
                <p className="mt-0.5 font-mono text-[9px] text-muted">
                  {application.publicJobId || "—"}
                </p>
                <p className="mt-1 inline-flex min-w-0 items-center gap-1 text-[10px] font-medium text-foreground">
                  <span className="truncate">{application.employerName}</span>
                  {application.employerVerified ? (
                    <BadgeCheck
                      className="size-3 shrink-0 text-chart-accent"
                      aria-label="Verified employer"
                    />
                  ) : null}
                </p>
              </div>
              <OperationsBadge
                variant={applicationStatusBadgeVariant(application.status)}
                className="shrink-0 px-1.5 py-0 text-[8px]"
              >
                {application.statusLabel}
              </OperationsBadge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1.5">
              <div className="min-w-0 space-y-0.5 text-[9px] text-muted">
                <p>
                  Applied: {formatCandidateDateTimeFull(application.appliedAt)}
                </p>
                <p>
                  Updated: {formatCandidateDateTimeFull(application.updatedAt)}
                </p>
              </div>
              {application.publicJobId ? (
                <Link
                  to={operationsJobDetailPath(application.publicJobId)}
                  className="inline-flex h-6 items-center rounded-md border border-border-subtle px-2 text-[9px] font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  View Details
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-border-subtle bg-hero-bg/40">
            <tr>
              <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Job Title
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Employer
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Applied On
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Status
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Updated On
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {applications.map((application) => (
              <tr key={application.id} className="hover:bg-hero-bg/30">
                <td className="px-4 py-3">
                  <p className="font-semibold text-foreground">
                    {application.jobTitle}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted">
                    {application.publicJobId || "—"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    {application.employerName}
                    {application.employerVerified ? (
                      <BadgeCheck
                        className="size-3.5 text-chart-accent"
                        aria-label="Verified employer"
                      />
                    ) : null}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {formatCandidateDateTimeFull(application.appliedAt)}
                </td>
                <td className="px-4 py-3">
                  <OperationsBadge
                    variant={applicationStatusBadgeVariant(application.status)}
                  >
                    {application.statusLabel}
                  </OperationsBadge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {formatCandidateDateTimeFull(application.updatedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {application.publicJobId ? (
                    <Link
                      to={operationsJobDetailPath(application.publicJobId)}
                      className="inline-flex h-8 items-center rounded-md border border-border-subtle px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      View Details
                    </Link>
                  ) : (
                    <span className="text-[11px] text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
