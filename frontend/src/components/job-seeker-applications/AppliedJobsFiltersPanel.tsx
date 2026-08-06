"use client";

import {
  JOB_SEARCH_JOB_TYPE_OPTIONS,
  JOB_SEARCH_WORK_MODE_OPTIONS,
} from "@/constants/job-search";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import {
  formatJobSearchJobType,
  formatJobSearchWorkMode,
} from "@/utils/job-search-format";
import { cn } from "@/utils/cn";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  EMPTY_APPLIED_JOBS_FILTERS,
  type AppliedJobsAdvancedFilters,
} from "./applied-jobs-utils";

type AppliedJobsFiltersPanelProps = {
  open: boolean;
  filters: AppliedJobsAdvancedFilters;
  locations: string[];
  companies: string[];
  jobTypes: string[];
  workModes: string[];
  shifts: string[];
  onApply: (next: AppliedJobsAdvancedFilters) => void;
  onClose: () => void;
};

function FilterField({
  id,
  label,
  children,
}: {
  id?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      {id ? (
        <label htmlFor={id} className="text-xs font-semibold text-foreground">
          {label}
        </label>
      ) : (
        <p className="text-xs font-semibold text-foreground">{label}</p>
      )}
      <div className="mt-1.5 min-w-0 [&_.employer-register-form-stack]:gap-0">
        {children}
      </div>
    </div>
  );
}

const inputClassName =
  "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted hover:border-primary/25 focus:border-primary focus:ring-2 focus:ring-primary/20";

const selectTriggerClassName =
  "!h-11 !min-h-11 w-full !rounded-xl !border-border !px-3.5 !text-sm !font-medium !shadow-sm hover:!border-primary/25 focus-visible:!border-primary focus-visible:!ring-2 focus-visible:!ring-primary/20";

export function AppliedJobsFiltersPanel({
  open,
  filters,
  locations,
  companies,
  jobTypes,
  workModes,
  shifts,
  onApply,
  onClose,
}: AppliedJobsFiltersPanelProps) {
  const [draft, setDraft] = useState<AppliedJobsAdvancedFilters>(filters);

  useEffect(() => {
    if (open) {
      setDraft(filters);
    }
  }, [open, filters]);

  const jobTypeOptions = useMemo((): EmployerRegisterSelectOption[] => {
    const knownValues = JOB_SEARCH_JOB_TYPE_OPTIONS.map((option) => option.value);
    const known = new Set<string>(knownValues);
    const extras = jobTypes.filter((value) => !known.has(value));
    return [
      { value: "", label: "All job types" },
      ...[...knownValues, ...extras].map((jobType) => ({
        value: jobType,
        label: formatJobSearchJobType(jobType),
      })),
    ];
  }, [jobTypes]);

  const workModeOptions = useMemo((): EmployerRegisterSelectOption[] => {
    const knownValues = JOB_SEARCH_WORK_MODE_OPTIONS.map(
      (option) => option.value,
    );
    const known = new Set<string>(knownValues);
    const extras = workModes.filter((value) => !known.has(value));
    return [
      { value: "", label: "All work modes" },
      ...[...knownValues, ...extras].map((workMode) => ({
        value: workMode,
        label: formatJobSearchWorkMode(workMode),
      })),
    ];
  }, [workModes]);

  const shiftOptions = useMemo((): EmployerRegisterSelectOption[] => {
    return [
      { value: "", label: "All schedules" },
      ...shifts.map((shift) => ({ value: shift, label: shift })),
    ];
  }, [shifts]);

  if (!open) {
    return null;
  }

  const patch = (partial: Partial<AppliedJobsAdvancedFilters>) => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-foreground/30"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="applied-jobs-filters-title"
        className="flex h-full w-full max-w-md flex-col bg-surface shadow-[0_8px_32px_rgba(26,43,60,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3.5">
          <h2
            id="applied-jobs-filters-title"
            className="text-base font-bold text-foreground"
          >
            Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-primary-light/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Close filters"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <FilterField id="filter-location" label="Location">
            <input
              id="filter-location"
              list="applied-jobs-locations"
              value={draft.location}
              onChange={(event) => patch({ location: event.target.value })}
              placeholder="City or state"
              className={inputClassName}
              autoComplete="off"
            />
            <datalist id="applied-jobs-locations">
              {locations.map((location) => (
                <option key={location} value={location} />
              ))}
            </datalist>
          </FilterField>

          <FilterField id="filter-company" label="Company">
            <input
              id="filter-company"
              list="applied-jobs-companies"
              value={draft.company}
              onChange={(event) => patch({ company: event.target.value })}
              placeholder="Company name"
              className={inputClassName}
              autoComplete="off"
            />
            <datalist id="applied-jobs-companies">
              {companies.map((company) => (
                <option key={company} value={company} />
              ))}
            </datalist>
          </FilterField>

          <FilterField id="filter-job-type" label="Job Type">
            <EmployerRegisterSearchableSelect
              id="filter-job-type"
              label="Job Type"
              hideLabel
              hideSearch={jobTypeOptions.length <= 8}
              value={draft.jobType}
              placeholder="All job types"
              options={jobTypeOptions}
              onChange={(value) => patch({ jobType: value })}
              triggerClassName={selectTriggerClassName}
            />
          </FilterField>

          <FilterField id="filter-work-mode" label="Work Mode">
            <EmployerRegisterSearchableSelect
              id="filter-work-mode"
              label="Work Mode"
              hideLabel
              hideSearch={workModeOptions.length <= 8}
              value={draft.workMode}
              placeholder="All work modes"
              options={workModeOptions}
              onChange={(value) => patch({ workMode: value })}
              triggerClassName={selectTriggerClassName}
            />
          </FilterField>

          <FilterField id="filter-shift" label="Shift / Schedule">
            <EmployerRegisterSearchableSelect
              id="filter-shift"
              label="Shift / Schedule"
              hideLabel
              hideSearch={shiftOptions.length <= 8}
              value={draft.shift}
              placeholder="All schedules"
              options={shiftOptions}
              onChange={(value) => patch({ shift: value })}
              triggerClassName={selectTriggerClassName}
            />
          </FilterField>

          <div className="grid grid-cols-2 gap-3">
            <FilterField id="filter-from" label="Applied From">
              <input
                id="filter-from"
                type="date"
                value={draft.appliedFrom}
                onChange={(event) => patch({ appliedFrom: event.target.value })}
                className={inputClassName}
              />
            </FilterField>
            <FilterField id="filter-to" label="Applied To">
              <input
                id="filter-to"
                type="date"
                value={draft.appliedTo}
                min={draft.appliedFrom || undefined}
                onChange={(event) => patch({ appliedTo: event.target.value })}
                className={inputClassName}
              />
            </FilterField>
          </div>

          <FilterField id="filter-min-salary" label="Minimum Salary (₹)">
            <input
              id="filter-min-salary"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              value={draft.minSalary}
              onChange={(event) => patch({ minSalary: event.target.value })}
              placeholder="e.g. 15000"
              className={inputClassName}
            />
          </FilterField>
        </div>

        <div className="flex gap-2.5 border-t border-border-subtle p-4">
          <button
            type="button"
            onClick={() => {
              setDraft(EMPTY_APPLIED_JOBS_FILTERS);
              onApply(EMPTY_APPLIED_JOBS_FILTERS);
              onClose();
            }}
            className={cn(
              "inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground shadow-sm",
              "transition-colors hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            )}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
