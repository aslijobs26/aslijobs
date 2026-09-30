"use client";

import { useTranslate } from "@/i18n/translate";
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
  const t = useTranslate();

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
      aria-label={t("employer.jobs.bulkActionsAria")}
    >
      <p className="min-w-0 break-words text-sm font-semibold text-foreground">
        {t(
          selectedCount === 1
            ? "employer.jobs.jobSelected"
            : "employer.jobs.jobsSelected",
          { count: selectedCount.toLocaleString("en-IN") },
        )}
        {isFilteredSelection ? (
          <span className="ml-1 font-medium text-muted">
            ({t("employer.jobs.allFiltered")})
          </span>
        ) : null}
        {isAllSelection ? (
          <span className="ml-1 font-medium text-muted">
            ({t("employer.jobs.allJobsLower")})
          </span>
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
            {t("employer.jobs.selectAllFiltered")}
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
          {t("employer.jobs.clearSelection")}
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
              {t("employer.jobs.deleteSelected")}
            </button>
            <button
              type="button"
              onClick={onDeleteAll}
              disabled={isDeleting}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-pin-state/40 bg-surface px-3 text-xs font-semibold text-pin-state transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30 disabled:opacity-60"
            >
              {t("employer.jobs.deleteAllJobs")}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
