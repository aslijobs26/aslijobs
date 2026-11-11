import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { AnalyticsDatePreset } from "../../../types/operations-analytics";
import { cn } from "../../../utils/cn";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";
import { OperationsPostJobPlaceAutocomplete } from "../jobs/post/OperationsPostJobPlaceAutocomplete";
import {
  emptyFilters,
  todayKey,
  validateCustomRange,
  type AnalyticsFilterDraft,
} from "./analytics-filters";

const CATEGORIES = [
  ["construction-infrastructure", "Construction & Infrastructure"],
  ["manufacturing", "Manufacturing"],
  ["logistics-transportation", "Logistics & Delivery"],
  ["retail-ecommerce", "Retail & Sales"],
  ["hospitality", "Hospitality & Food Services"],
  ["healthcare", "Healthcare"],
  ["education", "Education"],
  ["security-services", "Security Services"],
  ["facility-management", "Facilities Management"],
  ["it-software", "IT & Software"],
  ["telecom", "Telecom"],
  ["agriculture", "Agriculture"],
  ["banking-financial-services", "Finance & Accounting"],
  ["media-entertainment", "Media & Entertainment"],
  ["beauty-wellness", "Beauty & Wellness"],
  ["domestic-home-services", "Domestic & Home Services"],
] as const;

const PRESETS: { value: AnalyticsDatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 90 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "last_6_months", label: "Last 6 months" },
  { value: "this_year", label: "This year" },
  { value: "all", label: "Overall" },
  { value: "custom", label: "Custom range" },
];

const JOB_TYPES = [
  { value: "", label: "All types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
];

const APPLICATION_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "submitted", label: "Applied" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview scheduled" },
  { value: "interview_completed", label: "Interview completed" },
  { value: "offer_sent", label: "Offer sent" },
  { value: "selected", label: "Selected" },
  { value: "joined", label: "Joined" },
  { value: "rejected", label: "Rejected" },
];

const controlSurfaceClassName =
  "border-border-subtle bg-hero-bg/60 ops-brand-border-glow hover:bg-surface";

const filterTriggerClassName = cn(
  "!h-10 !w-full !min-w-0 !rounded-lg sm:!h-9",
  controlSurfaceClassName,
);

const fieldClass =
  "ops-brand-border-glow h-10 min-w-0 rounded-lg border border-border-subtle bg-hero-bg/60 px-2.5 text-xs font-medium text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[border-color,box-shadow,background-color] placeholder:font-normal placeholder:text-muted hover:border-primary/25 hover:bg-surface focus-visible:border-primary focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-9";

interface AnalyticsFilterBarProps {
  applied: AnalyticsFilterDraft;
  stateOptions: { value: string; label: string }[];
  onApply: (draft: AnalyticsFilterDraft) => void;
  isRefreshing: boolean;
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function activeFilterCount(filters: AnalyticsFilterDraft): number {
  return [
    filters.preset !== "last_6_months",
    filters.country,
    filters.state,
    filters.city,
    filters.category,
    filters.employer,
    filters.jobType,
    filters.applicationStatus,
    filters.horizonDays !== 30,
  ].filter(Boolean).length;
}

export function AnalyticsFilterBar({
  applied,
  stateOptions,
  onApply,
  isRefreshing,
}: AnalyticsFilterBarProps) {
  const [draft, setDraft] = useState(applied);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setDraft(applied);
  }, [applied]);

  const patch = (partial: Partial<AnalyticsFilterDraft>) => {
    setDraft((current) => ({ ...current, ...partial }));
    setError(null);
  };

  const apply = () => {
    if (draft.preset === "custom") {
      const message = validateCustomRange(draft.dateFrom, draft.dateTo);
      if (message) {
        setError(message);
        return;
      }
    }
    onApply(draft);
  };

  const appliedCount = activeFilterCount(applied);
  const draftChanged = JSON.stringify(draft) !== JSON.stringify(applied);

  return (
    <section
      className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm ops-brand-border-glow sm:p-4"
      aria-label="Analytics filters"
    >
      <div
        data-tour="ops-analytics-filters"
        className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
            <SlidersHorizontal className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-foreground">Filters</h2>
            <p className="text-[11px] text-muted">
              {isRefreshing
                ? "Updating the dashboard…"
                : appliedCount > 0
                  ? `${appliedCount} active ${appliedCount === 1 ? "filter" : "filters"}`
                  : "Default view · last 6 months"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(applied);
              setError(null);
            }}
            disabled={!draftChanged}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              draftChanged
                ? "text-muted hover:bg-hero-bg hover:text-foreground"
                : "cursor-not-allowed text-muted/40",
            )}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              const cleared = emptyFilters();
              setDraft(cleared);
              setError(null);
              onApply(cleared);
            }}
            disabled={appliedCount === 0 && !draftChanged}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/25 hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={apply}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3.5 text-xs font-semibold text-white shadow-[0_1px_2px_rgba(0,186,165,0.35)] transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 md:grid-cols-3">
        <FilterField label="Date range">
          <OperationsFilterSelect
            label="Date range"
            value={draft.preset}
            options={PRESETS}
            hideSearch
            hideSrOnlyLabel
            triggerClassName={filterTriggerClassName}
            onChange={(value) => patch({ preset: value as AnalyticsDatePreset })}
          />
        </FilterField>
        {draft.preset === "custom" ? (
          <>
            <FilterField label="Start">
              <input
                className={fieldClass}
                type="date"
                max={todayKey()}
                value={draft.dateFrom}
                onChange={(event) => patch({ dateFrom: event.target.value })}
              />
            </FilterField>
            <FilterField label="End">
              <input
                className={fieldClass}
                type="date"
                max={todayKey()}
                min={draft.dateFrom || undefined}
                value={draft.dateTo}
                onChange={(event) => patch({ dateTo: event.target.value })}
              />
            </FilterField>
          </>
        ) : null}
        <FilterField label="Forecast horizon">
          <OperationsFilterSelect
            label="Forecast horizon"
            value={String(draft.horizonDays)}
            options={[7, 14, 30, 60, 90].map((days) => ({
              value: String(days),
              label: `${days} days`,
            }))}
            hideSearch
            hideSrOnlyLabel
            triggerClassName={filterTriggerClassName}
            onChange={(value) => patch({ horizonDays: Number(value) })}
          />
        </FilterField>
        <FilterField label="Country">
          <OperationsFilterSelect
            label="Country"
            value={draft.country}
            options={[
              { value: "", label: "India (all records)" },
              { value: "India", label: "India" },
              { value: "Other", label: "Other" },
            ]}
            hideSearch
            hideSrOnlyLabel
            triggerClassName={filterTriggerClassName}
            onChange={(value) => patch({ country: value })}
          />
        </FilterField>
        <FilterField label="State">
          <OperationsFilterSelect
            label="State"
            value={draft.state}
            options={stateOptions}
            hideSrOnlyLabel
            triggerClassName={filterTriggerClassName}
            onChange={(value) => patch({ state: value, city: "" })}
          />
        </FilterField>
        <FilterField label="City">
          <OperationsPostJobPlaceAutocomplete
            id="analytics-filter-city"
            mode="city"
            value={draft.city}
            selectedState={draft.state}
            disabled={!draft.state}
            placeholder={draft.state ? "Search city" : "Select a state first"}
            inputClassName={fieldClass}
            portal
            onChange={(value) => patch({ city: value })}
            onSelect={(suggestion) =>
              patch({ city: suggestion.city || suggestion.label })
            }
          />
        </FilterField>
        <FilterField label="Category">
          <OperationsFilterSelect
            label="Category"
            value={draft.category}
            options={[
              { value: "", label: "All categories" },
              ...CATEGORIES.map(([id, label]) => ({ value: id, label })),
            ]}
            hideSrOnlyLabel
            triggerClassName={filterTriggerClassName}
            onChange={(value) => patch({ category: value })}
          />
        </FilterField>
        <FilterField label="Employer">
          <input
            className={fieldClass}
            value={draft.employer}
            placeholder="Name or id"
            onChange={(event) => patch({ employer: event.target.value })}
          />
        </FilterField>
        <FilterField label="Job type">
          <OperationsFilterSelect
            label="Job type"
            value={draft.jobType}
            options={JOB_TYPES}
            hideSearch
            hideSrOnlyLabel
            triggerClassName={filterTriggerClassName}
            onChange={(value) => patch({ jobType: value })}
          />
        </FilterField>
        <FilterField label="Application status">
          <OperationsFilterSelect
            label="Application status"
            value={draft.applicationStatus}
            options={APPLICATION_STATUSES}
            hideSearch
            hideSrOnlyLabel
            triggerClassName={filterTriggerClassName}
            onChange={(value) => patch({ applicationStatus: value })}
          />
        </FilterField>
      </div>
      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </p>
      ) : null}
    </section>
  );
}
