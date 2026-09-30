"use client";

import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import {
  JOB_SEARCH_EXPERIENCE_OPTIONS,
  JOB_SEARCH_JOB_TYPE_OPTIONS,
  JOB_SEARCH_PERK_LABELS,
  JOB_SEARCH_WORK_MODE_OPTIONS,
} from "@/constants/job-search";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import type {
  SavedJobsAdvancedFilters,
  SavedJobsStats,
} from "@/types/saved-jobs";
import { cn } from "@/utils/cn";
import {
  formatJobSearchExperience,
  formatJobSearchJobType,
  formatJobSearchPerk,
  formatJobSearchWorkMode,
} from "@/utils/job-search-format";
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
        "inline-flex min-h-9 min-w-0 items-center justify-center break-words rounded-lg border px-2.5 py-1 text-center text-xs font-semibold transition-colors",
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
  const t = useTranslate();
  const anyLabel = t("seeker.savedFilters.any");
  const salaryOptions: EmployerRegisterSelectOption[] =
    SAVED_JOBS_SALARY_OPTIONS.map((option) => ({
      value: option.value,
      label: option.value ? option.label : anyLabel,
    }));
  const perkOptions: EmployerRegisterSelectOption[] = [
    { value: "", label: t("seeker.savedFilters.anyBenefit") },
    ...Object.keys(JOB_SEARCH_PERK_LABELS).map((value) => ({
      value,
      label: formatJobSearchPerk(value),
    })),
  ];
  const experienceOptions: EmployerRegisterSelectOption[] = [
    { value: "", label: t("seeker.savedFilters.anyExperience") },
    ...JOB_SEARCH_EXPERIENCE_OPTIONS.map((option) => ({
      value: option.value,
      label: formatJobSearchExperience(option.value),
    })),
  ];

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
        <h2 className="min-w-0 break-words text-sm font-bold text-foreground">
          {t("seeker.savedFilters.title")}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="text-xs font-semibold text-primary hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("seeker.savedFilters.clearAll")}
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label={t("seeker.common.closeFilters")}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor={`${idPrefix}-location`} className="sr-only">
            {t("seeker.savedFilters.location")}
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
              placeholder={t("seeker.savedFilters.locationPlaceholder")}
              className={cn(fieldClassName, "pl-9")}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0 [&_.employer-register-form-stack]:gap-0">
            <p className="mb-1 break-words text-xs font-semibold text-muted">
              {t("seeker.savedFilters.minSalary")}
            </p>
            <EmployerRegisterSearchableSelect
              id={`${idPrefix}-min-salary`}
              label={t("seeker.savedFilters.minSalary")}
              hideLabel
              hideSearch
              value={filters.minSalary}
              placeholder={t("seeker.savedFilters.minSalary")}
              options={salaryOptions}
              onChange={(value) => patch({ minSalary: value })}
              triggerClassName={selectTriggerClassName}
            />
          </div>
          <div className="min-w-0 [&_.employer-register-form-stack]:gap-0">
            <p className="mb-1 break-words text-xs font-semibold text-muted">
              {t("seeker.savedFilters.maxSalary")}
            </p>
            <EmployerRegisterSearchableSelect
              id={`${idPrefix}-max-salary`}
              label={t("seeker.savedFilters.maxSalary")}
              hideLabel
              hideSearch
              value={filters.maxSalary}
              placeholder={t("seeker.savedFilters.maxSalary")}
              options={salaryOptions}
              onChange={(value) => patch({ maxSalary: value })}
              triggerClassName={selectTriggerClassName}
            />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted">
            {t("seeker.savedFilters.jobType")}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {JOB_SEARCH_JOB_TYPE_OPTIONS.map((option) => (
              <ToggleChip
                key={option.value}
                label={formatJobSearchJobType(option.value)}
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
          <p className="mb-1.5 text-xs font-semibold text-muted">
            {t("seeker.savedFilters.workMode")}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {JOB_SEARCH_WORK_MODE_OPTIONS.map((option) => (
              <ToggleChip
                key={option.value}
                label={formatJobSearchWorkMode(option.value)}
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
          <p className="mb-1.5 text-xs font-semibold text-muted">
            {t("seeker.savedFilters.schedule")}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {SAVED_JOBS_SCHEDULE_OPTIONS.map((option) => (
              <ToggleChip
                key={option.value}
                label={t(option.labelKey)}
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
            {t("seeker.savedFilters.moreFilters")}
          </summary>
          <div className="mt-3 space-y-3">
            <div className="min-w-0 [&_.employer-register-form-stack]:gap-0">
              <p className="mb-1 text-xs font-semibold text-muted">
                {t("seeker.savedFilters.experience")}
              </p>
              <EmployerRegisterSearchableSelect
                id={`${idPrefix}-experience`}
                label={t("seeker.savedFilters.experience")}
                hideLabel
                hideSearch
                value={filters.experience}
                placeholder={t("seeker.savedFilters.anyExperience")}
                options={experienceOptions}
                onChange={(value) => patch({ experience: value })}
                triggerClassName={selectTriggerClassName}
              />
            </div>

            <div>
              <label
                htmlFor={`${idPrefix}-company`}
                className="mb-1 block text-xs font-semibold text-muted"
              >
                {t("seeker.savedFilters.company")}
              </label>
              <input
                id={`${idPrefix}-company`}
                type="search"
                value={filters.company}
                onChange={(event) => patch({ company: event.target.value })}
                placeholder={t("seeker.savedFilters.companyPlaceholder")}
                className={fieldClassName}
                autoComplete="off"
              />
            </div>

            <div className="min-w-0 [&_.employer-register-form-stack]:gap-0">
              <p className="mb-1 text-xs font-semibold text-muted">
                {t("seeker.savedFilters.benefits")}
              </p>
              <EmployerRegisterSearchableSelect
                id={`${idPrefix}-perk`}
                label={t("seeker.savedFilters.benefits")}
                hideLabel
                hideSearch={perkOptions.length <= 10}
                value={filters.perk}
                placeholder={t("seeker.savedFilters.anyBenefit")}
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
  const t = useTranslate();

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
            <p className="break-words text-xs font-bold tracking-wide text-resource-resume-icon">
              {t("seeker.savedSidebar.askAi")}{" "}
              <span className="font-semibold opacity-80">
                {t("seeker.savedSidebar.beta")}
              </span>
            </p>
            <p className="mt-1 break-words text-sm font-medium text-foreground">
              {t("seeker.savedSidebar.askAiPrompt")}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-resource-resume-icon">
              {t("seeker.common.comingSoon")}
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
            <h2 className="break-words text-sm font-bold text-foreground">
              {t("seeker.savedSidebar.neverMiss")}
            </h2>
            <p className="mt-1 break-words text-xs leading-relaxed text-muted">
              {t("seeker.savedSidebar.alertsBody")}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-resource-interview-icon">
              {t("seeker.common.comingSoon")}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="min-w-0 break-words text-sm font-bold text-foreground">
            {t("seeker.savedSidebar.overviewTitle")}
          </h2>
          <Link
            href={ROUTES.JOB_SEEKER_APPLIED_JOBS}
            className="shrink-0 text-xs font-semibold text-primary hover:text-primary-hover"
          >
            {t("seeker.common.viewReport")}
          </Link>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div className="min-w-0 rounded-lg bg-primary-light/60 px-3 py-2.5">
            <dt className="break-words text-[11px] font-medium text-muted">
              {t("seeker.savedSidebar.totalSaved")}
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-primary">
              {stats?.total ?? 0}
            </dd>
          </div>
          <div className="min-w-0 rounded-lg bg-resource-interview-surface px-3 py-2.5">
            <dt className="break-words text-[11px] font-medium text-muted">
              {t("seeker.savedSidebar.applied")}
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-resource-interview-icon">
              {stats?.applied ?? 0}
            </dd>
          </div>
          <div className="min-w-0 rounded-lg bg-resource-guide-surface px-3 py-2.5">
            <dt className="break-words text-[11px] font-medium text-muted">
              {t("seeker.savedSidebar.highMatch")}
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-resource-guide-icon">
              {stats?.highMatch ?? 0}
            </dd>
          </div>
          <div className="min-w-0 rounded-lg bg-resource-resume-surface px-3 py-2.5">
            <dt className="break-words text-[11px] font-medium text-muted">
              {t("seeker.savedSidebar.recent")}
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-resource-resume-icon">
              {stats?.recent ?? 0}
            </dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}
