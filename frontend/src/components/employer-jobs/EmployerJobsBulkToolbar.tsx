"use client";

import {
  EMPLOYER_JOBS_BULK_CLEAR_SELECTION,
  EMPLOYER_JOBS_BULK_DELETE_ALL,
  EMPLOYER_JOBS_BULK_DELETE_SELECTED,
  EMPLOYER_JOBS_BULK_SELECT_FILTERED,
} from "@/constants/employer-jobs";
import { cn } from "@/utils/cn";

type EmployerJobsBulkToolbarProps = {
  selectedCount: number;
  filteredTotal: number;
  isFilteredSelection: boolean;
  isAllSelection: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onClearSelection: () => void;
  onSelectFiltered: () => void;
  onDeleteSelected: () => void;
  onDeleteAll: () => void;
};

export function EmployerJobsBulkToolbar({
  selectedCount,
  filteredTotal,
  isFilteredSelection,
  isAllSelection,
  canDelete,
  isDeleting,
  onClearSelection,
  onSelectFiltered,
  onDeleteSelected,
  onDeleteAll,
}: EmployerJobsBulkToolbarProps) {
  if (selectedCount <= 0 && !isAllSelection) {
    return null;
  }

  const showSelectFiltered =
    !isFilteredSelection &&
    !isAllSelection &&
    filteredTotal > selectedCount &&
    filteredTotal > 0;

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3"
      role="region"
      aria-label="Bulk job actions"
    >
      <p className="text-sm font-semibold text-foreground">
        {selectedCount.toLocaleString("en-IN")}{" "}
        {selectedCount === 1 ? "Job Selected" : "Jobs Selected"}
        {isFilteredSelection ? (
          <span className="ml-1 font-medium text-muted">(all filtered)</span>
        ) : null}
        {isAllSelection ? (
          <span className="ml-1 font-medium text-muted">(all jobs)</span>
        ) : null}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {showSelectFiltered ? (
          <button
            type="button"
            onClick={onSelectFiltered}
            disabled={isDeleting}
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
          >
            {EMPLOYER_JOBS_BULK_SELECT_FILTERED}
            <span className="ml-1 text-muted">
              ({filteredTotal.toLocaleString("en-IN")})
            </span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={onClearSelection}
          disabled={isDeleting}
          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
        >
          {EMPLOYER_JOBS_BULK_CLEAR_SELECTION}
        </button>

        {canDelete ? (
          <>
            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={isDeleting || selectedCount <= 0}
              className={cn(
                "inline-flex min-h-9 items-center justify-center rounded-lg bg-pin-state px-3 text-xs font-semibold text-surface transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30 disabled:opacity-60",
              )}
            >
              {EMPLOYER_JOBS_BULK_DELETE_SELECTED}
            </button>
            <button
              type="button"
              onClick={onDeleteAll}
              disabled={isDeleting}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-pin-state/40 bg-surface px-3 text-xs font-semibold text-pin-state transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30 disabled:opacity-60"
            >
              {EMPLOYER_JOBS_BULK_DELETE_ALL}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
