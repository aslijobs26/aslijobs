"use client";

import { CandidatesLocationAutocomplete } from "@/components/employer-candidates/CandidatesLocationAutocomplete";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { PostJobDatePicker } from "@/components/post-job/PostJobDatePicker";
import { POST_JOB_EXPERIENCE_OPTIONS } from "@/constants/post-job";
import { useCan } from "@/providers/employer-permission-provider";
import {
  EMPLOYER_APPLICATION_STATUS_LABELS,
  EMPLOYER_AVAILABILITY_FILTER_LABELS,
  EMPLOYER_AVAILABILITY_FILTERS,
  type EmployerApplicationStats,
  type EmployerApplicationStatus,
  type EmployerAvailabilityFilterValue,
} from "@/types/employer-applications";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import { cn } from "@/utils/cn";
import { Filter, Search } from "lucide-react";
import { useMemo, type RefObject } from "react";

export type CandidatesQuickFilter =
  | "all"
  | Exclude<EmployerApplicationStatus, "submitted">
  | "submitted";

type CandidatesFilterPanelProps = {
  stats: EmployerApplicationStats | undefined;
  activeFilter: CandidatesQuickFilter;
  onFilterChange: (filter: CandidatesQuickFilter) => void;
  searchDraft: string;
  location: string;
  experience: string;
  skills: string;
  availability: EmployerAvailabilityFilterValue;
  appliedFrom: string;
  appliedTo: string;
  publicJobId?: string;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  onSearchDraftChange: (value: string) => void;
  onSearchSubmit: () => void;
  onLocationChange: (value: string) => void;
  onExperienceChange: (value: string) => void;
  onSkillsChange: (value: string) => void;
  onAvailabilityChange: (value: EmployerAvailabilityFilterValue) => void;
  onAppliedFromChange: (value: string) => void;
  onAppliedToChange: (value: string) => void;
  onClearAdvanced: () => void;
  className?: string;
  /** Prefix control IDs when the panel is mounted twice (desktop + mobile sheet). */
  idPrefix?: string;
  /** Mobile sheet presentation uses larger touch targets without changing desktop. */
  presentation?: "sidebar" | "sheet";
};

const filterSelectTriggerClassName =
  "employer-candidates-filters__select-trigger !h-9 lg:!h-8 !min-h-9 lg:!min-h-8 !px-2.5 lg:!px-2 !text-xs lg:!text-[11px] !font-medium w-full rounded-lg border border-border-subtle bg-surface text-foreground shadow-none transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

const filterSelectOptionClassName =
  "employer-candidates-filters__select-option !px-2.5 !py-2 !text-sm lg:!px-2 lg:!py-1.5 lg:!text-[11px]";

const filterSelectPanelClassName = "employer-candidates-filters-select-panel";

const filterFieldClassName =
  "employer-candidates-filters__field mt-1 w-full rounded-lg border border-border-subtle bg-surface px-2.5 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:h-8 lg:px-2 lg:py-0 lg:text-[11px]";

const filterLabelClassName =
  "employer-candidates-filters__label text-xs font-medium text-muted lg:text-[10px]";

const QUICK_FILTERS: {
  key: CandidatesQuickFilter;
  label: string;
  statsKey?: keyof EmployerApplicationStats;
}[] = [
  { key: "all", label: "All Candidates", statsKey: "total" },
  { key: "submitted", label: "New Applications", statsKey: "submitted" },
  { key: "viewed", label: "Viewed", statsKey: "viewed" },
  { key: "under_review", label: "Under Review", statsKey: "under_review" },
  { key: "shortlisted", label: "Shortlisted", statsKey: "shortlisted" },
  {
    key: "interview_scheduled",
    label: EMPLOYER_APPLICATION_STATUS_LABELS.interview_scheduled,
    statsKey: "interview_scheduled",
  },
  {
    key: "interview_completed",
    label: EMPLOYER_APPLICATION_STATUS_LABELS.interview_completed,
    statsKey: "interview_completed",
  },
  {
    key: "offer_sent",
    label: EMPLOYER_APPLICATION_STATUS_LABELS.offer_sent,
    statsKey: "offer_sent",
  },
  { key: "joined", label: "Hired", statsKey: "joined" },
  {
    key: "did_not_join",
    label: EMPLOYER_APPLICATION_STATUS_LABELS.did_not_join,
    statsKey: "did_not_join",
  },
  { key: "rejected", label: "Rejected", statsKey: "rejected" },
  { key: "withdrawn", label: "Withdrawn", statsKey: "withdrawn" },
];

function getLocalTodayIso() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export function CandidatesFilterPanel({
  stats,
  activeFilter,
  onFilterChange,
  searchDraft,
  location,
  experience,
  skills,
  availability,
  appliedFrom,
  appliedTo,
  publicJobId,
  searchInputRef,
  onSearchDraftChange,
  onSearchSubmit,
  onLocationChange,
  onExperienceChange,
  onSkillsChange,
  onAvailabilityChange,
  onAppliedFromChange,
  onAppliedToChange,
  onClearAdvanced,
  className,
  idPrefix = "",
  presentation = "sidebar",
}: CandidatesFilterPanelProps) {
  const { getFieldLevel } = useCan();
  const canFilterByLocation =
    getFieldLevel("candidates", "location") !== "hidden";
  const isSheet = presentation === "sheet";
  const hasAdvanced =
    (canFilterByLocation && Boolean(location)) ||
    Boolean(experience) ||
    Boolean(skills) ||
    Boolean(availability) ||
    Boolean(appliedFrom) ||
    Boolean(appliedTo);
  const availabilityOptions = useMemo<EmployerRegisterSelectOption[]>(
    () =>
      EMPLOYER_AVAILABILITY_FILTERS.map((key) => ({
        value: key,
        label: EMPLOYER_AVAILABILITY_FILTER_LABELS[key],
      })),
    [],
  );
  const experienceOptions = useMemo<EmployerRegisterSelectOption[]>(
    () =>
      POST_JOB_EXPERIENCE_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [],
  );
  const todayIso = useMemo(() => getLocalTodayIso(), []);
  const appliedFromMaxDate = appliedTo.trim() || todayIso;

  return (
    <aside
      className={cn(
        "employer-candidates-filters rounded-xl border border-border-subtle bg-surface p-3 sm:p-4 lg:p-2.5",
        !isSheet &&
          "lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:overscroll-contain lg:scrollbar-hidden",
        className,
      )}
    >
      <div className="flex flex-col gap-3 lg:gap-2">
        <label className="block min-w-0 flex-1">
          <span className="sr-only">Search candidates</span>
          <span className="relative block">
            <input
              ref={searchInputRef}
              type="search"
              value={searchDraft}
              onChange={(event) => onSearchDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSearchSubmit();
                }
              }}
              placeholder="Search name, skills, job, location, phone…"
              className={cn(
                "employer-candidates-filters__search h-11 w-full rounded-xl border border-border bg-surface pl-4 pr-12 text-sm text-foreground shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted/80 hover:border-primary/25 focus:border-primary-soft focus:ring-2 focus:ring-primary-soft/20 lg:h-8 lg:rounded-lg lg:pl-2.5 lg:pr-9 lg:text-[11px]",
                isSheet && "min-h-11",
              )}
            />
            <button
              type="button"
              onClick={onSearchSubmit}
              aria-label="Search candidates"
              className={cn(
                "absolute top-1/2 right-2 inline-flex -translate-y-1/2 items-center justify-center rounded-lg bg-primary text-surface shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isSheet ? "size-10" : "size-8 lg:size-6",
              )}
            >
              <Search
                className={isSheet ? "size-4" : "size-3.5"}
                aria-hidden="true"
              />
            </button>
          </span>
        </label>
      </div>

      <div className="employer-candidates-filters__section mt-5 border-t border-border-subtle pt-4 lg:mt-3 lg:pt-2.5">
        <h2 className="employer-candidates-filters__title flex items-center gap-2 text-sm font-bold text-foreground lg:gap-1.5 lg:text-[11px]">
          <Filter className="h-4 w-4 text-primary-soft lg:size-3" />
          Quick Filters
        </h2>
        <ul
          className="mt-3 flex flex-col gap-1 lg:mt-1.5 lg:gap-px"
          role="listbox"
          aria-label="Status filters"
        >
          {QUICK_FILTERS.map((item) => {
            const count =
              item.statsKey && stats ? stats[item.statsKey] : undefined;
            const isActive = activeFilter === item.key;

            return (
              <li key={item.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => onFilterChange(item.key)}
                  className={cn(
                    "employer-candidates-filters__item flex w-full items-center justify-between gap-2 rounded-lg px-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:gap-1.5 lg:px-1.5 lg:text-[11px]",
                    isSheet ? "min-h-11 py-2.5" : "py-2 lg:py-1",
                    isActive
                      ? "bg-primary-soft text-surface"
                      : "text-foreground hover:bg-primary-light",
                  )}
                >
                  <span className="min-w-0 truncate">{item.label}</span>
                  <span
                    className={cn(
                      "inline-flex min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold lg:min-w-4 lg:px-1 lg:text-[9px]",
                      isActive
                        ? "bg-surface/20 text-surface"
                        : "bg-primary-light text-muted",
                    )}
                  >
                    {typeof count === "number" ? count : "—"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 border-t border-border-subtle pt-4 lg:mt-3.5 lg:pt-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="employer-candidates-filters__advanced-title text-sm font-bold text-foreground lg:text-[11px]">
            Advanced Filters
          </h2>
          {hasAdvanced ? (
            <button
              type="button"
              onClick={onClearAdvanced}
              className={cn(
                "font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isSheet
                  ? "inline-flex min-h-10 items-center rounded-lg px-2 text-sm"
                  : "text-xs",
              )}
            >
              Clear
            </button>
          ) : null}
        </div>

        <div className="mt-3 space-y-3 lg:mt-2.5 lg:space-y-2">
          {canFilterByLocation ? (
            <label className="block" htmlFor={`${idPrefix}candidates-location-filter`}>
              <span className={filterLabelClassName}>Location</span>
              <CandidatesLocationAutocomplete
                id={`${idPrefix}candidates-location-filter`}
                value={location}
                publicJobId={publicJobId}
                onChange={onLocationChange}
                inputClassName={cn(filterFieldClassName, isSheet && "min-h-11")}
              />
            </label>
          ) : null}
          <label className="block">
            <span className={filterLabelClassName}>Experience</span>
            <div className="mt-1">
              <EmployerRegisterSearchableSelect
                id={`${idPrefix}candidates-experience-filter`}
                label="Experience"
                hideLabel
                value={experience}
                placeholder="All experience"
                options={experienceOptions}
                onChange={(value) => onExperienceChange(value)}
                hideSearch
                visibleOptionRows={4}
                triggerClassName={cn(
                  filterSelectTriggerClassName,
                  isSheet && "!h-11 !min-h-11 !text-sm",
                )}
                panelClassName={filterSelectPanelClassName}
                optionClassName={filterSelectOptionClassName}
              />
            </div>
          </label>
          <label className="block">
            <span className={filterLabelClassName}>Skills</span>
            <input
              type="search"
              value={skills}
              onChange={(event) => onSkillsChange(event.target.value)}
              placeholder="Comma-separated"
              className={cn(filterFieldClassName, isSheet && "min-h-11")}
            />
          </label>
          <label className="block">
            <span className={filterLabelClassName}>Availability</span>
            <div className="mt-1">
              <EmployerRegisterSearchableSelect
                id={`${idPrefix}candidates-availability-filter`}
                label="Availability"
                hideLabel
                value={availability}
                placeholder="All availability"
                options={availabilityOptions}
                onChange={(value) =>
                  onAvailabilityChange(value as EmployerAvailabilityFilterValue)
                }
                hideSearch
                visibleOptionRows={4}
                triggerClassName={cn(
                  filterSelectTriggerClassName,
                  isSheet && "!h-11 !min-h-11 !text-sm",
                )}
                panelClassName={filterSelectPanelClassName}
                optionClassName={filterSelectOptionClassName}
              />
            </div>
          </label>
          <div
            className={cn(
              "grid gap-2",
              isSheet ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            <label className="block" htmlFor={`${idPrefix}candidates-applied-from`}>
              <span className={filterLabelClassName}>Applied from</span>
              <div className={cn("mt-1", isSheet && "min-h-11")}>
                <PostJobDatePicker
                  id={`${idPrefix}candidates-applied-from`}
                  value={appliedFrom}
                  placeholder="From date"
                  maxDate={appliedFromMaxDate}
                  compact
                  aria-label="Applied from"
                  onChange={onAppliedFromChange}
                />
              </div>
            </label>
            <label className="block" htmlFor={`${idPrefix}candidates-applied-to`}>
              <span className={filterLabelClassName}>Applied to</span>
              <div className={cn("mt-1", isSheet && "min-h-11")}>
                <PostJobDatePicker
                  id={`${idPrefix}candidates-applied-to`}
                  value={appliedTo}
                  placeholder="To date"
                  minDate={appliedFrom.trim() || undefined}
                  maxDate={todayIso}
                  compact
                  aria-label="Applied to"
                  onChange={onAppliedToChange}
                />
              </div>
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
}
