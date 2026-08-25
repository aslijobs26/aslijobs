import { Download, RotateCcw, Search } from "lucide-react";
import type {
  OperationsApplicationStatus,
  OperationsCandidatesFilterOptions,
} from "../../../types/operations-candidates";
import { cn } from "../../../utils/cn";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";

export interface CandidatesFiltersState {
  search: string;
  status: "" | OperationsApplicationStatus;
  jobId: string;
  employerId: string;
  location: string;
  experience: string;
  gender: string;
}

interface CandidatesFiltersBarProps {
  filters: CandidatesFiltersState;
  filterOptions: OperationsCandidatesFilterOptions;
  onChange: (next: Partial<CandidatesFiltersState>) => void;
  onClear: () => void;
  onExport: () => void;
}

const STATUS_OPTIONS: {
  value: "" | OperationsApplicationStatus;
  label: string;
}[] = [
  { value: "", label: "All Status" },
  { value: "submitted", label: "Applied" },
  { value: "viewed", label: "Viewed" },
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "interview_completed", label: "Interview Completed" },
  { value: "offer_sent", label: "Offer Sent" },
  { value: "selected", label: "Selected" },
  { value: "joined", label: "Joined" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
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
  const activeFilterCount = [
    filters.search,
    filters.status,
    filters.jobId,
    filters.employerId,
    filters.location,
    filters.experience,
    filters.gender,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm ops-brand-border-glow sm:p-3.5">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end xl:gap-2.5">
        <label className="block w-full min-w-0 xl:w-[22rem] xl:min-w-[20rem] xl:max-w-[28rem] xl:shrink-0">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted">
            Search
          </span>
          <span className="sr-only">Search candidates</span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
              placeholder="Search by candidate name, ID, or job title…"
              autoComplete="off"
              spellCheck={false}
              className={cn(
                "ops-brand-border-glow h-10 w-full rounded-lg border border-border-subtle bg-hero-bg/60 py-2 pl-9 pr-3 text-xs font-medium text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:font-normal placeholder:text-muted sm:h-9",
                "hover:border-primary/25 hover:bg-surface",
                "focus-visible:border-primary focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-primary/30",
              )}
            />
          </div>
        </label>

        <div
          className="grid min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 xl:flex xl:min-w-0 xl:flex-1 xl:gap-2"
          role="group"
          aria-label="Candidate filters"
        >
          <div className="flex min-w-0 flex-col gap-1 xl:min-w-[7.5rem] xl:flex-1">
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
              Job
            </span>
            <OperationsFilterSelect
              label="Job"
              value={filters.jobId}
              options={[
                { value: "", label: "All Jobs" },
                ...filterOptions.jobs,
              ]}
              className="w-full min-w-0"
              triggerClassName={filterTriggerClassName}
              onChange={(value) => onChange({ jobId: value })}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1 xl:min-w-[7.5rem] xl:flex-1">
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
              Employer
            </span>
            <OperationsFilterSelect
              label="Employer"
              value={filters.employerId}
              options={[
                { value: "", label: "All Employers" },
                ...filterOptions.employers,
              ]}
              className="w-full min-w-0"
              triggerClassName={filterTriggerClassName}
              onChange={(value) => onChange({ employerId: value })}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1 xl:min-w-[7.5rem] xl:flex-1">
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
              Status
            </span>
            <OperationsFilterSelect
              label="Status"
              value={filters.status}
              options={STATUS_OPTIONS}
              hideSearch
              className="w-full min-w-0"
              triggerClassName={filterTriggerClassName}
              onChange={(value) =>
                onChange({
                  status: value as CandidatesFiltersState["status"],
                })
              }
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
          {filterOptions.genders.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-1 xl:min-w-[7rem] xl:flex-1">
              <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
                Gender
              </span>
              <OperationsFilterSelect
                label="Gender"
                value={filters.gender}
                options={[
                  { value: "", label: "All Genders" },
                  ...filterOptions.genders.map((gender) => ({
                    value: gender,
                    label: gender.replaceAll("_", " "),
                  })),
                ]}
                hideSearch
                className="w-full min-w-0"
                triggerClassName={filterTriggerClassName}
                onChange={(value) => onChange({ gender: value })}
              />
            </div>
          ) : null}
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
