import { RotateCcw, Search } from "lucide-react";
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

const triggerClassName = cn(
  "!h-8 !w-full !min-w-0 !rounded-md !px-2 !text-[11px] xl:!h-7 xl:!text-[10px]",
  "border-border-subtle bg-surface ops-brand-border-glow hover:bg-hero-bg/60",
);

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
    <div className="flex min-w-0 flex-col gap-2 xl:gap-1.5">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="relative block min-w-0 sm:min-w-[12rem] sm:max-w-xs sm:flex-1 xl:max-w-[14rem]">
          <span className="sr-only">Search employers</span>
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
            <span className="tabular-nums text-muted">({activeFilterCount})</span>
          </button>
        ) : null}
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
        <OperationsFilterSelect
          label="Registration date"
          value={filters.registrationPreset}
          options={REGISTRATION_PRESET_OPTIONS}
          hideSearch
          triggerClassName={triggerClassName}
          onChange={(value) =>
            onChange({
              registrationPreset: value as OperationsEmployerDatePreset | "",
            })
          }
        />
        <OperationsFilterSelect
          label="Verification"
          value={filters.verificationStatus}
          options={[
            { value: "", label: "All Verification" },
            ...options.verificationStatuses,
          ]}
          hideSearch
          triggerClassName={triggerClassName}
          onChange={(value) => onChange({ verificationStatus: value })}
        />
        <OperationsFilterSelect
          label="Employer type"
          value={filters.employerType}
          options={[
            { value: "", label: "All Types" },
            ...options.employerTypes,
          ]}
          triggerClassName={triggerClassName}
          onChange={(value) => onChange({ employerType: value })}
        />
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
          triggerClassName={triggerClassName}
          onChange={(value) => onChange({ location: value })}
        />
        <OperationsFilterSelect
          label="Status"
          value={filters.status}
          options={[
            { value: "", label: "All Statuses" },
            ...options.statuses,
          ]}
          hideSearch
          triggerClassName={triggerClassName}
          onChange={(value) => onChange({ status: value })}
        />
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
