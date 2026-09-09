import { MapPin } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { operationsVerificationReviewPath } from "../../../constants/operations-routes";
import type { OperationsVerificationListItem } from "../../../types/operations-verifications";
import { resolveMediaUrl } from "../../../utils/resolve-media-url";
import { OperationsBadge } from "../../ui/OperationsBadge";
import {
  employerAvatarInitials,
  formatEmployerDateTime,
} from "../employers/employers-format";
import { VerificationsMobileCard } from "./VerificationsMobileCard";
import { verificationOperationalStatusBadgeVariant } from "./verifications-format";

interface VerificationsTableSectionProps {
  items: OperationsVerificationListItem[];
  totalItems: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  toolbar?: ReactNode;
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
  "whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted first:pl-4 last:pr-4 sm:px-3.5 xl:px-2.5 xl:py-2 xl:text-[9px] xl:first:pl-3 xl:last:pr-3";

function submittedLabel(item: OperationsVerificationListItem): {
  date: string;
  time: string;
} {
  if (item.submittedAt) {
    return formatEmployerDateTime(item.submittedAt);
  }
  return {
    date: item.submittedAtDate || "—",
    time: "",
  };
}

export function VerificationsTableSection({
  items,
  totalItems,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  toolbar,
}: VerificationsTableSectionProps) {
  const emptyMessage = (
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground xl:text-xs">
        No verification submissions found
      </p>
      <p className="text-xs text-muted xl:text-[11px]">
        Try adjusting your search or tab filters.
      </p>
    </div>
  );

  const errorBlock = (
    <div className="space-y-2">
      <p className="text-sm font-medium text-danger xl:text-xs">
        {errorMessage ?? "Failed to load verifications."}
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
      <div className="border-b border-border-subtle px-3 py-2.5 sm:px-4 xl:px-3 xl:py-2">
        <div className="flex min-w-0 flex-col gap-2.5 xl:gap-2">
          <h2 className="text-sm font-semibold text-foreground xl:text-[13px]">
            Recent Verifications{" "}
            <span className="font-semibold tabular-nums text-muted xl:text-[12px]">
              ({totalItems.toLocaleString("en-IN")})
            </span>
          </h2>
          {toolbar}
        </div>
      </div>

      <ul className="flex flex-col gap-2.5 p-2.5 sm:hidden">
        {isLoading ? (
          <li className="px-2 py-10 text-center text-xs text-muted">
            Loading verifications…
          </li>
        ) : null}
        {!isLoading && isError ? (
          <li className="p-4 text-center">{errorBlock}</li>
        ) : null}
        {!isLoading && !isError && items.length === 0 ? (
          <li className="p-6 text-center">{emptyMessage}</li>
        ) : null}
        {!isLoading &&
          !isError &&
          items.map((item) => (
            <VerificationsMobileCard key={item.id} item={item} />
          ))}
      </ul>

      <div className="hidden overflow-x-auto overscroll-x-contain scrollbar-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:block">
        <table className="min-w-[1080px] text-left text-xs xl:min-w-full xl:text-[11px]">
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
                Submitted On
              </th>
              <th scope="col" className={thClassName}>
                Documents
              </th>
              <th scope="col" className={thClassName}>
                Status
              </th>
              <th scope="col" className={thClassName}>
                SLA
              </th>
              <th scope="col" className={thClassName}>
                Assigned To
              </th>
              <th scope="col" className={`${thClassName} text-right`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoading ? (
              <TableMessage>
                <span className="text-xs text-muted xl:text-[11px]">
                  Loading verifications…
                </span>
              </TableMessage>
            ) : null}
            {!isLoading && isError ? (
              <TableMessage>{errorBlock}</TableMessage>
            ) : null}
            {!isLoading && !isError && items.length === 0 ? (
              <TableMessage>{emptyMessage}</TableMessage>
            ) : null}
            {!isLoading &&
              !isError &&
              items.map((item) => {
                const logoUrl = resolveMediaUrl(item.logoUrl);
                const submitted = submittedLabel(item);
                const reviewPath = operationsVerificationReviewPath(item.id);
                const companyName =
                  item.companyName?.trim() ||
                  item.displayName?.trim() ||
                  "—";
                const canReview = item.allowedActions.canReview;
                const actionLabel = canReview ? "Review" : "View";

                return (
                  <tr
                    key={item.id}
                    className="align-middle transition-colors hover:bg-hero-bg/30"
                  >
                    <td className="max-w-[15rem] px-3 py-3 pl-4 sm:px-3.5 xl:max-w-[12rem] xl:px-2.5 xl:py-2 xl:pl-3">
                      <Link
                        to={reviewPath}
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
                        <span className="truncate text-xs font-semibold text-foreground hover:text-primary xl:text-[11px]">
                          {companyName}
                        </span>
                      </Link>
                    </td>

                    <td className="max-w-[9rem] px-3 py-3 text-foreground sm:px-3.5 xl:max-w-[7.5rem] xl:px-2.5 xl:py-2">
                      <span className="block truncate xl:text-[11px]">
                        {item.industry?.trim() || "—"}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-muted sm:px-3.5 xl:px-2.5 xl:py-2">
                      <span className="inline-flex max-w-[11rem] items-center gap-1 xl:max-w-[9rem]">
                        <MapPin
                          className="size-3 shrink-0 text-muted xl:size-2.5"
                          aria-hidden="true"
                        />
                        <span className="truncate xl:text-[11px]">
                          {item.location?.trim() &&
                          item.location.trim() !== "—"
                            ? item.location
                            : "Not specified"}
                        </span>
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 text-muted sm:px-3.5 xl:px-2.5 xl:py-2">
                      <span className="block font-medium text-foreground xl:text-[11px]">
                        {submitted.date}
                      </span>
                      {submitted.time ? (
                        <span className="block text-[11px] xl:text-[10px]">
                          {submitted.time}
                        </span>
                      ) : null}
                    </td>

                    <td className="px-3 py-3 font-semibold tabular-nums text-foreground sm:px-3.5 xl:px-2.5 xl:py-2 xl:text-[11px]">
                      {item.documentsLabel || "—"}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-3.5 xl:px-2.5 xl:py-2 [&>span]:xl:px-1.5 [&>span]:xl:py-0 [&>span]:xl:text-[10px]">
                      <OperationsBadge
                        variant={verificationOperationalStatusBadgeVariant(
                          item.operationalStatus,
                        )}
                      >
                        {item.statusLabel}
                      </OperationsBadge>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 tabular-nums text-foreground sm:px-3.5 xl:px-2.5 xl:py-2 xl:text-[11px]">
                      {item.slaLabel || "—"}
                    </td>

                    <td className="max-w-[8rem] px-3 py-3 text-muted sm:px-3.5 xl:max-w-[7rem] xl:px-2.5 xl:py-2">
                      <span className="block truncate xl:text-[11px]">
                        {item.assignedToLabel?.trim() || "—"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right sm:pl-3.5 xl:py-2 xl:pl-2.5 xl:pr-3">
                      <Link
                        to={reviewPath}
                        className="inline-flex h-8 items-center justify-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:h-7 xl:px-2 xl:text-[10px]"
                      >
                        {actionLabel}
                      </Link>
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
