import { RotateCcw, Search } from "lucide-react";
import type { ReactNode } from "react";
import type {
  OperationsEmployerDatePreset,
  OperationsEmployersFilterOptions,
} from "../../../types/operations-employers";
import { cn } from "../../../utils/cn";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";

export interface EmployersTableFiltersState {
  search: string;
  verificationStatus: string;
  employerType: string;
  location: string;
  status: string;
  registrationPreset: OperationsEmployerDatePreset | "";
}

interface EmployersTableFiltersProps {
  filters: EmployersTableFiltersState;
  filterOptions: OperationsEmployersFilterOptions;
  onChange: (next: Partial<EmployersTableFiltersState>) => void;
  onClear: () => void;
}

const EMPTY_FILTER_OPTIONS: OperationsEmployersFilterOptions = {
  verificationStatuses: [
    { value: "verified", label: "Verified" },
    { value: "pending", label: "Pending" },
    { value: "rejected", label: "Rejected" },
  ],
  employerTypes: [],
  locations: [],
  statuses: [
    { value: "active", label: "Active" },
    { value: "suspended", label: "Suspended" },
    { value: "inactive", label: "Inactive" },
  ],
};

const REGISTRATION_PRESET_OPTIONS: {
  value: OperationsEmployerDatePreset | "";
  label: string;
}[] = [
  { value: "", label: "All Dates" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
];

/** Mobile chip + desktop/laptop compact triggers. */
const triggerClassName = cn(
  "!h-8 !min-w-[7.75rem] !w-[7.75rem] !rounded-md !px-2 !text-[10px] !font-medium",
  "border-border-subtle bg-hero-bg/60 ops-brand-border-glow hover:bg-surface",
  "sm:!h-8 sm:!min-w-0 sm:!w-full sm:!rounded-md sm:!px-2 sm:!text-[11px] sm:bg-surface sm:hover:bg-hero-bg/60",
  "xl:!h-7 xl:!px-1.5 xl:!text-[10px]",
);

function FilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-0.5 max-sm:w-[7.75rem] max-sm:shrink-0",
        className,
      )}
    >
      <span className="truncate text-[8px] font-semibold uppercase tracking-wide text-muted sm:hidden">
        {label}
      </span>
      {children}
    </div>
  );
}

export function EmployersTableFilters({
  filters,
  filterOptions,
  onChange,
  onClear,
}: EmployersTableFiltersProps) {
  const options = {
    verificationStatuses:
      filterOptions.verificationStatuses.length > 0
        ? filterOptions.verificationStatuses
        : EMPTY_FILTER_OPTIONS.verificationStatuses,
    employerTypes: filterOptions.employerTypes,
    locations: filterOptions.locations,
    statuses:
      filterOptions.statuses.length > 0
        ? filterOptions.statuses
        : EMPTY_FILTER_OPTIONS.statuses,
  };

  const activeFilterCount = [
    filters.search.trim(),
    filters.verificationStatus,
    filters.employerType,
    filters.location,
    filters.status,
    filters.registrationPreset,
  ].filter(Boolean).length;

  return (
    <div className="flex min-w-0 flex-col gap-2 max-sm:gap-2 xl:gap-1.5">
      <div className="flex min-w-0 flex-col gap-2 max-sm:gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="relative block w-full min-w-0 sm:min-w-[12rem] sm:max-w-xs sm:flex-1 xl:max-w-[14rem]">
          <span className="mb-1 block text-[8px] font-semibold uppercase tracking-wide text-muted sm:hidden">
            Search
          </span>
          <span className="sr-only">Search employers</span>
          <span className="relative block min-w-0">
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
                "max-sm:bg-hero-bg/60 max-sm:text-[10px] max-sm:font-medium max-sm:hover:bg-surface",
                "xl:h-7 xl:pl-7 xl:text-[10px]",
                "[appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
              )}
            />
          </span>
        </label>

        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-8 min-h-8 w-full shrink-0 items-center justify-center gap-1 rounded-md border border-border-subtle bg-surface px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:text-[10px] sm:w-auto xl:h-7 xl:text-[10px]"
          >
            <RotateCcw className="size-3 xl:size-2.5" aria-hidden="true" />
            Reset
            <span className="tabular-nums text-muted">({activeFilterCount})</span>
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          "min-w-0",
          /* Mobile: horizontal chip scroller */
          "max-sm:-mx-0.5 max-sm:flex max-sm:flex-nowrap max-sm:items-end max-sm:gap-1.5 max-sm:overflow-x-auto max-sm:overscroll-x-contain max-sm:px-0.5 max-sm:pb-0.5 max-sm:scrollbar-hidden",
          /* Tablet+ / desktop: existing grid */
          "sm:grid sm:grid-cols-3 sm:gap-1.5 lg:grid-cols-5",
        )}
      >
        <FilterField label="Registration date">
          <OperationsFilterSelect
            label="Registration date"
            value={filters.registrationPreset}
            options={REGISTRATION_PRESET_OPTIONS}
            hideSearch
            mobileSheet
            triggerClassName={triggerClassName}
            onChange={(value) =>
              onChange({
                registrationPreset: value as OperationsEmployerDatePreset | "",
              })
            }
          />
        </FilterField>
        <FilterField label="Verification">
          <OperationsFilterSelect
            label="Verification"
            value={filters.verificationStatus}
            options={[
              { value: "", label: "All Verification" },
              ...options.verificationStatuses,
            ]}
            hideSearch
            mobileSheet
            triggerClassName={triggerClassName}
            onChange={(value) => onChange({ verificationStatus: value })}
          />
        </FilterField>
        <FilterField label="Employer type">
          <OperationsFilterSelect
            label="Employer type"
            value={filters.employerType}
            options={[
              { value: "", label: "All Types" },
              ...options.employerTypes,
            ]}
            mobileSheet
            triggerClassName={triggerClassName}
            onChange={(value) => onChange({ employerType: value })}
          />
        </FilterField>
        <FilterField label="Location">
          <OperationsFilterSelect
            label="Location"
            value={filters.location}
            options={[
              { value: "", label: "All Locations" },
              ...options.locations.map((loc) => ({
                value: loc,
                label: loc,
              })),
            ]}
            mobileSheet
            triggerClassName={triggerClassName}
            onChange={(value) => onChange({ location: value })}
          />
        </FilterField>
        <FilterField label="Status">
          <OperationsFilterSelect
            label="Status"
            value={filters.status}
            options={[
              { value: "", label: "All Statuses" },
              ...options.statuses,
            ]}
            hideSearch
            mobileSheet
            triggerClassName={triggerClassName}
            onChange={(value) => onChange({ status: value })}
          />
        </FilterField>
      </div>
    </div>
  );
}

export const EMPTY_EMPLOYERS_TABLE_FILTERS: EmployersTableFiltersState = {
  search: "",
  verificationStatus: "",
  employerType: "",
  location: "",
  status: "",
  registrationPreset: "",
};
