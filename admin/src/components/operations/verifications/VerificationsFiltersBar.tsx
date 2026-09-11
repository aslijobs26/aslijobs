import { RotateCcw, Search } from "lucide-react";
import type {
  OperationsVerificationListStatus,
  OperationsVerificationsFilterOptions,
  VerificationsDatePreset,
} from "../../../types/operations-verifications";
import { cn } from "../../../utils/cn";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";

export interface VerificationsFiltersState {
  search: string;
  status: OperationsVerificationListStatus | "";
  industry: string;
  location: string;
  submissionPreset: VerificationsDatePreset | "";
}

export const EMPTY_VERIFICATIONS_FILTERS: VerificationsFiltersState = {
  search: "",
  status: "",
  industry: "",
  location: "",
  submissionPreset: "",
};

interface VerificationsFiltersBarProps {
  filters: VerificationsFiltersState;
  filterOptions: OperationsVerificationsFilterOptions;
  onChange: (next: Partial<VerificationsFiltersState>) => void;
  onClear: () => void;
  /**
   * When an overview tab already pins status, show that value in the Status
   * control. Empty / undefined = use filters.status.
   */
  statusOverride?: OperationsVerificationListStatus | "";
}

const SUBMISSION_PRESET_OPTIONS: {
  value: VerificationsDatePreset | "";
  label: string;
}[] = [
  { value: "", label: "All Dates" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
];

const FALLBACK_STATUS_OPTIONS: {
  value: OperationsVerificationListStatus | "";
  label: string;
}[] = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

const triggerClassName = cn(
  "!h-8 !w-full !min-w-0 !rounded-md !px-2 !text-[11px] xl:!h-7 xl:!text-[10px]",
  "border-border-subtle bg-surface ops-brand-border-glow hover:bg-hero-bg/60",
);

export function VerificationsFiltersBar({
  filters,
  filterOptions,
  onChange,
  onClear,
  statusOverride,
}: VerificationsFiltersBarProps) {
  const statusValue =
    statusOverride !== undefined && statusOverride !== ""
      ? statusOverride
      : filters.status;

  const statusOptions =
    filterOptions.statuses.length > 0
      ? [
          { value: "", label: "All Statuses" },
          ...filterOptions.statuses.map((option) => ({
            value: option.value as OperationsVerificationListStatus | "",
            label: option.label,
          })),
        ]
      : FALLBACK_STATUS_OPTIONS;

  const activeFilterCount = [
    filters.search.trim(),
    statusOverride ? "" : filters.status,
    filters.industry,
    filters.location,
    filters.submissionPreset,
  ].filter(Boolean).length;

  return (
    <div className="flex min-w-0 flex-col gap-2 xl:gap-1.5">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="relative block min-w-0 sm:min-w-[12rem] sm:max-w-xs sm:flex-1 xl:max-w-[14rem]">
          <span className="sr-only">Search verifications</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted xl:size-3"
            aria-hidden="true"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Search employers"
            autoComplete="off"
            spellCheck={false}
            className={cn(
              "h-8 w-full rounded-md border border-border-subtle bg-surface py-1.5 pr-2.5 pl-8 text-[11px] text-foreground outline-none",
              "placeholder:text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
              "xl:h-7 xl:pl-7 xl:text-[10px]",
              "[appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
            )}
          />
        </label>

        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md border border-border-subtle bg-surface px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:h-7 xl:text-[10px]"
          >
            <RotateCcw className="size-3 xl:size-2.5" aria-hidden="true" />
            Reset
            <span className="tabular-nums text-muted">
              ({activeFilterCount})
            </span>
          </button>
        ) : null}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
        <OperationsFilterSelect
          label="Status"
          value={statusValue}
          options={statusOptions}
          hideSearch
          triggerClassName={triggerClassName}
          onChange={(value) =>
            onChange({
              status: value as OperationsVerificationListStatus | "",
            })
          }
        />
        <OperationsFilterSelect
          label="Industry"
          value={filters.industry}
          options={[
            { value: "", label: "All Industries" },
            ...filterOptions.industries,
          ]}
          triggerClassName={triggerClassName}
          onChange={(industry) => onChange({ industry })}
        />
        <OperationsFilterSelect
          label="Location"
          value={filters.location}
          options={[
            { value: "", label: "All Locations" },
            ...filterOptions.locations.map((location) => ({
              value: location,
              label: location,
            })),
          ]}
          triggerClassName={triggerClassName}
          onChange={(location) => onChange({ location })}
        />
        <OperationsFilterSelect
          label="Submission date"
          value={filters.submissionPreset}
          options={SUBMISSION_PRESET_OPTIONS}
          hideSearch
          triggerClassName={triggerClassName}
          onChange={(value) =>
            onChange({
              submissionPreset: value as VerificationsDatePreset | "",
            })
          }
        />
      </div>
    </div>
  );
}
