import { MapPin } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { operationsCandidateDetailPath } from "../../../constants/operations-routes";
import type { OperationsCandidateListItem } from "../../../types/operations-candidates";
import { resolveMediaUrl } from "../../../utils/resolve-media-url";
import { OperationsBadge } from "../../ui/OperationsBadge";
import { CandidatesMobileCard } from "./CandidatesMobileCard";
import { CandidatesRowActions } from "./CandidatesRowActions";
import {
  candidateAvatarInitials,
  formatCandidateDateTime,
  formatCandidateDisplayId,
  profileStatusBadgeVariant,
} from "./candidates-format";

interface CandidatesTableSectionProps {
  applications: OperationsCandidateListItem[];
  totalCandidates: number;
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

function PreferredRoleChips({ roles }: { roles: string[] }) {
  if (!roles.length) {
    return <span className="text-muted">—</span>;
  }

  const visible = roles.slice(0, 2);
  const remaining = roles.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((role) => (
        <span
          key={role}
          className="inline-flex max-w-[8rem] truncate rounded-md bg-border-subtle px-1.5 py-0.5 text-[10px] font-medium text-foreground"
        >
          {role}
        </span>
      ))}
      {remaining > 0 ? (
        <span className="inline-flex rounded-md bg-border-subtle px-1.5 py-0.5 text-[10px] font-semibold text-muted">
          +{remaining}
        </span>
      ) : null}
    </div>
  );
}

const thClassName =
  "whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted first:pl-4 last:pr-4 sm:px-3.5";

export function CandidatesTableSection({
  applications,
  totalCandidates,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: CandidatesTableSectionProps) {
  const emptyMessage = (
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground">No candidates found</p>
      <p className="text-xs text-muted">
        Try adjusting search, registration date, or other filters.
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
      <div className="border-b border-border-subtle px-3 py-2.5 sm:px-4">
        <h2 className="text-sm font-semibold text-foreground">
          All Candidates ({totalCandidates.toLocaleString("en-IN")})
        </h2>
      </div>

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
              const registered = formatCandidateDateTime(application.registeredAt);
              return (
                <li key={application.id} className="px-3 py-3 sm:px-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={operationsCandidateDetailPath(
                        application.jobSeekerId || application.id,
                      )}
                      className="flex min-w-0 items-start gap-2.5"
                    >
                      <span className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-[11px] font-semibold text-primary">
                        {resolveMediaUrl(application.profilePhotoUrl) ? (
                          <img
                            src={resolveMediaUrl(application.profilePhotoUrl)}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          candidateAvatarInitials(application.candidateName)
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {application.candidateName}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted">
                          {formatCandidateDisplayId(
                            application.jobSeekerId || application.id,
                          )}
                        </span>
                        <span className="mt-1 block text-[11px] text-muted">
                          {application.candidatePhone || "—"}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                          <MapPin className="size-3 shrink-0" aria-hidden="true" />
                          {application.candidateLocation || "—"}
                        </span>
                        <span className="mt-1 block text-[11px] text-muted">
                          {registered.date}
                          {registered.time ? ` ${registered.time}` : ""}
                        </span>
                      </span>
                    </Link>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <OperationsBadge
                        variant={profileStatusBadgeVariant(
                          application.profileStatus,
                        )}
                      >
                        {application.profileStatusLabel || "Incomplete"}
                      </OperationsBadge>
                      <span className="text-[11px] font-semibold tabular-nums text-foreground">
                        {application.applicationCount ?? 0} apps
                      </span>
                      <CandidatesRowActions application={application} />
                    </div>
                  </div>
                </li>
              );
            })
          : null}
      </ul>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-border-subtle bg-hero-bg/40">
            <tr>
              <th className={thClassName}>Candidate</th>
              <th className={thClassName}>Contact</th>
              <th className={thClassName}>Preferred Roles</th>
              <th className={thClassName}>Experience</th>
              <th className={thClassName}>Location</th>
              <th className={thClassName}>Registered On</th>
              <th className={thClassName}>Applications</th>
              <th className={thClassName}>Profile Status</th>
              <th className={`${thClassName} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
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
                  const registered = formatCandidateDateTime(
                    application.registeredAt,
                  );
                  return (
                    <tr
                      key={application.id}
                      className="align-middle hover:bg-hero-bg/30"
                    >
                      <td className="px-3 py-3 first:pl-4 sm:px-3.5">
                        <Link
                          to={operationsCandidateDetailPath(
                            application.jobSeekerId || application.id,
                          )}
                          className="flex min-w-0 items-center gap-2.5"
                        >
                          <span className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-[11px] font-semibold text-primary">
                            {resolveMediaUrl(application.profilePhotoUrl) ? (
                              <img
                                src={resolveMediaUrl(application.profilePhotoUrl)}
                                alt=""
                                className="size-full object-cover"
                              />
                            ) : (
                              candidateAvatarInitials(application.candidateName)
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-foreground">
                              {application.candidateName}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-muted">
                              {formatCandidateDisplayId(
                                application.jobSeekerId || application.id,
                              )}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-foreground sm:px-3.5">
                        {application.candidatePhone || "—"}
                      </td>
                      <td className="px-3 py-3 sm:px-3.5">
                        <PreferredRoleChips
                          roles={application.preferredRoles ?? []}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-foreground sm:px-3.5">
                        {application.candidateExperienceLabel ||
                          "Not specified"}
                      </td>
                      <td className="px-3 py-3 text-muted sm:px-3.5">
                        <span className="inline-flex max-w-[10rem] items-center gap-1">
                          <MapPin
                            className="size-3 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate">
                            {application.candidateLocation || "—"}
                          </span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted sm:px-3.5">
                        <span className="block">{registered.date}</span>
                        {registered.time ? (
                          <span className="block text-[11px]">
                            {registered.time}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 font-semibold tabular-nums text-foreground sm:px-3.5">
                        {application.applicationCount ?? 0}
                      </td>
                      <td className="px-3 py-3 sm:px-3.5">
                        <OperationsBadge
                          variant={profileStatusBadgeVariant(
                            application.profileStatus,
                          )}
                        >
                          {application.profileStatusLabel || "Incomplete"}
                        </OperationsBadge>
                      </td>
                      <td className="px-3 py-3 text-right last:pr-4 sm:px-3.5">
                        <div className="inline-flex justify-end">
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
