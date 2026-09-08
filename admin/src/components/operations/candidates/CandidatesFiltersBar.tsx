import { RotateCcw, Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
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

const triggerClassName = cn(
  "!h-8 !w-full !min-w-0 !rounded-md !px-2 !text-[11px] xl:!h-7 xl:!px-1.5 xl:!text-[9px]",
  "border-border-subtle bg-surface ops-brand-border-glow hover:bg-hero-bg/60",
);

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
    <div className="flex min-w-0 flex-col gap-2 xl:gap-1">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:gap-1.5">
        <form
          className="relative block min-w-0 sm:min-w-[12rem] sm:max-w-xs sm:flex-1 xl:max-w-[14rem]"
          onSubmit={handleSearchSubmit}
        >
          <label className="block min-w-0">
            <span className="sr-only">Search candidates</span>
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
                "xl:h-7 xl:pl-7 xl:pr-2 xl:text-[9px]",
                "[appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
              )}
            />
          </label>
        </form>

        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md border border-border-subtle bg-surface px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:h-7 xl:gap-0.5 xl:px-2 xl:text-[9px]"
          >
            <RotateCcw className="size-3 xl:size-2.5" aria-hidden="true" />
            Reset
            <span className="tabular-nums text-muted">({activeFilterCount})</span>
          </button>
        ) : null}
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 xl:gap-1">
        <OperationsFilterSelect
          label="Registration date"
          value={filters.registrationPreset}
          options={REGISTRATION_PRESET_OPTIONS}
          hideSearch
          triggerClassName={triggerClassName}
          onChange={(value) =>
            onChange({
              registrationPreset:
                value as CandidatesFiltersState["registrationPreset"],
            })
          }
        />
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
          triggerClassName={triggerClassName}
          onChange={(value) => onChange({ experience: value })}
        />
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
          triggerClassName={triggerClassName}
          onChange={(value) => onChange({ gender: value })}
        />
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
          triggerClassName={triggerClassName}
          onChange={(value) => onChange({ preferredRole: value })}
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
          onChange={(value) => onChange({ location: value })}
        />
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
          triggerClassName={triggerClassName}
          onChange={(value) =>
            onChange({
              profileStatus: value as CandidatesFiltersState["profileStatus"],
            })
          }
        />
        <OperationsFilterSelect
          label="Applications"
          value={filters.applicationPresence}
          options={[
            { value: "", label: "Any" },
            { value: "has", label: "Has applications" },
            { value: "none", label: "No applications" },
          ]}
          hideSearch
          triggerClassName={triggerClassName}
          onChange={(value) =>
            onChange({
              applicationPresence:
                value as CandidatesFiltersState["applicationPresence"],
            })
          }
        />
      </div>
    </div>
  );
}
