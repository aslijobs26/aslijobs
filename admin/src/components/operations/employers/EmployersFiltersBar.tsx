import { Download, RotateCcw, Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type {
  OperationsEmployerDatePreset,
  OperationsEmployersFilterOptions,
} from "../../../types/operations-employers";
import { cn } from "../../../utils/cn";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";

export interface EmployersFiltersState {
  search: string;
  verificationStatus: string;
  employerType: string;
  location: string;
  status: string;
  registrationPreset: OperationsEmployerDatePreset | "";
}

interface EmployersFiltersBarProps {
  filters: EmployersFiltersState;
  filterOptions: OperationsEmployersFilterOptions;
  onChange: (next: Partial<EmployersFiltersState>) => void;
  onClear: () => void;
  onExport: () => void;
}

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

const controlSurfaceClassName =
  "border-border-subtle bg-hero-bg/60 ops-brand-border-glow hover:bg-surface";

const filterTriggerClassName = cn(
  "!h-10 !w-full !min-w-0 !rounded-lg sm:!h-9",
  controlSurfaceClassName,
);

export function EmployersFiltersBar({
  filters,
  filterOptions,
  onChange,
  onClear,
  onExport,
}: EmployersFiltersBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const applySearch = () => {
    onChange({ search: searchInput.trim() });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applySearch();
  };

  const activeFilterCount = [
    filters.search.trim() || searchInput.trim(),
    filters.verificationStatus,
    filters.employerType,
    filters.location,
    filters.status,
    filters.registrationPreset,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;
  const canSubmitSearch = searchInput.trim() !== filters.search.trim();

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm ops-brand-border-glow sm:p-3.5">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end xl:gap-2.5">
        <form
          className="block w-full min-w-0 xl:w-[22rem] xl:min-w-[18rem] xl:max-w-[28rem] xl:shrink-0"
          onSubmit={handleSearchSubmit}
        >
          <label className="block w-full min-w-0">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted">
              Search
            </span>
            <span className="sr-only">Search employers</span>
            <div className="relative">
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by employer name, email, phone or organization…"
                autoComplete="off"
                spellCheck={false}
                className={cn(
                  "ops-brand-border-glow h-10 w-full rounded-lg border border-border-subtle bg-hero-bg/60 py-2 pl-3 pr-11 text-xs font-medium text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:font-normal placeholder:text-muted sm:h-9",
                  "hover:border-primary/25 hover:bg-surface",
                  "focus-visible:border-primary focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-primary/30",
                  "[appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
                )}
              />
              <button
                type="submit"
                aria-label="Search employers"
                title="Search"
                className={cn(
                  "absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md transition-colors",
                  "text-muted hover:bg-primary-light hover:text-primary",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  canSubmitSearch && "text-primary",
                )}
              >
                <Search className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </label>
        </form>

        <div className="grid min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:flex xl:min-w-0 xl:flex-1 xl:gap-2">
          {/* Registration Date Filter */}
          <div className="flex min-w-0 flex-col gap-1 xl:min-w-[8rem] xl:flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Registration Date
            </span>
            <OperationsFilterSelect
              label="All Dates"
              value={filters.registrationPreset}
              options={REGISTRATION_PRESET_OPTIONS}
              hideSearch
              triggerClassName={filterTriggerClassName}
              onChange={(value) =>
                onChange({
                  registrationPreset:
                    value as OperationsEmployerDatePreset | "",
                })
              }
            />
          </div>

          {/* Verification Status */}
          <div className="flex min-w-0 flex-col gap-1 xl:min-w-[8rem] xl:flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Verification Status
            </span>
            <OperationsFilterSelect
              label="All Verification"
              value={filters.verificationStatus}
              options={[
                { value: "", label: "All Verification" },
                ...filterOptions.verificationStatuses,
              ]}
              hideSearch
              triggerClassName={filterTriggerClassName}
              onChange={(value) => onChange({ verificationStatus: value })}
            />
          </div>

          {/* Employer Type */}
          <div className="flex min-w-0 flex-col gap-1 xl:min-w-[8rem] xl:flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Employer Type
            </span>
            <OperationsFilterSelect
              label="All Types"
              value={filters.employerType}
              options={[
                { value: "", label: "All Types" },
                ...filterOptions.employerTypes,
              ]}
              triggerClassName={filterTriggerClassName}
              onChange={(value) => onChange({ employerType: value })}
            />
          </div>

          {/* Location */}
          <div className="flex min-w-0 flex-col gap-1 xl:min-w-[8rem] xl:flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Location
            </span>
            <OperationsFilterSelect
              label="All Locations"
              value={filters.location}
              options={[
                { value: "", label: "All Locations" },
                ...filterOptions.locations.map((loc) => ({
                  value: loc,
                  label: loc,
                })),
              ]}
              triggerClassName={filterTriggerClassName}
              onChange={(value) => onChange({ location: value })}
            />
          </div>

          {/* Status */}
          <div className="flex min-w-0 flex-col gap-1 xl:min-w-[7.5rem] xl:flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Status
            </span>
            <OperationsFilterSelect
              label="All Statuses"
              value={filters.status}
              options={[
                { value: "", label: "All Statuses" },
                ...filterOptions.statuses,
              ]}
              hideSearch
              triggerClassName={filterTriggerClassName}
              onChange={(value) => onChange({ status: value })}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full shrink-0 items-center gap-2 pt-1 min-[420px]:w-auto xl:pt-0">
          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-9 min-[420px]:flex-initial"
          >
            <Download className="size-3.5" aria-hidden="true" />
            Export
          </button>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-9 min-[420px]:flex-initial"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
