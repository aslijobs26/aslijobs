import { RotateCcw, Search } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { OPERATIONS_CANDIDATE_GENDER_FILTER_OPTIONS } from "../../../constants/operations-candidates";
import type {
  OperationsCandidateDatePreset,
  OperationsCandidateProfileStatus,
  OperationsCandidatesFilterOptions,
} from "../../../types/operations-candidates";
import { cn } from "../../../utils/cn";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";

export interface CandidatesFiltersState {
  search: string;
  location: string;
  experience: string;
  gender: string;
  preferredRole: string;
  profileStatus: "" | OperationsCandidateProfileStatus;
  applicationPresence: "" | "has" | "none";
  registrationPreset: OperationsCandidateDatePreset | "";
}

interface CandidatesFiltersBarProps {
  filters: CandidatesFiltersState;
  filterOptions: OperationsCandidatesFilterOptions;
  onChange: (next: Partial<CandidatesFiltersState>) => void;
  onClear: () => void;
}

const REGISTRATION_PRESET_OPTIONS: {
  value: OperationsCandidateDatePreset | "";
  label: string;
}[] = [
  { value: "", label: "Any Date" },
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
  "xl:!h-7 xl:!px-1.5 xl:!text-[9px]",
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

export function CandidatesFiltersBar({
  filters,
  filterOptions,
  onChange,
  onClear,
}: CandidatesFiltersBarProps) {
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
    filters.location,
    filters.experience,
    filters.gender,
    filters.preferredRole,
    filters.profileStatus,
    filters.applicationPresence,
    filters.registrationPreset,
  ].filter(Boolean).length;

  return (
    <div className="flex min-w-0 flex-col gap-2 max-sm:gap-2 xl:gap-1">
      <div className="flex min-w-0 flex-col gap-2 max-sm:gap-1.5 sm:flex-row sm:flex-wrap sm:items-center xl:gap-1.5">
        <form
          className="relative block w-full min-w-0 sm:min-w-[12rem] sm:max-w-xs sm:flex-1 xl:max-w-[14rem]"
          onSubmit={handleSearchSubmit}
        >
          <label className="block min-w-0">
            <span className="mb-1 block text-[8px] font-semibold uppercase tracking-wide text-muted sm:hidden">
              Search
            </span>
            <span className="sr-only">Search candidates</span>
            <span className="relative block min-w-0">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted xl:left-2 xl:size-3"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onBlur={applySearch}
                placeholder="Search by name, ID, or job…"
                autoComplete="off"
                spellCheck={false}
                className={cn(
                  "h-8 w-full rounded-md border border-border-subtle bg-surface py-1.5 pr-2.5 pl-8 text-[11px] text-foreground outline-none",
                  "placeholder:text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
                  "max-sm:h-8 max-sm:rounded-md max-sm:bg-hero-bg/60 max-sm:text-[10px] max-sm:font-medium max-sm:hover:bg-surface",
                  "xl:h-7 xl:pl-7 xl:pr-2 xl:text-[9px]",
                  "[appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
                )}
              />
            </span>
          </label>
        </form>

        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-8 min-h-8 w-full shrink-0 items-center justify-center gap-1 rounded-md border border-border-subtle bg-surface px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:h-8 max-sm:rounded-md max-sm:text-[10px] sm:w-auto xl:h-7 xl:gap-0.5 xl:px-2 xl:text-[9px]"
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
          "sm:grid sm:grid-cols-3 sm:gap-1.5 lg:grid-cols-4 xl:grid-cols-7 xl:gap-1",
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
                registrationPreset:
                  value as CandidatesFiltersState["registrationPreset"],
              })
            }
          />
        </FilterField>
        <FilterField label="Experience">
          <OperationsFilterSelect
            label="Experience"
            value={filters.experience}
            options={[
              { value: "", label: "All Experience" },
              ...filterOptions.experienceLevels.map((level) => ({
                value: level.toLowerCase(),
                label: level,
              })),
            ]}
            hideSearch
            mobileSheet
            triggerClassName={triggerClassName}
            onChange={(value) => onChange({ experience: value })}
          />
        </FilterField>
        <FilterField label="Gender">
          <OperationsFilterSelect
            label="Gender"
            value={filters.gender}
            options={
              filterOptions.genders.length > 0
                ? [
                    { value: "", label: "All Genders" },
                    ...filterOptions.genders,
                  ]
                : [...OPERATIONS_CANDIDATE_GENDER_FILTER_OPTIONS]
            }
            hideSearch
            mobileSheet
            triggerClassName={triggerClassName}
            onChange={(value) => onChange({ gender: value })}
          />
        </FilterField>
        <FilterField label="Preferred role">
          <OperationsFilterSelect
            label="Preferred role"
            value={filters.preferredRole}
            options={[
              { value: "", label: "All Roles" },
              ...filterOptions.preferredRoles.map((role) => ({
                value: role,
                label: role,
              })),
            ]}
            mobileSheet
            triggerClassName={triggerClassName}
            onChange={(value) => onChange({ preferredRole: value })}
          />
        </FilterField>
        <FilterField label="Location">
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
            mobileSheet
            triggerClassName={triggerClassName}
            onChange={(value) => onChange({ location: value })}
          />
        </FilterField>
        <FilterField label="Registration status">
          <OperationsFilterSelect
            label="Registration status"
            value={filters.profileStatus}
            options={[
              { value: "", label: "All Statuses" },
              ...(filterOptions.profileStatuses ?? [
                { value: "complete", label: "Complete" },
                { value: "incomplete", label: "Incomplete" },
              ]),
            ]}
            hideSearch
            mobileSheet
            triggerClassName={triggerClassName}
            onChange={(value) =>
              onChange({
                profileStatus: value as CandidatesFiltersState["profileStatus"],
              })
            }
          />
        </FilterField>
        <FilterField label="Applications">
          <OperationsFilterSelect
            label="Applications"
            value={filters.applicationPresence}
            options={[
              { value: "", label: "Any" },
              { value: "has", label: "Has applications" },
              { value: "none", label: "No applications" },
            ]}
            hideSearch
            mobileSheet
            triggerClassName={triggerClassName}
            onChange={(value) =>
              onChange({
                applicationPresence:
                  value as CandidatesFiltersState["applicationPresence"],
              })
            }
          />
        </FilterField>
      </div>
    </div>
  );
}
