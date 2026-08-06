"use client";

import { cn } from "@/utils/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ListPaginationProps = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  ariaLabel?: string;
  entityLabel?: string;
};

function buildPageItems(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: (number | "…")[] = [1];

  if (page > 3) {
    items.push("…");
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let current = start; current <= end; current += 1) {
    items.push(current);
  }

  if (page < totalPages - 2) {
    items.push("…");
  }

  items.push(totalPages);
  return items;
}

/**
 * Shared list pagination used by Job Seeker Saved Jobs / My Applications.
 * Keeps the existing “Showing X–Y of Z” pattern and page controls.
 */
export function ListPagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  isLoading = false,
  ariaLabel = "Pagination",
  entityLabel = "results",
}: ListPaginationProps) {
  if (total <= 0 || totalPages <= 1) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const start = (safePage - 1) * limit + 1;
  const end = Math.min(safePage * limit, total);
  const items = buildPageItems(safePage, safeTotalPages);

  return (
    <nav
      className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
      aria-label={ariaLabel}
    >
      <p className="text-sm text-muted">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {start}–{end}
        </span>{" "}
        of <span className="font-semibold text-foreground">{total}</span>{" "}
        {entityLabel}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1 || isLoading}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        {items.map((item, index) =>
          item === "…" ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex size-9 items-center justify-center text-sm text-muted"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              disabled={isLoading}
              aria-current={item === safePage ? "page" : undefined}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                "disabled:cursor-not-allowed disabled:opacity-60",
                item === safePage
                  ? "border-primary bg-primary text-surface"
                  : "border-border text-foreground hover:border-primary/40",
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= safeTotalPages || isLoading}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
