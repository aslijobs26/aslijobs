import { BadgeCheck, MapPin } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { operationsCandidateDetailPath } from "../../../constants/operations-routes";
import type { OperationsCandidateListItem } from "../../../types/operations-candidates";
import { resolveMediaUrl } from "../../../utils/resolve-media-url";
import { OperationsBadge } from "../../ui/OperationsBadge";
import { CandidatesMobileCard } from "./CandidatesMobileCard";
import { CandidatesRowActions } from "./CandidatesRowActions";
import {
  applicationStatusBadgeVariant,
  candidateAvatarInitials,
  formatCandidateDateTime,
  formatCandidateDisplayId,
} from "./candidates-format";

interface CandidatesTableSectionProps {
  applications: OperationsCandidateListItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

function TableMessage({
  children,
  colSpan = 9,
}: {
  children: ReactNode;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center">
        {children}
      </td>
    </tr>
  );
}

const thClassName =
  "whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted first:pl-4 last:pr-4 sm:px-3.5";

export function CandidatesTableSection({
  applications,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: CandidatesTableSectionProps) {
  const emptyMessage = (
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground">No candidates found</p>
      <p className="text-xs text-muted">
        Try adjusting search, status, date range, or other filters.
      </p>
    </div>
  );

  const errorBlock = (
    <div className="space-y-2">
      <p className="text-sm font-medium text-danger">
        {errorMessage ?? "Failed to load candidates."}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-8 items-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Retry
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="min-w-0 max-w-full">
      <ul className="flex flex-col gap-2.5 p-2.5 sm:hidden">
        {isLoading ? (
          <li className="px-2 py-10 text-center text-xs text-muted">
            Loading candidates…
          </li>
        ) : null}
        {!isLoading && isError ? (
          <li className="px-2 py-10 text-center">{errorBlock}</li>
        ) : null}
        {!isLoading && !isError && applications.length === 0 ? (
          <li className="px-2 py-10 text-center">{emptyMessage}</li>
        ) : null}
        {!isLoading && !isError
          ? applications.map((application) => (
              <li key={application.id}>
                <CandidatesMobileCard application={application} />
              </li>
            ))
          : null}
      </ul>

      <ul className="hidden divide-y divide-border-subtle sm:block lg:hidden">
        {isLoading ? (
          <li className="px-3 py-10 text-center text-xs text-muted sm:px-3.5">
            Loading candidates…
          </li>
        ) : null}
        {!isLoading && isError ? (
          <li className="px-3 py-10 text-center sm:px-3.5">{errorBlock}</li>
        ) : null}
        {!isLoading && !isError && applications.length === 0 ? (
          <li className="px-3 py-10 text-center sm:px-3.5">{emptyMessage}</li>
        ) : null}
        {!isLoading && !isError
          ? applications.map((application) => {
              const applied = formatCandidateDateTime(application.appliedAt);
              return (
                <li key={application.id} className="px-3 py-3 sm:px-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={operationsCandidateDetailPath(
                        application.jobSeekerId || application.id,
                      )}
                      className="group min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      <p className="font-mono text-[10px] font-medium text-muted">
                        {formatCandidateDisplayId(
                          application.jobSeekerId || application.id,
                        )}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground group-hover:text-primary">
                        {application.candidateName}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        {[application.candidateEmail, application.candidatePhone]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </Link>
                    <CandidatesRowActions application={application} />
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <OperationsBadge
                      variant={applicationStatusBadgeVariant(application.status)}
                    >
                      {application.statusLabel}
                    </OperationsBadge>
                    <span className="text-[11px] text-muted">
                      {applied.date}
                      {applied.time ? ` · ${applied.time}` : ""}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-xs font-medium text-foreground">
                    {application.jobTitle || "No application"}{" "}
                    {application.publicJobId ? (
                      <span className="font-mono text-[10px] text-muted">
                        ({application.publicJobId})
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-muted">
                    {application.employerName || "—"}
                    {application.employerVerified ? (
                      <BadgeCheck
                        className="size-3.5 shrink-0 text-chart-accent"
                        aria-label="Verified employer"
                      />
                    ) : null}
                  </p>
                </li>
              );
            })
          : null}
      </ul>

      <div className="hidden min-w-0 max-w-full overflow-x-auto overscroll-x-contain scrollbar-hidden lg:block">
        <table className="w-full min-w-[1080px] border-collapse text-left text-xs leading-snug xl:min-w-[1140px]">
          <thead>
            <tr className="ops-brand-border-glow border-y border-border-subtle bg-hero-bg/40">
              {[
                "Candidate ID",
                "Candidate",
                "Applied Job",
                "Employer",
                "Status",
                "Applied On",
                "Experience",
                "Location",
                "",
              ].map((label, index) => (
                <th
                  key={label || `actions-${index}`}
                  className={thClassName}
                  scope="col"
                >
                  {label ? label : <span className="sr-only">Actions</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableMessage>
                <p className="text-xs text-muted">Loading candidates…</p>
              </TableMessage>
            ) : null}
            {!isLoading && isError ? (
              <TableMessage>{errorBlock}</TableMessage>
            ) : null}
            {!isLoading && !isError && applications.length === 0 ? (
              <TableMessage>{emptyMessage}</TableMessage>
            ) : null}
            {!isLoading && !isError
              ? applications.map((application) => {
                  const applied = formatCandidateDateTime(application.appliedAt);
                  const photoSrc = resolveMediaUrl(application.profilePhotoUrl);

                  return (
                    <tr
                      key={application.id}
                      className="border-b border-border-subtle/80 transition-colors last:border-0 hover:bg-hero-bg/40"
                    >
                      <td className="whitespace-nowrap px-3 py-3 first:pl-4 sm:px-3.5">
                        <span className="font-mono text-[11px] font-medium text-muted">
                          {formatCandidateDisplayId(
                            application.jobSeekerId || application.id,
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-3 sm:px-3.5">
                        <Link
                          to={operationsCandidateDetailPath(
                            application.jobSeekerId || application.id,
                          )}
                          className="group flex min-w-0 max-w-[16rem] items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                          <span
                            className="inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-[10px] font-semibold text-primary"
                            aria-hidden="true"
                          >
                            {photoSrc ? (
                              <img
                                src={photoSrc}
                                alt=""
                                className="size-full object-cover"
                              />
                            ) : (
                              candidateAvatarInitials(application.candidateName)
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-foreground group-hover:text-primary">
                              {application.candidateName}
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] text-muted">
                              {application.candidateEmail ||
                                application.candidatePhone ||
                                "—"}
                            </span>
                            {application.candidateEmail &&
                            application.candidatePhone ? (
                              <span className="mt-0.5 block truncate text-[10px] text-muted">
                                {application.candidatePhone}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-3 sm:px-3.5">
                        <div className="min-w-0 max-w-[12rem]">
                          <p className="truncate font-semibold text-foreground">
                            {application.jobTitle || "No application"}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-muted">
                            {application.publicJobId || "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-3 sm:px-3.5">
                        <div className="flex min-w-0 max-w-[12rem] items-center gap-1">
                          <p className="truncate font-medium text-foreground">
                            {application.employerName || "—"}
                          </p>
                          {application.employerVerified ? (
                            <BadgeCheck
                              className="size-3.5 shrink-0 text-chart-accent"
                              aria-label="Verified employer"
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 sm:px-3.5">
                        <OperationsBadge
                          variant={applicationStatusBadgeVariant(
                            application.status,
                          )}
                        >
                          {application.statusLabel}
                        </OperationsBadge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 sm:px-3.5">
                        <p className="font-medium text-foreground">
                          {applied.date}
                        </p>
                        {applied.time ? (
                          <p className="mt-0.5 text-[10px] text-muted">
                            {applied.time}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 sm:px-3.5">
                        <p className="max-w-[8rem] truncate text-foreground">
                          {application.candidateExperienceLabel || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-3 sm:px-3.5">
                        <p className="flex max-w-[9rem] items-center gap-1 truncate text-foreground">
                          <MapPin
                            className="size-3 shrink-0 text-muted"
                            aria-hidden="true"
                          />
                          <span className="truncate">
                            {application.candidateLocation || "—"}
                          </span>
                        </p>
                      </td>
                      <td className="px-3 py-3 last:pr-4 sm:px-3.5">
                        <div className="flex justify-end">
                          <CandidatesRowActions application={application} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
