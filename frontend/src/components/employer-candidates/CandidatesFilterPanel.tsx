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
        "rounded-xl border border-border-subtle bg-surface p-3 sm:p-4",
        !isSheet &&
          "lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:overscroll-contain lg:scrollbar-hidden",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
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
                "h-11 w-full rounded-xl border border-border bg-surface pl-4 pr-12 text-sm text-foreground shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted/80 hover:border-primary/25 focus:border-primary-soft focus:ring-2 focus:ring-primary-soft/20",
                isSheet && "min-h-11",
              )}
            />
            <button
              type="button"
              onClick={onSearchSubmit}
              aria-label="Search candidates"
              className={cn(
                "absolute top-1/2 right-2 inline-flex -translate-y-1/2 items-center justify-center rounded-lg bg-primary text-surface shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isSheet ? "size-10" : "size-8",
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

      <div className="mt-5 border-t border-border-subtle pt-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Filter className="h-4 w-4 text-primary-soft" />
          Quick Filters
        </h2>
        <ul className="mt-3 flex flex-col gap-1" role="listbox" aria-label="Status filters">
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
                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    isSheet ? "min-h-11 py-2.5" : "py-2",
                    isActive
                      ? "bg-primary-soft text-surface"
                      : "text-foreground hover:bg-primary-light",
                  )}
                >
                  <span className="min-w-0 truncate">{item.label}</span>
                  <span
                    className={cn(
                      "inline-flex min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
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

      <div className="mt-5 border-t border-border-subtle pt-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-foreground">Advanced Filters</h2>
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

        <div className="mt-3 space-y-3">
          {canFilterByLocation ? (
            <label className="block" htmlFor={`${idPrefix}candidates-location-filter`}>
              <span className="text-xs font-medium text-muted">Location</span>
              <CandidatesLocationAutocomplete
                id={`${idPrefix}candidates-location-filter`}
                value={location}
                publicJobId={publicJobId}
                onChange={onLocationChange}
              />
            </label>
          ) : null}
          <label className="block">
            <span className="text-xs font-medium text-muted">Experience</span>
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
              />
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">Skills</span>
            <input
              type="search"
              value={skills}
              onChange={(event) => onSkillsChange(event.target.value)}
              placeholder="Comma-separated"
              className={cn(
                "mt-1 w-full rounded-lg border border-border-subtle bg-surface px-2.5 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isSheet && "min-h-11",
              )}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">Availability</span>
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
              <span className="text-xs font-medium text-muted">Applied from</span>
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
              <span className="text-xs font-medium text-muted">Applied to</span>
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
