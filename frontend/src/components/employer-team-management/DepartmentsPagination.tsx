"use client";

import {
  EMPLOYER_TEAM_DEFAULT_PAGE_SIZE,
  EMPLOYER_TEAM_PAGE_SIZE_OPTIONS,
} from "@/constants/employer-team-management";
import { ChevronLeft, ChevronRight } from "lucide-react";

type DepartmentsPaginationProps = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isLoading?: boolean;
  entityLabel?: string;
  /** Hide footer when total is below this value. Defaults to page size (10). */
  minTotalToShow?: number;
  showRowsPerPage?: boolean;
};

function pageNumbers(current: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const pages = new Set<number>([1, totalPages, current]);
  if (current > 1) pages.add(current - 1);
  if (current < totalPages) pages.add(current + 1);
  return [...pages].sort((a, b) => a - b);
}

export function DepartmentsPagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  isLoading = false,
  entityLabel = "departments",
  minTotalToShow = EMPLOYER_TEAM_DEFAULT_PAGE_SIZE,
  showRowsPerPage = true,
}: DepartmentsPaginationProps) {
  if (total < minTotalToShow && !isLoading) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages);
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const pages = pageNumbers(page, safeTotalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-border-subtle bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <p className="text-sm text-muted">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {start} to {end}
        </span>{" "}
        of <span className="font-semibold text-foreground">{total}</span>{" "}
        {entityLabel}
      </p>

      <nav
        aria-label={`${entityLabel} pagination`}
        className="flex items-center gap-1"
      >
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex size-8 items-center justify-center rounded-md border border-border-subtle bg-surface text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        {pages.map((pageNumber, index) => {
          const previous = pages[index - 1];
          const showEllipsis =
            previous != null && pageNumber - previous > 1;
          const isActive = pageNumber === page;
          return (
            <span key={pageNumber} className="contents">
              {showEllipsis ? (
                <span className="px-1 text-sm text-muted" aria-hidden="true">
                  …
                </span>
              ) : null}
              <button
                type="button"
                aria-label={`Page ${pageNumber}`}
                aria-current={isActive ? "page" : undefined}
                disabled={isLoading}
                onClick={() => onPageChange(pageNumber)}
                className={
                  isActive
                    ? "inline-flex size-8 items-center justify-center rounded-md border border-primary bg-primary text-sm font-semibold text-surface"
                    : "inline-flex size-8 items-center justify-center rounded-md border border-border-subtle bg-surface text-sm font-medium text-foreground hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                }
              >
                {pageNumber}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= safeTotalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex size-8 items-center justify-center rounded-md border border-border-subtle bg-surface text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </nav>

      {showRowsPerPage ? (
        <label className="flex items-center gap-2 text-sm text-muted">
          Rows per page
          <select
            value={limit}
            disabled={isLoading}
            onChange={(event) =>
              onLimitChange(
                Number(event.target.value) || EMPLOYER_TEAM_DEFAULT_PAGE_SIZE,
              )
            }
            className="h-8 rounded-md border border-border-subtle bg-surface px-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {EMPLOYER_TEAM_PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <span className="hidden sm:block sm:w-24" aria-hidden="true" />
      )}
    </div>
  );
}
