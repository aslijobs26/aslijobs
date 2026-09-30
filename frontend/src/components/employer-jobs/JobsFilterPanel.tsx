"use client";

import {
  DEFAULT_EMPLOYER_JOBS_FILTERS,
  EMPLOYER_JOBS_APPLICATION_BAND_VALUES,
  EMPLOYER_JOBS_EXPERIENCE_FILTER_VALUES,
  EMPLOYER_JOBS_JOB_TYPE_FILTER_VALUES,
  EMPLOYER_JOBS_POSTED_QUICK_OPTIONS,
  EMPLOYER_JOBS_WORK_MODE_FILTER_VALUES,
  employerJobsFiltersAreActive,
  formatEmployerJobsApplicationBand,
  type EmployerJobsFiltersState,
  type EmployerJobsPostedQuickFilter,
} from "@/components/employer-jobs/jobs-filters";
import { JobsLocationAutocomplete } from "@/components/employer-jobs/JobsLocationAutocomplete";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { useTranslate } from "@/i18n/translate";
import type { EmployerJobListOption } from "@/types/employer-jobs";
import { cn } from "@/utils/cn";
import {
  formatJobSearchExperience,
  formatJobSearchJobType,
  formatJobSearchWorkMode,
} from "@/utils/job-search-format";
import { Filter, X } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

type JobsFilterPanelProps = {
  filters: EmployerJobsFiltersState;
  jobOptions: EmployerJobListOption[];
  onApply: (next: EmployerJobsFiltersState) => void;
  onClear: () => void;
  onCancel: () => void;
  className?: string;
};

const fieldClassName =
  "h-9 w-full min-w-0 rounded-md border border-border-subtle bg-surface px-2.5 text-xs font-normal text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] placeholder:text-muted hover:border-primary/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

const filterSelectTriggerClassName =
  "!h-9 lg:!h-9 !min-h-9 !px-2.5 !text-xs !font-medium !shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:!shadow-[0_1px_2px_rgba(15,23,42,0.06)] h-9 w-full min-w-0 rounded-md border border-border-subtle bg-surface text-foreground transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

const labelClassName =
  "block text-[0.6875rem] font-medium leading-none text-muted";

function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClassName}>
          {label}
        </label>
      ) : (
        <p className={labelClassName}>{label}</p>
      )}
      <div className="w-full min-w-0 [&_.employer-register-form-stack]:gap-0">
        {children}
      </div>
    </div>
  );
}

function FilterCheckboxRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs text-foreground hover:bg-primary-light/40"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-3.5 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary/30"
      />
      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}

function toggleValue<T extends string>(values: T[], value: T, enabled: boolean): T[] {
  if (enabled) {
    return values.includes(value) ? values : [...values, value];
  }
  return values.filter((item) => item !== value);
}

export function JobsFilterPanel({
  filters,
  jobOptions,
  onApply,
  onClear,
  onCancel,
  className,
}: JobsFilterPanelProps) {
  const t = useTranslate();
  const [draft, setDraft] = useState<EmployerJobsFiltersState>(filters);
  const locationInputId = useId();
  const minSalaryId = useId();
  const maxSalaryId = useId();
  const minVacanciesId = useId();
  const maxVacanciesId = useId();
  const postedFromId = useId();
  const postedToId = useId();

  const hasActiveFilters = employerJobsFiltersAreActive(draft);
  const appliedAreActive = employerJobsFiltersAreActive(filters);
  const postedJobOptions = [
    { value: "", label: t("employer.jobs.filter.allPostedJobs") },
    ...jobOptions.map((job) => ({
      value: job.jobId,
      label: job.jobTitle,
    })),
  ];
  const postedQuickOptions = EMPLOYER_JOBS_POSTED_QUICK_OPTIONS.map(
    (option) => ({ value: option.value, label: t(option.labelKey) }),
  );

  const patch = (partial: Partial<EmployerJobsFiltersState>) => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  return (
    <section
      className={cn(
        "flex h-full min-h-0 w-full flex-col bg-surface",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-3 py-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary">
            <Filter className="size-3" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold text-foreground">
            {t("employer.jobs.filters")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft({ ...DEFAULT_EMPLOYER_JOBS_FILTERS });
            onClear();
          }}
          disabled={!hasActiveFilters && !appliedAreActive}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.6875rem] font-semibold text-muted transition-colors hover:bg-hero-bg hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="size-3" aria-hidden="true" />
          {t("employer.jobs.filter.clearAll")}
        </button>
      </div>

      <div
        tabIndex={0}
        aria-label={t("employer.jobs.filter.optionsAria")}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 scrollbar-hidden"
      >
        <div className="flex flex-col gap-3">
        <FilterField label={t("jobs.employmentType")}>
          <div className="flex flex-col gap-0.5 rounded-md border border-border-subtle bg-surface p-1.5">
            {EMPLOYER_JOBS_JOB_TYPE_FILTER_VALUES.map((jobType) => (
              <FilterCheckboxRow
                key={jobType}
                checked={draft.jobTypes.includes(jobType)}
                label={formatJobSearchJobType(jobType)}
                onChange={(enabled) =>
                  patch({
                    jobTypes: toggleValue(draft.jobTypes, jobType, enabled),
                  })
                }
              />
            ))}
          </div>
        </FilterField>

        <FilterField label={t("jobs.workMode")}>
          <div className="flex flex-col gap-0.5 rounded-md border border-border-subtle bg-surface p-1.5">
            {EMPLOYER_JOBS_WORK_MODE_FILTER_VALUES.map((workMode) => (
              <FilterCheckboxRow
                key={workMode}
                checked={draft.workModes.includes(workMode)}
                label={formatJobSearchWorkMode(workMode)}
                onChange={(enabled) =>
                  patch({
                    workModes: toggleValue(draft.workModes, workMode, enabled),
                  })
                }
              />
            ))}
          </div>
        </FilterField>

        <FilterField label={t("jobs.experience")}>
          <div className="flex flex-col gap-0.5 rounded-md border border-border-subtle bg-surface p-1.5">
            {EMPLOYER_JOBS_EXPERIENCE_FILTER_VALUES.map((experience) => (
              <FilterCheckboxRow
                key={experience}
                checked={draft.experience.includes(experience)}
                label={formatJobSearchExperience(experience)}
                onChange={(enabled) =>
                  patch({
                    experience: toggleValue(
                      draft.experience,
                      experience,
                      enabled,
                    ),
                  })
                }
              />
            ))}
          </div>
        </FilterField>

        <div className="grid grid-cols-2 gap-2">
          <FilterField
            label={t("employer.jobs.filter.minSalary")}
            htmlFor={minSalaryId}
          >
            <input
              id={minSalaryId}
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.minSalary}
              placeholder={t("employer.jobs.filter.examplePlaceholder", {
                value: "15000",
              })}
              className={fieldClassName}
              onChange={(event) => patch({ minSalary: event.target.value })}
            />
          </FilterField>
          <FilterField
            label={t("employer.jobs.filter.maxSalary")}
            htmlFor={maxSalaryId}
          >
            <input
              id={maxSalaryId}
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.maxSalary}
              placeholder={t("employer.jobs.filter.examplePlaceholder", {
                value: "40000",
              })}
              className={fieldClassName}
              onChange={(event) => patch({ maxSalary: event.target.value })}
            />
          </FilterField>
        </div>

        <FilterField label={t("jobs.location")} htmlFor={locationInputId}>
          <JobsLocationAutocomplete
            id={locationInputId}
            value={draft.locationLabel}
            inputClassName={fieldClassName}
            onInputChange={(label) => patch({ locationLabel: label })}
            onClear={() =>
              patch({
                city: "",
                cityLabel: "",
                state: "",
                stateLabel: "",
                locationLabel: "",
              })
            }
            onSelect={(selection) => patch(selection)}
          />
        </FilterField>

        <FilterField label={t("employer.jobs.filter.postedJob")}>
          <EmployerRegisterSearchableSelect
            id="employer-jobs-filter-posted-job"
            label={t("employer.jobs.filter.postedJob")}
            hideLabel
            value={draft.postedJobId}
            placeholder={t("employer.jobs.filter.allPostedJobs")}
            options={postedJobOptions}
            searchPlaceholder={t("employer.jobs.filter.searchPostedJobs")}
            onChange={(value) =>
              patch({
                postedJobId: value,
                postedJobTitle:
                  jobOptions.find((job) => job.jobId === value)?.jobTitle ?? "",
              })
            }
            triggerClassName={filterSelectTriggerClassName}
          />
        </FilterField>

        <FilterField label={t("employer.jobs.filter.datePosted")}>
          <EmployerRegisterSearchableSelect
            id="employer-jobs-filter-posted"
            label={t("employer.jobs.filter.datePosted")}
            hideLabel
            hideSearch
            value={draft.postedQuick}
            placeholder={t("employer.jobs.filter.anyTime")}
            options={postedQuickOptions}
            onChange={(value) =>
              patch({
                postedQuick: value as EmployerJobsPostedQuickFilter,
                ...(value !== "custom"
                  ? { postedFrom: "", postedTo: "" }
                  : null),
              })
            }
            triggerClassName={filterSelectTriggerClassName}
          />
        </FilterField>

        {draft.postedQuick === "custom" ? (
          <div className="grid grid-cols-2 gap-2">
            <FilterField
              label={t("employer.jobs.filter.from")}
              htmlFor={postedFromId}
            >
              <input
                id={postedFromId}
                type="date"
                value={draft.postedFrom}
                className={fieldClassName}
                onChange={(event) => patch({ postedFrom: event.target.value })}
              />
            </FilterField>
            <FilterField
              label={t("employer.jobs.filter.to")}
              htmlFor={postedToId}
            >
              <input
                id={postedToId}
                type="date"
                value={draft.postedTo}
                className={fieldClassName}
                onChange={(event) => patch({ postedTo: event.target.value })}
              />
            </FilterField>
          </div>
        ) : null}

        <FilterField label={t("employer.stats.applications")}>
          <div className="flex flex-col gap-0.5 rounded-md border border-border-subtle bg-surface p-1.5">
            {EMPLOYER_JOBS_APPLICATION_BAND_VALUES.map((band) => (
              <FilterCheckboxRow
                key={band}
                checked={draft.applications.includes(band)}
                label={formatEmployerJobsApplicationBand(band, t)}
                onChange={(enabled) =>
                  patch({
                    applications: toggleValue(
                      draft.applications,
                      band,
                      enabled,
                    ),
                  })
                }
              />
            ))}
          </div>
        </FilterField>

        <div className="grid grid-cols-2 gap-2">
          <FilterField
            label={t("employer.jobs.filter.minOpenings")}
            htmlFor={minVacanciesId}
          >
            <input
              id={minVacanciesId}
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.minVacancies}
              placeholder="1"
              className={fieldClassName}
              onChange={(event) => patch({ minVacancies: event.target.value })}
            />
          </FilterField>
          <FilterField
            label={t("employer.jobs.filter.maxOpenings")}
            htmlFor={maxVacanciesId}
          >
            <input
              id={maxVacanciesId}
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.maxVacancies}
              placeholder="10"
              className={fieldClassName}
              onChange={(event) => patch({ maxVacancies: event.target.value })}
            />
          </FilterField>
        </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-2 border-t border-border-subtle px-3 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-border bg-surface text-sm font-semibold text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="inline-flex h-9 flex-[1.4] items-center justify-center rounded-lg bg-primary text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {t("jobs.applyFilters")}
        </button>
      </div>
    </section>
  );
}
