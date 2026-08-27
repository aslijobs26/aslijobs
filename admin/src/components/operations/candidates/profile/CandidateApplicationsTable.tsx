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
      <div className="px-4 py-10 text-center text-xs text-muted">
        Loading applications…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-2 px-4 py-10 text-center">
        <p className="text-sm font-medium text-danger">
          {errorMessage ?? "Failed to load applications."}
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-8 items-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm font-medium text-foreground">No applications yet</p>
        <p className="mt-1 text-xs text-muted">
          This candidate has not applied to any jobs.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
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
  );
}
