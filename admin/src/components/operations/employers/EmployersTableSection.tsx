import { MapPin } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { operationsEmployerDetailPath } from "../../../constants/operations-routes";
import type { OperationsEmployerListItem } from "../../../types/operations-employers";
import { resolveMediaUrl } from "../../../utils/resolve-media-url";
import { OperationsBadge } from "../../ui/OperationsBadge";
import {
  employerAvatarInitials,
  employerStatusBadgeVariant,
  verificationStatusBadgeVariant,
} from "./employers-format";
import { EmployersMobileCard } from "./EmployersMobileCard";
import { EmployersRowActions } from "./EmployersRowActions";

interface EmployersTableSectionProps {
  employers: OperationsEmployerListItem[];
  totalEmployers: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onVerify?: (employer: OperationsEmployerListItem) => void;
  onReject?: (employer: OperationsEmployerListItem) => void;
  onToggleStatus?: (employer: OperationsEmployerListItem) => void;
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

export function EmployersTableSection({
  employers,
  totalEmployers,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onVerify,
  onReject,
  onToggleStatus,
}: EmployersTableSectionProps) {
  const emptyMessage = (
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground">No employers found</p>
      <p className="text-xs text-muted">
        Try adjusting your search, registration date, or filter criteria.
      </p>
    </div>
  );

  const errorBlock = (
    <div className="space-y-2">
      <p className="text-sm font-medium text-danger">
        {errorMessage ?? "Failed to load employers."}
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
          All Employers ({totalEmployers.toLocaleString("en-IN")})
        </h2>
      </div>

      {/* Mobile view */}
      <ul className="flex flex-col gap-2.5 p-2.5 sm:hidden">
        {isLoading ? (
          <li className="px-2 py-10 text-center text-xs text-muted">
            Loading employers…
          </li>
        ) : null}
        {!isLoading && isError ? (
          <li className="p-4 text-center">{errorBlock}</li>
        ) : null}
        {!isLoading && !isError && employers.length === 0 ? (
          <li className="p-6 text-center">{emptyMessage}</li>
        ) : null}
        {!isLoading &&
          !isError &&
          employers.map((emp) => (
            <EmployersMobileCard
              key={emp.id}
              employer={emp}
              onVerify={onVerify}
              onReject={onReject}
              onToggleStatus={onToggleStatus}
            />
          ))}
      </ul>

      {/* Desktop view */}
      <div className="hidden overflow-x-auto overscroll-x-contain scrollbar-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:block">
        <table className="min-w-[880px] text-left text-xs xl:min-w-full">
          <thead className="border-b border-border-subtle bg-hero-bg/60 text-muted">
            <tr>
              <th scope="col" className={thClassName}>
                EMPLOYER
              </th>
              <th scope="col" className={thClassName}>
                CONTACT
              </th>
              <th scope="col" className={thClassName}>
                ORGANIZATION TYPE
              </th>
              <th scope="col" className={thClassName}>
                LOCATION
              </th>
              <th scope="col" className={thClassName}>
                REGISTERED ON
              </th>
              <th scope="col" className={thClassName}>
                VERIFICATION STATUS
              </th>
              <th scope="col" className={thClassName}>
                STATUS
              </th>
              <th scope="col" className={thClassName}>
                ACTIVE JOBS
              </th>
              <th scope="col" className={`${thClassName} text-right`}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoading ? (
              <TableMessage>
                <span className="text-xs text-muted">Loading employers…</span>
              </TableMessage>
            ) : null}
            {!isLoading && isError ? (
              <TableMessage>{errorBlock}</TableMessage>
            ) : null}
            {!isLoading && !isError && employers.length === 0 ? (
              <TableMessage>{emptyMessage}</TableMessage>
            ) : null}
            {!isLoading &&
              !isError &&
              employers.map((emp) => {
                const logoUrl = resolveMediaUrl(emp.logoUrl);

                return (
                  <tr
                    key={emp.id}
                    className="align-middle transition-colors hover:bg-hero-bg/30"
                  >
                    {/* Employer Column */}
                    <td className="max-w-[15rem] py-3 pl-4 pr-3 sm:pr-3.5">
                      <Link
                        to={operationsEmployerDetailPath(emp.id)}
                        className="flex min-w-0 items-center gap-2.5"
                      >
                        <span className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-[11px] font-semibold text-primary">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            employerAvatarInitials(emp.displayName)
                          )}
                        </span>
                        <div className="min-w-0">
                          <span className="block truncate font-semibold text-foreground hover:text-primary">
                            {emp.displayName}
                          </span>
                          <span className="mt-0.5 block text-[11px] font-mono text-muted">
                            {emp.displayId}
                          </span>
                        </div>
                      </Link>
                    </td>

                    {/* Contact Column */}
                    <td className="whitespace-nowrap px-3 py-3 text-foreground sm:px-3.5">
                      <span className="block font-medium">
                        {emp.phone || "—"}
                      </span>
                      {emp.email ? (
                        <span className="mt-0.5 block text-[11px] text-muted">
                          {emp.email}
                        </span>
                      ) : null}
                    </td>

                    {/* Organization Type */}
                    <td className="whitespace-nowrap px-3 py-3 text-foreground sm:px-3.5">
                      {emp.organizationType || "Private Company"}
                    </td>

                    {/* Location */}
                    <td className="px-3 py-3 text-muted sm:px-3.5">
                      <span className="inline-flex max-w-[11rem] items-center gap-1">
                        <MapPin
                          className="size-3 shrink-0 text-muted"
                          aria-hidden="true"
                        />
                        <span className="truncate">{emp.location || "—"}</span>
                      </span>
                    </td>

                    {/* Registered On */}
                    <td className="whitespace-nowrap px-3 py-3 text-muted sm:px-3.5">
                      <span className="block text-foreground font-medium">
                        {emp.registeredAtDate}
                      </span>
                      {emp.registeredAtTime ? (
                        <span className="block text-[11px]">
                          {emp.registeredAtTime}
                        </span>
                      ) : null}
                    </td>

                    {/* Verification Status */}
                    <td className="whitespace-nowrap px-3 py-3 sm:px-3.5">
                      <div className="space-y-0.5">
                        <OperationsBadge
                          variant={verificationStatusBadgeVariant(
                            emp.verificationStatus,
                          )}
                        >
                          {emp.verificationStatusLabel}
                        </OperationsBadge>
                        <span className="block text-[11px] text-muted">
                          {emp.verifiedAtDate || "—"}
                        </span>
                      </div>
                    </td>

                    {/* Account Status */}
                    <td className="whitespace-nowrap px-3 py-3 sm:px-3.5">
                      <OperationsBadge
                        variant={employerStatusBadgeVariant(emp.status)}
                      >
                        {emp.statusLabel}
                      </OperationsBadge>
                    </td>

                    {/* Active Jobs */}
                    <td className="px-3 py-3 font-semibold tabular-nums text-foreground sm:px-3.5">
                      {emp.activeJobsCount}
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right sm:pl-3.5">
                      <EmployersRowActions
                        employer={emp}
                        onVerify={onVerify}
                        onReject={onReject}
                        onToggleStatus={onToggleStatus}
                      />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
