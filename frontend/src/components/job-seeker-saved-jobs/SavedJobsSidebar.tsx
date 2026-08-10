"use client";

import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import {
  JOB_SEARCH_EXPERIENCE_OPTIONS,
  JOB_SEARCH_JOB_TYPE_OPTIONS,
  JOB_SEARCH_PERK_LABELS,
  JOB_SEARCH_WORK_MODE_OPTIONS,
} from "@/constants/job-search";
import { ROUTES } from "@/constants/routes";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import type {
  SavedJobsAdvancedFilters,
  SavedJobsStats,
} from "@/types/saved-jobs";
import { cn } from "@/utils/cn";
import { ArrowRight, MapPin, Star, X } from "lucide-react";
import Link from "next/link";
import {
  SAVED_JOBS_SALARY_OPTIONS,
  SAVED_JOBS_SCHEDULE_OPTIONS,
} from "./saved-jobs-utils";

type SavedJobsSidebarProps = {
  filters: SavedJobsAdvancedFilters;
  stats: SavedJobsStats | undefined;
  onChangeFilters: (next: SavedJobsAdvancedFilters) => void;
  onClearFilters: () => void;
};

type SavedJobsFiltersFormProps = {
  idPrefix: string;
  filters: SavedJobsAdvancedFilters;
  onChangeFilters: (next: SavedJobsAdvancedFilters) => void;
  onClearFilters: () => void;
  onClose?: () => void;
  className?: string;
};

const fieldClassName =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted hover:border-primary/25 focus:border-primary focus:ring-2 focus:ring-primary/20";

const selectTriggerClassName =
  "!h-10 !min-h-10 w-full !rounded-lg !border-border !px-3 !text-sm !font-medium !shadow-sm";

const perkOptions: EmployerRegisterSelectOption[] = [
  { value: "", label: "Any benefit" },
  ...Object.entries(JOB_SEARCH_PERK_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const salaryOptions: EmployerRegisterSelectOption[] =
  SAVED_JOBS_SALARY_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));

function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center justify-center rounded-lg border px-2.5 text-xs font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        selected
          ? "border-primary bg-primary text-surface"
          : "border-border-subtle bg-surface text-foreground hover:bg-primary-light/40",
      )}
    >
      {label}
    </button>
  );
}

export function SavedJobsFiltersForm({
  idPrefix,
  filters,
  onChangeFilters,
  onClearFilters,
  onClose,
  className,
}: SavedJobsFiltersFormProps) {
  const patch = (partial: Partial<SavedJobsAdvancedFilters>) => {
    onChangeFilters({ ...filters, ...partial });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value.trim().length > 0,
  );

  return (
    <section
      className={cn(
        "rounded-xl border border-border-subtle bg-surface p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-foreground">Filter Saved Jobs</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="text-xs font-semibold text-primary hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear All
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="Close filters"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor={`${idPrefix}-location`} className="sr-only">
            Location
          </label>
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id={`${idPrefix}-location`}
              type="search"
              value={filters.location}
              onChange={(event) => patch({ location: event.target.value })}
              placeholder="City or state"
              className={cn(fieldClassName, "pl-9")}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0 [&_.employer-register-form-stack]:gap-0">
            <p className="mb-1 text-xs font-semibold text-muted">Min Salary</p>
            <EmployerRegisterSearchableSelect
              id={`${idPrefix}-min-salary`}
              label="Min Salary"
              hideLabel
              hideSearch
              value={filters.minSalary}
              placeholder="Min Salary"
              options={salaryOptions}
              onChange={(value) => patch({ minSalary: value })}
              triggerClassName={selectTriggerClassName}
            />
          </div>
          <div className="min-w-0 [&_.employer-register-form-stack]:gap-0">
            <p className="mb-1 text-xs font-semibold text-muted">Max Salary</p>
            <EmployerRegisterSearchableSelect
              id={`${idPrefix}-max-salary`}
              label="Max Salary"
              hideLabel
              hideSearch
              value={filters.maxSalary}
              placeholder="Max Salary"
              options={salaryOptions}
              onChange={(value) => patch({ maxSalary: value })}
              triggerClassName={selectTriggerClassName}
            />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted">Job Type</p>
          <div className="grid grid-cols-2 gap-1.5">
            {JOB_SEARCH_JOB_TYPE_OPTIONS.map((option) => (
              <ToggleChip
                key={option.value}
                label={option.label}
                selected={filters.jobType === option.value}
                onClick={() =>
                  patch({
                    jobType:
                      filters.jobType === option.value ? "" : option.value,
                  })
                }
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted">Work Mode</p>
          <div className="grid grid-cols-2 gap-1.5">
            {JOB_SEARCH_WORK_MODE_OPTIONS.map((option) => (
              <ToggleChip
                key={option.value}
                label={option.label}
                selected={filters.workMode === option.value}
                onClick={() =>
                  patch({
                    workMode:
                      filters.workMode === option.value ? "" : option.value,
                  })
                }
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted">Schedule</p>
          <div className="grid grid-cols-2 gap-1.5">
            {SAVED_JOBS_SCHEDULE_OPTIONS.map((option) => (
              <ToggleChip
                key={option.value}
                label={option.label}
                selected={filters.schedule === option.value}
                onClick={() =>
                  patch({
                    schedule:
                      filters.schedule === option.value ? "" : option.value,
                  })
                }
              />
            ))}
          </div>
        </div>

        <details className="rounded-lg border border-border-subtle bg-workflow-neutral-surface/60 px-3 py-2">
          <summary className="cursor-pointer list-none text-xs font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            More Filters
          </summary>
          <div className="mt-3 space-y-3">
            <div className="min-w-0 [&_.employer-register-form-stack]:gap-0">
              <p className="mb-1 text-xs font-semibold text-muted">Experience</p>
              <EmployerRegisterSearchableSelect
                id={`${idPrefix}-experience`}
                label="Experience"
                hideLabel
                hideSearch
                value={filters.experience}
                placeholder="Any experience"
                options={[
                  { value: "", label: "Any experience" },
                  ...JOB_SEARCH_EXPERIENCE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  })),
                ]}
                onChange={(value) => patch({ experience: value })}
                triggerClassName={selectTriggerClassName}
              />
            </div>

            <div>
              <label
                htmlFor={`${idPrefix}-company`}
                className="mb-1 block text-xs font-semibold text-muted"
              >
                Company
              </label>
              <input
                id={`${idPrefix}-company`}
                type="search"
                value={filters.company}
                onChange={(event) => patch({ company: event.target.value })}
                placeholder="Company name"
                className={fieldClassName}
                autoComplete="off"
              />
            </div>

            <div className="min-w-0 [&_.employer-register-form-stack]:gap-0">
              <p className="mb-1 text-xs font-semibold text-muted">Benefits</p>
              <EmployerRegisterSearchableSelect
                id={`${idPrefix}-perk`}
                label="Benefits"
                hideLabel
                hideSearch={perkOptions.length <= 10}
                value={filters.perk}
                placeholder="Any benefit"
                options={perkOptions}
                onChange={(value) => patch({ perk: value })}
                triggerClassName={selectTriggerClassName}
              />
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}

export function SavedJobsSidebar({
  filters,
  stats,
  onChangeFilters,
  onClearFilters,
}: SavedJobsSidebarProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <SavedJobsFiltersForm
        idPrefix="saved-filter-desktop"
        filters={filters}
        onChangeFilters={onChangeFilters}
        onClearFilters={onClearFilters}
        className="hidden lg:block"
      />

      <section className="rounded-xl border border-border-subtle bg-resource-resume-surface p-4 shadow-sm">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- static Asli AI PNG asset */}
          <img
            src="/images/asli-ai-reminders-bot.png"
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 object-contain bg-transparent"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-wide text-resource-resume-icon">
              Ask Asli AI <span className="font-semibold opacity-80">(BETA)</span>
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              Tell me if there are better jobs than my saved jobs.
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-resource-resume-icon">
              Coming soon
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-resource-interview-surface p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-resource-interview-icon-surface text-resource-interview-icon">
            <Star className="size-5 fill-current" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground">
              Never miss a better job!
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Get alerts for similar jobs and salary drops.
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-resource-interview-icon">
              Coming soon
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-foreground">Saved Jobs Overview</h2>
          <Link
            href={ROUTES.JOB_SEEKER_APPLIED_JOBS}
            className="text-xs font-semibold text-primary hover:text-primary-hover"
          >
            View Report
          </Link>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-primary-light/60 px-3 py-2.5">
            <dt className="text-[11px] font-medium text-muted">Total Saved</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-primary">
              {stats?.total ?? 0}
            </dd>
          </div>
          <div className="rounded-lg bg-resource-interview-surface px-3 py-2.5">
            <dt className="text-[11px] font-medium text-muted">Applied</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-resource-interview-icon">
              {stats?.applied ?? 0}
            </dd>
          </div>
          <div className="rounded-lg bg-resource-guide-surface px-3 py-2.5">
            <dt className="text-[11px] font-medium text-muted">High Match</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-resource-guide-icon">
              {stats?.highMatch ?? 0}
            </dd>
          </div>
          <div className="rounded-lg bg-resource-resume-surface px-3 py-2.5">
            <dt className="text-[11px] font-medium text-muted">Recent</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-resource-resume-icon">
              {stats?.recent ?? 0}
            </dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}
