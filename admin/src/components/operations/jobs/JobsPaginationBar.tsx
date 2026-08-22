import { ChevronLeft, ChevronRight } from "lucide-react";
import type { OperationsJobsPagination } from "../../../types/operations-jobs";
import { cn } from "../../../utils/cn";
import { OperationsFilterSelect } from "./OperationsFilterSelect";

const ROWS_PER_PAGE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
] as const;

interface JobsPaginationBarProps {
  pagination: OperationsJobsPagination;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  ariaLabel?: string;
}

/**
 * Builds a compact page list matching the reference pattern:
 * 1 2 3 4 5 … N  (near the start)
 * 1 … 4 5 6 … N  (in the middle)
 * 1 … N-4 … N    (near the end)
 */
function buildPageItems(current: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 1) {
    return totalPages === 1 ? [1] : [];
  }

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (current >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", totalPages];
}

const pageButtonBase =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md border text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export function JobsPaginationBar({
  pagination,
  onPageChange,
  onLimitChange,
  ariaLabel = "Jobs pagination",
}: JobsPaginationBarProps) {
  const { page, limit, total, totalPages, hasNextPage, hasPreviousPage } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const pageItems = buildPageItems(page, totalPages);

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="min-w-0 text-center text-[11px] text-muted sm:text-left">
        {from.toLocaleString("en-IN")} to {to.toLocaleString("en-IN")} of{" "}
        {total.toLocaleString("en-IN")}
      </p>

      <div className="flex min-w-0 flex-col gap-2 min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:items-center min-[480px]:justify-end sm:gap-2">
        <nav
          className="flex max-w-full flex-wrap items-center justify-center gap-1.5"
          aria-label={ariaLabel}
        >
          <button
            type="button"
            aria-label="Previous page"
            disabled={!hasPreviousPage}
            onClick={() => onPageChange(page - 1)}
            className={cn(
              pageButtonBase,
              "border-border bg-surface text-foreground hover:bg-primary-light",
              "disabled:cursor-not-allowed disabled:bg-surface disabled:text-border disabled:hover:bg-surface",
            )}
          >
            <ChevronLeft className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </button>

          {pageItems.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                aria-hidden="true"
                className={cn(
                  pageButtonBase,
                  "pointer-events-none border-border bg-surface text-foreground",
                )}
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                onClick={() => onPageChange(item)}
                className={cn(
                  pageButtonBase,
                  item === page
                    ? "border-primary bg-primary-light text-foreground"
                    : "border-border bg-surface text-foreground hover:bg-primary-light",
                )}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            aria-label="Next page"
            disabled={!hasNextPage}
            onClick={() => onPageChange(page + 1)}
            className={cn(
              pageButtonBase,
              "border-border bg-surface text-foreground hover:bg-primary-light",
              "disabled:cursor-not-allowed disabled:bg-surface disabled:text-border disabled:hover:bg-surface",
            )}
          >
            <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </button>
        </nav>

        <OperationsFilterSelect
          label="Rows per page"
          value={String(limit)}
          options={ROWS_PER_PAGE_OPTIONS}
          hideSearch
          className="w-[4.5rem]"
          onChange={(value) => onLimitChange(Number(value))}
        />
      </div>
    </div>
  );
}
