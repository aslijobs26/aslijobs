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
  industryOrAccountLabel,
  verificationStatusBadgeVariant,
} from "./employers-format";
import { EmployersMobileCard } from "./EmployersMobileCard";
import { EmployersRowActions } from "./EmployersRowActions";

interface EmployersTableSectionProps {
  employers: OperationsEmployerListItem[];
  totalEmployers: number;
  title?: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onVerify?: (employer: OperationsEmployerListItem) => void;
  onReject?: (employer: OperationsEmployerListItem) => void;
  onToggleStatus?: (employer: OperationsEmployerListItem) => void;
  toolbar?: ReactNode;
}

function TableMessage({
  children,
  colSpan = 8,
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
  "whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted first:pl-4 last:pr-4 sm:px-3.5 xl:px-2.5 xl:py-2 xl:text-[9px] xl:first:pl-3 xl:last:pr-3";

export function EmployersTableSection({
  employers,
  totalEmployers,
  title = "Recent Employers",
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onVerify,
  onReject,
  onToggleStatus,
  toolbar,
}: EmployersTableSectionProps) {
  const emptyMessage = (
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground xl:text-xs">No employers found</p>
      <p className="text-xs text-muted xl:text-[11px]">
        Try adjusting your search or tab filters.
      </p>
    </div>
  );

  const errorBlock = (
    <div className="space-y-2">
      <p className="text-sm font-medium text-danger xl:text-xs">
        {errorMessage ?? "Failed to load employers."}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-8 items-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:h-7 xl:text-[11px]"
        >
          Retry
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="min-w-0 max-w-full">
      <div className="border-b border-border-subtle px-3 py-2.5 max-sm:px-2.5 max-sm:py-2 sm:px-4 xl:px-3 xl:py-2">
        <div className="flex min-w-0 flex-col gap-2.5 max-sm:gap-2 xl:gap-2">
          <h2 className="text-sm font-semibold text-foreground max-sm:text-[13px] xl:text-[13px]">
            {title}{" "}
            <span className="font-semibold tabular-nums text-muted xl:text-[12px]">
              ({totalEmployers.toLocaleString("en-IN")})
            </span>
          </h2>
          {toolbar}
        </div>
      </div>

      <ul className="flex flex-col gap-2.5 p-2.5 max-sm:gap-2 max-sm:p-2 sm:hidden">
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

      <div className="hidden overflow-x-auto overscroll-x-contain scrollbar-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:block">
        <table className="min-w-[960px] text-left text-xs xl:min-w-full xl:text-[11px]">
          <thead className="border-b border-border-subtle bg-hero-bg/60 text-muted">
            <tr>
              <th scope="col" className={thClassName}>
                Company Name
              </th>
              <th scope="col" className={thClassName}>
                Industry
              </th>
              <th scope="col" className={thClassName}>
                Location
              </th>
              <th scope="col" className={thClassName}>
                Registration Date
              </th>
              <th scope="col" className={thClassName}>
                Verification
              </th>
              <th scope="col" className={thClassName}>
                Jobs Posted
              </th>
              <th scope="col" className={thClassName}>
                Status
              </th>
              <th scope="col" className={`${thClassName} text-right`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoading ? (
              <TableMessage>
                <span className="text-xs text-muted xl:text-[11px]">Loading employers…</span>
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
                const companyName =
                  emp.companyName || emp.displayName || "—";

                return (
                  <tr
                    key={emp.id}
                    className="align-middle transition-colors hover:bg-hero-bg/30"
                  >
                    <td className="max-w-[15rem] py-3 pl-4 pr-3 sm:pr-3.5 xl:max-w-[12rem] xl:py-2 xl:pl-3 xl:pr-2.5">
                      <Link
                        to={operationsEmployerDetailPath(emp.id)}
                        className="flex min-w-0 items-center gap-2.5 xl:gap-2"
                      >
                        <span className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-[11px] font-semibold text-primary xl:size-7 xl:text-[10px]">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            employerAvatarInitials(companyName)
                          )}
                        </span>
                        <div className="min-w-0">
                          <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <span className="truncate text-xs font-semibold text-foreground hover:text-primary xl:text-[11px]">
                              {companyName}
                            </span>
                            {emp.isNewRegistration ? (
                              <OperationsBadge
                                variant="high"
                                className="px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide"
                              >
                                <span aria-label="New registration">NEW</span>
                              </OperationsBadge>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block font-mono text-[11px] text-muted xl:text-[10px]">
                            {emp.displayId}
                          </span>
                        </div>
                      </Link>
                    </td>

                    <td className="max-w-[9rem] px-3 py-3 text-foreground sm:px-3.5 xl:max-w-[7.5rem] xl:px-2.5 xl:py-2">
                      <span className="block truncate xl:text-[11px]">
                        {industryOrAccountLabel(emp)}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-muted sm:px-3.5 xl:px-2.5 xl:py-2">
                      <span className="inline-flex max-w-[11rem] items-center gap-1 xl:max-w-[9rem]">
                        <MapPin
                          className="size-3 shrink-0 text-muted xl:size-2.5"
                          aria-hidden="true"
                        />
                        <span className="truncate xl:text-[11px]">
                          {emp.location?.trim() && emp.location.trim() !== "—"
                            ? emp.location
                            : "Not specified"}
                        </span>
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 text-muted sm:px-3.5 xl:px-2.5 xl:py-2">
                      <span className="block font-medium text-foreground xl:text-[11px]">
                        {emp.registeredAtDate}
                      </span>
                      {emp.registeredAtTime ? (
                        <span className="block text-[11px] xl:text-[10px]">
                          {emp.registeredAtTime}
                        </span>
                      ) : null}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-3.5 xl:px-2.5 xl:py-2 [&>span]:xl:px-1.5 [&>span]:xl:py-0 [&>span]:xl:text-[10px]">
                      <OperationsBadge
                        variant={verificationStatusBadgeVariant(
                          emp.verificationStatus,
                        )}
                      >
                        {emp.verificationStatusLabel}
                      </OperationsBadge>
                    </td>

                    <td className="px-3 py-3 font-semibold tabular-nums text-foreground sm:px-3.5 xl:px-2.5 xl:py-2 xl:text-[11px]">
                      {emp.totalJobsCount}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-3.5 xl:px-2.5 xl:py-2 [&>span]:xl:px-1.5 [&>span]:xl:py-0 [&>span]:xl:text-[10px]">
                      <OperationsBadge
                        variant={employerStatusBadgeVariant(emp.status)}
                      >
                        {emp.statusLabel}
                      </OperationsBadge>
                    </td>

                    <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right sm:pl-3.5 xl:py-2 xl:pl-2.5 xl:pr-3 xl:[&_button]:h-7 xl:[&_button]:min-h-0 xl:[&_a]:h-7 xl:[&_a]:px-2 xl:[&_a]:text-[10px] xl:[&_button.size-8]:size-7">
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
