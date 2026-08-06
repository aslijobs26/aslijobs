"use client";

import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import {
  DEFAULT_SAVED_CANDIDATE_SORT,
  SAVED_CANDIDATE_PRESET_TAG_LABELS,
  SAVED_CANDIDATE_PRESET_TAG_VALUES,
  SAVED_CANDIDATE_PRIORITIES,
  SAVED_CANDIDATE_PRIORITY_LABELS,
  SAVED_CANDIDATE_SORT_OPTIONS,
} from "@/constants/saved-candidates";
import { POST_JOB_EXPERIENCE_OPTIONS } from "@/constants/post-job";
import {
  EMPLOYER_AVAILABILITY_FILTER_LABELS,
  EMPLOYER_AVAILABILITY_FILTERS,
  type EmployerAvailabilityFilterValue,
} from "@/types/employer-applications";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import type {
  SavedCandidatePriority,
  SavedCandidateSort,
  SavedCandidatesViewMode,
} from "@/types/saved-candidates";
import { cn } from "@/utils/cn";
import {
  ChevronDown,
  Download,
  LayoutGrid,
  List,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useId, useMemo, useState } from "react";

type JobOption = {
  publicJobId: string;
  jobTitle: string;
};

type SavedCandidatesToolbarProps = {
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onSearchSubmit: () => void;
  publicJobId: string;
  onJobChange: (publicJobId: string) => void;
  jobOptions: JobOption[];
  location: string;
  onLocationChange: (value: string) => void;
  experience: string;
  onExperienceChange: (value: string) => void;
  availability: EmployerAvailabilityFilterValue;
  onAvailabilityChange: (value: EmployerAvailabilityFilterValue) => void;
  priority: SavedCandidatePriority | "";
  onPriorityChange: (value: SavedCandidatePriority | "") => void;
  tag: string;
  onTagChange: (value: string) => void;
  sort: SavedCandidateSort;
  onSortChange: (value: SavedCandidateSort) => void;
  viewMode: SavedCandidatesViewMode;
  onViewModeChange: (mode: SavedCandidatesViewMode) => void;
  onOpenExportModal: () => void;
  onOpenAddModal: () => void;
  canAdd: boolean;
  canExport: boolean;
};

const searchControlClassName =
  "h-9 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-xs text-foreground shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted/80 hover:border-primary/25 focus:border-primary-soft focus:ring-2 focus:ring-primary-soft/20 sm:h-10 sm:text-sm";

const filterControlClassName =
  "h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-xs leading-tight text-foreground shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted/80 hover:border-primary/25 focus:border-primary-soft focus:ring-2 focus:ring-primary-soft/20 sm:h-10 sm:rounded-xl sm:px-3 2xl:text-sm";

const selectTriggerClassName =
  "!h-9 w-full rounded-lg border-border bg-surface !text-xs !leading-tight shadow-sm transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:border-primary-soft focus-visible:ring-2 focus-visible:ring-primary-soft/20 sm:!h-10 sm:rounded-xl 2xl:!text-sm";

const primaryActionButtonClassName =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-10 sm:gap-2 sm:px-3.5 sm:text-sm";

const filterActionButtonClassName =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-10 sm:rounded-xl sm:px-3 2xl:text-sm";

type MobileFilterKey =
  | "job"
  | "location"
  | "experience"
  | "availability"
  | "priority"
  | "tag"
  | "sort";

function optionLabel(
  options: EmployerRegisterSelectOption[],
  value: string,
): string | undefined {
  return options.find((option) => option.value === value)?.label;
}

export function SavedCandidatesToolbar({
  searchDraft,
  onSearchDraftChange,
  onSearchSubmit,
  publicJobId,
  onJobChange,
  jobOptions,
  location,
  onLocationChange,
  experience,
  onExperienceChange,
  availability,
  onAvailabilityChange,
  priority,
  onPriorityChange,
  tag,
  onTagChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenExportModal,
  onOpenAddModal,
  canAdd,
  canExport,
}: SavedCandidatesToolbarProps) {
  const searchId = useId();
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(
    Boolean(tag) || Boolean(priority),
  );
  const [mobileOpenFilter, setMobileOpenFilter] =
    useState<MobileFilterKey | null>(null);
  const mobileFilterPanelId = useId();

  const jobSelectOptions = useMemo<EmployerRegisterSelectOption[]>(
    () => [
      { value: "", label: "All job titles" },
      ...jobOptions.map((job) => ({
        value: job.publicJobId,
        label: job.jobTitle.trim() || "Untitled job",
        description: job.publicJobId,
      })),
    ],
    [jobOptions],
  );

  const experienceOptions = useMemo<EmployerRegisterSelectOption[]>(
    () => [
      { value: "", label: "All experience" },
      ...POST_JOB_EXPERIENCE_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    ],
    [],
  );

  const availabilityOptions = useMemo<EmployerRegisterSelectOption[]>(
    () => [
      { value: "", label: "All availability" },
      ...EMPLOYER_AVAILABILITY_FILTERS.map((key) => ({
        value: key,
        label: EMPLOYER_AVAILABILITY_FILTER_LABELS[key],
      })),
    ],
    [],
  );

  const priorityOptions = useMemo<EmployerRegisterSelectOption[]>(
    () => [
      { value: "", label: "All priorities" },
      ...SAVED_CANDIDATE_PRIORITIES.map((value) => ({
        value,
        label: SAVED_CANDIDATE_PRIORITY_LABELS[value],
      })),
    ],
    [],
  );

  const tagOptions = useMemo<EmployerRegisterSelectOption[]>(
    () => [
      { value: "", label: "All tags" },
      ...SAVED_CANDIDATE_PRESET_TAG_VALUES.map((value) => ({
        value,
        label: SAVED_CANDIDATE_PRESET_TAG_LABELS[value],
      })),
    ],
    [],
  );

  const sortOptions = useMemo<EmployerRegisterSelectOption[]>(
    () =>
      SAVED_CANDIDATE_SORT_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [],
  );

  const moreFilterCount = Number(Boolean(priority)) + Number(Boolean(tag));
  const hasMoreFilters = moreFilterCount > 0;

  const mobileFilterChips: {
    key: MobileFilterKey;
    active: boolean;
    displayLabel: string;
  }[] = [
    {
      key: "job",
      active: Boolean(publicJobId),
      displayLabel: publicJobId
        ? optionLabel(jobSelectOptions, publicJobId) || "Job"
        : "Job",
    },
    {
      key: "location",
      active: Boolean(location.trim()),
      displayLabel: location.trim() || "Location",
    },
    {
      key: "experience",
      active: Boolean(experience),
      displayLabel: experience
        ? optionLabel(experienceOptions, experience) || "Experience"
        : "Experience",
    },
    {
      key: "availability",
      active: Boolean(availability),
      displayLabel: availability
        ? optionLabel(availabilityOptions, availability) || "Availability"
        : "Availability",
    },
    {
      key: "priority",
      active: Boolean(priority),
      displayLabel: priority
        ? optionLabel(priorityOptions, priority) || "Priority"
        : "Priority",
    },
    {
      key: "tag",
      active: Boolean(tag),
      displayLabel: tag ? optionLabel(tagOptions, tag) || "Tag" : "Tag",
    },
    {
      key: "sort",
      active: sort !== DEFAULT_SAVED_CANDIDATE_SORT,
      displayLabel: optionLabel(sortOptions, sort) || "Sort",
    },
  ];

  const toggleMobileFilter = (key: MobileFilterKey) => {
    setMobileOpenFilter((current) => (current === key ? null : key));
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-3 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1" htmlFor={searchId}>
            <span className="sr-only">Search saved candidates</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id={searchId}
              type="search"
              value={searchDraft}
              onChange={(event) => onSearchDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSearchSubmit();
                }
              }}
              placeholder="Search saved candidates…"
              className={searchControlClassName}
            />
          </label>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {canAdd ? (
              <button
                type="button"
                onClick={onOpenAddModal}
                className={cn(
                  primaryActionButtonClassName,
                  "min-w-0 flex-1 bg-primary text-surface hover:bg-primary-hover sm:flex-none",
                )}
              >
                <Plus className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  <span className="sm:hidden">Add</span>
                  <span className="hidden sm:inline">Add candidate</span>
                </span>
              </button>
            ) : null}

            {canExport ? (
              <button
                type="button"
                onClick={onOpenExportModal}
                className={cn(
                  primaryActionButtonClassName,
                  "min-w-0 flex-1 border border-primary bg-primary-light text-primary hover:bg-primary hover:text-surface sm:flex-none",
                )}
              >
                <Download className="size-4 shrink-0" aria-hidden="true" />
                Export
              </button>
            ) : null}
          </div>
        </div>

        {/* Mobile / tablet: horizontal filter chips */}
        <div className="lg:hidden">
          <div
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 scrollbar-hidden"
            role="toolbar"
            aria-label="Saved candidate filters"
          >
            {mobileFilterChips.map((chip) => {
              const isOpen = mobileOpenFilter === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => toggleMobileFilter(chip.key)}
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? mobileFilterPanelId : undefined}
                  className={cn(
                    "inline-flex h-9 max-w-[12rem] shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    isOpen || chip.active
                      ? "border-primary/40 bg-primary-light/40 text-primary"
                      : "border-border-subtle bg-surface text-foreground hover:border-primary/30",
                  )}
                >
                  <span className="truncate">{chip.displayLabel}</span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 shrink-0 transition-transform",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          {mobileOpenFilter ? (
            <div
              id={mobileFilterPanelId}
              className="mt-2 rounded-xl border border-border-subtle bg-hero-bg/50 p-3"
            >
              {mobileOpenFilter === "job" ? (
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-xs font-semibold text-muted">
                    Job title
                  </span>
                  <EmployerRegisterSearchableSelect
                    id="saved-candidates-job-filter-mobile"
                    label="Job title"
                    hideLabel
                    value={publicJobId}
                    placeholder="All job titles"
                    options={jobSelectOptions}
                    onChange={onJobChange}
                    initialVisibleCount={8}
                    searchPlaceholder="Search job title or ID…"
                    triggerClassName={selectTriggerClassName}
                  />
                </label>
              ) : null}

              {mobileOpenFilter === "location" ? (
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-xs font-semibold text-muted">
                    Location
                  </span>
                  <input
                    type="text"
                    value={location}
                    onChange={(event) => onLocationChange(event.target.value)}
                    placeholder="All locations"
                    className={filterControlClassName}
                    autoFocus
                  />
                </label>
              ) : null}

              {mobileOpenFilter === "experience" ? (
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-xs font-semibold text-muted">
                    Experience
                  </span>
                  <EmployerRegisterSearchableSelect
                    id="saved-candidates-experience-filter-mobile"
                    label="Experience"
                    hideLabel
                    value={experience}
                    placeholder="All experience"
                    options={experienceOptions}
                    onChange={onExperienceChange}
                    hideSearch
                    triggerClassName={selectTriggerClassName}
                  />
                </label>
              ) : null}

              {mobileOpenFilter === "availability" ? (
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-xs font-semibold text-muted">
                    Availability
                  </span>
                  <EmployerRegisterSearchableSelect
                    id="saved-candidates-availability-filter-mobile"
                    label="Availability"
                    hideLabel
                    value={availability}
                    placeholder="All availability"
                    options={availabilityOptions}
                    onChange={(value) =>
                      onAvailabilityChange(
                        value as EmployerAvailabilityFilterValue,
                      )
                    }
                    hideSearch
                    triggerClassName={selectTriggerClassName}
                  />
                </label>
              ) : null}

              {mobileOpenFilter === "priority" ? (
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-xs font-semibold text-muted">
                    Priority
                  </span>
                  <EmployerRegisterSearchableSelect
                    id="saved-candidates-priority-filter-mobile"
                    label="Priority"
                    hideLabel
                    value={priority}
                    placeholder="All priorities"
                    options={priorityOptions}
                    onChange={(value) =>
                      onPriorityChange(value as SavedCandidatePriority | "")
                    }
                    hideSearch
                    triggerClassName={selectTriggerClassName}
                  />
                </label>
              ) : null}

              {mobileOpenFilter === "tag" ? (
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-xs font-semibold text-muted">
                    Tag
                  </span>
                  <EmployerRegisterSearchableSelect
                    id="saved-candidates-tag-filter-mobile"
                    label="Tag"
                    hideLabel
                    value={tag}
                    placeholder="All tags"
                    options={tagOptions}
                    onChange={onTagChange}
                    hideSearch
                    triggerClassName={selectTriggerClassName}
                  />
                </label>
              ) : null}

              {mobileOpenFilter === "sort" ? (
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-xs font-semibold text-muted">
                    Sort by
                  </span>
                  <EmployerRegisterSearchableSelect
                    id="saved-candidates-sort-mobile"
                    label="Sort by"
                    hideLabel
                    value={sort}
                    placeholder="Recently saved"
                    options={sortOptions}
                    onChange={(value) =>
                      onSortChange(value as SavedCandidateSort)
                    }
                    hideSearch
                    triggerClassName={selectTriggerClassName}
                  />
                </label>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Desktop: full filter row */}
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_minmax(11rem,13rem)_auto] lg:items-center lg:gap-2">
          <label className="min-w-0">
            <span className="sr-only">Job title</span>
            <EmployerRegisterSearchableSelect
              id="saved-candidates-job-filter"
              label="Job title"
              hideLabel
              value={publicJobId}
              placeholder="All job titles"
              options={jobSelectOptions}
              onChange={onJobChange}
              initialVisibleCount={8}
              searchPlaceholder="Search job title or ID…"
              triggerClassName={selectTriggerClassName}
            />
          </label>
          <label className="min-w-0">
            <span className="sr-only">Location</span>
            <input
              type="text"
              value={location}
              onChange={(event) => onLocationChange(event.target.value)}
              placeholder="All locations"
              className={filterControlClassName}
            />
          </label>
          <label className="min-w-0">
            <span className="sr-only">Experience</span>
            <EmployerRegisterSearchableSelect
              id="saved-candidates-experience-filter"
              label="Experience"
              hideLabel
              value={experience}
              placeholder="All experience"
              options={experienceOptions}
              onChange={onExperienceChange}
              hideSearch
              triggerClassName={selectTriggerClassName}
            />
          </label>
          <label className="min-w-0">
            <span className="sr-only">Availability</span>
            <EmployerRegisterSearchableSelect
              id="saved-candidates-availability-filter"
              label="Availability"
              hideLabel
              value={availability}
              placeholder="All availability"
              options={availabilityOptions}
              onChange={(value) =>
                onAvailabilityChange(value as EmployerAvailabilityFilterValue)
              }
              hideSearch
              triggerClassName={selectTriggerClassName}
            />
          </label>

          <button
            type="button"
            onClick={() => setMoreFiltersOpen((open) => !open)}
            className={cn(
              filterActionButtonClassName,
              "w-auto border border-border-subtle bg-surface text-foreground hover:border-primary/30",
              hasMoreFilters &&
                "border-primary/40 bg-primary-light/30 text-primary",
            )}
            aria-expanded={moreFiltersOpen}
          >
            <SlidersHorizontal className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">More filters</span>
            {hasMoreFilters ? (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-surface">
                {moreFilterCount}
              </span>
            ) : null}
          </button>

          <label className="min-w-0">
            <span className="sr-only">Sort by</span>
            <EmployerRegisterSearchableSelect
              id="saved-candidates-sort"
              label="Sort by"
              hideLabel
              value={sort}
              placeholder="Recently saved"
              options={sortOptions}
              onChange={(value) => onSortChange(value as SavedCandidateSort)}
              hideSearch
              triggerClassName={selectTriggerClassName}
            />
          </label>

          <div
            className="flex h-10 w-auto items-center gap-0.5 rounded-xl border border-border-subtle p-1"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                viewMode === "table"
                  ? "bg-primary text-surface"
                  : "text-muted hover:bg-primary-light/40 hover:text-foreground",
              )}
              aria-label="Table view"
              aria-pressed={viewMode === "table"}
            >
              <List className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                viewMode === "grid"
                  ? "bg-primary text-surface"
                  : "text-muted hover:bg-primary-light/40 hover:text-foreground",
              )}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {moreFiltersOpen ? (
          <div className="hidden rounded-xl border border-dashed border-border-subtle bg-hero-bg/50 p-3 lg:block">
            <div className="grid max-w-xl gap-2 sm:grid-cols-2">
              <label className="min-w-0">
                <span className="mb-1 block text-xs font-semibold text-muted">
                  Priority
                </span>
                <EmployerRegisterSearchableSelect
                  id="saved-candidates-priority-filter"
                  label="Priority"
                  hideLabel
                  value={priority}
                  placeholder="All priorities"
                  options={priorityOptions}
                  onChange={(value) =>
                    onPriorityChange(value as SavedCandidatePriority | "")
                  }
                  hideSearch
                  triggerClassName={selectTriggerClassName}
                />
              </label>
              <label className="min-w-0">
                <span className="mb-1 block text-xs font-semibold text-muted">
                  Tag
                </span>
                <EmployerRegisterSearchableSelect
                  id="saved-candidates-tag-filter"
                  label="Tag"
                  hideLabel
                  value={tag}
                  placeholder="All tags"
                  options={tagOptions}
                  onChange={onTagChange}
                  hideSearch
                  triggerClassName={selectTriggerClassName}
                />
              </label>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
