"use client";

import {
  EMPLOYER_JOBS_PAGE_SIZE_OPTIONS,
} from "@/constants/employer-jobs";
import { cn } from "@/utils/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";

type EmployerJobsPaginationProps = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isLoading?: boolean;
};

export function EmployerJobsPagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  isLoading = false,
}: EmployerJobsPaginationProps) {
  if (total === 0 && !isLoading) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages);
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const pageNumbers = buildPageNumbers(page, safeTotalPages);

  return (
    <div className="flex flex-col gap-2.5 border-t border-border-subtle px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <p className="text-sm text-muted">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {start} to {end}
        </span>{" "}
        of <span className="font-semibold text-foreground">{total}</span> jobs
      </p>

      <div className="flex flex-wrap items-center gap-2.5">
        <nav aria-label="Jobs pagination" className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>

          {pageNumbers.map((pageNumber, index) => {
            if (pageNumber === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1 text-sm text-muted"
                  aria-hidden="true"
                >
                  …
                </span>
              );
            }

            const isCurrent = pageNumber === page;

            return (
              <button
                key={pageNumber}
                type="button"
                aria-label={`Page ${pageNumber}`}
                aria-current={isCurrent ? "page" : undefined}
                disabled={isLoading}
                onClick={() => onPageChange(pageNumber)}
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40",
                  isCurrent
                    ? "bg-primary-soft text-white"
                    : "border border-border bg-surface text-muted hover:bg-primary-light hover:text-foreground",
                )}
              >
                {pageNumber}
              </button>
            );
          })}

          <button
            type="button"
            aria-label="Next page"
            disabled={page >= safeTotalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </nav>

        <label className="inline-flex items-center gap-2 text-sm text-muted">
          <span>Rows per page</span>
          <select
            value={limit}
            disabled={isLoading}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="h-8 rounded-md border border-border bg-surface px-2 text-sm font-medium text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            {EMPLOYER_JOBS_PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function buildPageNumbers(
  current: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (current < totalPages - 2) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);
  return pages;
}
