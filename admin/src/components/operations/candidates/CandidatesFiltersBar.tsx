import { Download, RotateCcw, Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
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
  preferredRole: string;
  profileStatus: "" | OperationsCandidateProfileStatus;
  registrationPreset: OperationsCandidateDatePreset | "";
}

interface CandidatesFiltersBarProps {
  filters: CandidatesFiltersState;
  filterOptions: OperationsCandidatesFilterOptions;
  onChange: (next: Partial<CandidatesFiltersState>) => void;
  onClear: () => void;
  onExport: () => void;
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

const controlSurfaceClassName =
  "border-border-subtle bg-hero-bg/60 ops-brand-border-glow hover:bg-surface";

const filterTriggerClassName = cn(
  "!h-10 !w-full !min-w-0 !rounded-lg sm:!h-9",
  controlSurfaceClassName,
);

export function CandidatesFiltersBar({
  filters,
  filterOptions,
  onChange,
  onClear,
  onExport,
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
    filters.preferredRole,
    filters.profileStatus,
    filters.registrationPreset,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;
  const canSubmitSearch = searchInput.trim() !== filters.search.trim();

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm ops-brand-border-glow sm:p-3.5">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end xl:gap-2.5">
        <form
          className="block w-full min-w-0 xl:w-[24rem] xl:min-w-[20rem] xl:max-w-[30rem] xl:shrink-0"
          onSubmit={handleSearchSubmit}
        >
          <label className="block w-full min-w-0">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted">
              Search
            </span>
            <span className="sr-only">Search candidates</span>
            <div className="relative">
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name, candidate ID, or job title…"
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
                aria-label="Search candidates"
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

        <div
          className="grid min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 xl:flex xl:min-w-0 xl:flex-1 xl:gap-2"
          role="group"
          aria-label="Candidate filters"
        >
          <div className="flex min-w-0 flex-col gap-1 xl:min-w-[8rem] xl:flex-1">
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
              Registration Date
            </span>
            <OperationsFilterSelect
              label="Registration Date"
              value={filters.registrationPreset}
              options={REGISTRATION_PRESET_OPTIONS}
              hideSearch
              className="w-full min-w-0"
              triggerClassName={filterTriggerClassName}
              onChange={(value) =>
                onChange({
                  registrationPreset:
                    value as CandidatesFiltersState["registrationPreset"],
                })
              }
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1 xl:min-w-[7rem] xl:flex-1">
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
              Experience
            </span>
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
              className="w-full min-w-0"
              triggerClassName={filterTriggerClassName}
              onChange={(value) => onChange({ experience: value })}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1 xl:min-w-[8rem] xl:flex-1">
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
              Preferred Role
            </span>
            <OperationsFilterSelect
              label="Preferred Role"
              value={filters.preferredRole}
              options={[
                { value: "", label: "All Roles" },
                ...filterOptions.preferredRoles.map((role) => ({
                  value: role,
                  label: role,
                })),
              ]}
              className="w-full min-w-0"
              triggerClassName={filterTriggerClassName}
              onChange={(value) => onChange({ preferredRole: value })}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1 xl:min-w-[7.5rem] xl:flex-1">
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
              Location
            </span>
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
              className="w-full min-w-0"
              triggerClassName={filterTriggerClassName}
              onChange={(value) => onChange({ location: value })}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1 xl:min-w-[7.5rem] xl:flex-1">
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
              Profile Status
            </span>
            <OperationsFilterSelect
              label="Profile Status"
              value={filters.profileStatus}
              options={[
                { value: "", label: "All Statuses" },
                ...(filterOptions.profileStatuses ?? [
                  { value: "complete", label: "Complete" },
                  { value: "incomplete", label: "Incomplete" },
                ]),
              ]}
              hideSearch
              className="w-full min-w-0"
              triggerClassName={filterTriggerClassName}
              onChange={(value) =>
                onChange({
                  profileStatus:
                    value as CandidatesFiltersState["profileStatus"],
                })
              }
            />
          </div>
        </div>

        <div className="grid min-w-0 shrink-0 grid-cols-2 gap-2 sm:flex sm:items-center xl:border-l xl:border-border-subtle xl:pl-3">
          <button
            type="button"
            onClick={onClear}
            disabled={!hasActiveFilters}
            className={cn(
              "inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-9 sm:px-2.5 sm:text-xs",
              hasActiveFilters
                ? "text-muted hover:bg-hero-bg hover:text-foreground"
                : "cursor-not-allowed text-muted/40",
            )}
          >
            <RotateCcw className="size-3.5 shrink-0" aria-hidden="true" />
            Reset
            {hasActiveFilters ? (
              <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-primary-light px-1 text-[10px] font-semibold text-primary">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-lg border border-border-subtle bg-surface px-2 text-[11px] font-semibold text-foreground transition-colors ops-brand-border-glow hover:border-primary/25 hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-9 sm:px-3 sm:text-xs"
          >
            <Download className="size-3.5 shrink-0" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
