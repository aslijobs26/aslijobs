import { useId } from "react";
import type {
  OperationsCandidateDatePreset,
  OperationsCandidatesPeriodStats,
} from "../../../types/operations-candidates";
import { cn } from "../../../utils/cn";
import { OperationsDatePicker } from "../../ui/OperationsDatePicker";

export interface CandidatesDateFiltersState {
  datePreset: OperationsCandidateDatePreset;
  dateFrom: string;
  dateTo: string;
}

interface CandidatesDateAnalyticsBarProps {
  filters: CandidatesDateFiltersState;
  periodStats: OperationsCandidatesPeriodStats;
  onChange: (next: Partial<CandidatesDateFiltersState>) => void;
}

const PRESETS: { value: OperationsCandidateDatePreset; label: string }[] = [
  { value: "all", label: "All Candidates" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "custom", label: "Custom" },
];

function periodLabel(preset: OperationsCandidateDatePreset): string {
  switch (preset) {
    case "all":
      return "All Time";
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "last_7_days":
      return "Last 7 Days";
    case "last_30_days":
      return "Last 30 Days";
    case "custom":
      return "Custom Range";
    default:
      return "Period";
  }
}

function todayIsoDate(): string {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

export function CandidatesDateAnalyticsBar({
  filters,
  periodStats,
  onChange,
}: CandidatesDateAnalyticsBarProps) {
  const label = periodLabel(filters.datePreset);
  const fromPickerId = useId();
  const toPickerId = useId();
  const todayIso = todayIsoDate();

  const handleFromChange = (dateFrom: string) => {
    // To can only be on/after From — clamp when From moves past To.
    const dateTo =
      filters.dateTo && dateFrom && filters.dateTo < dateFrom
        ? dateFrom
        : filters.dateTo;
    onChange({ dateFrom, dateTo });
  };

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm ops-brand-border-glow sm:p-3.5">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Candidate Registration Analytics
          </p>
          <div
            className="mt-2 flex flex-wrap gap-1.5"
            role="group"
            aria-label="Date range presets"
          >
            {PRESETS.map((preset) => {
              const selected = filters.datePreset === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() =>
                    onChange({
                      datePreset: preset.value,
                      ...(preset.value !== "custom"
                        ? { dateFrom: "", dateTo: "" }
                        : filters.dateFrom || filters.dateTo
                          ? {}
                          : (() => {
                              const iso = todayIsoDate();
                              return { dateFrom: iso, dateTo: iso };
                            })()),
                    })
                  }
                  className={cn(
                    "inline-flex h-8 items-center rounded-md border px-2.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    selected
                      ? "ops-brand-border-glow border-primary-soft bg-primary-light text-primary-soft"
                      : "border-border bg-hero-bg/60 text-muted hover:bg-surface hover:text-foreground",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {filters.datePreset === "custom" ? (
            <div className="mt-2.5 flex flex-wrap items-end gap-2">
              <div className="min-w-[9.5rem] flex-1">
                <label
                  htmlFor={fromPickerId}
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted"
                >
                  From
                </label>
                <OperationsDatePicker
                  id={fromPickerId}
                  value={filters.dateFrom}
                  placeholder="From date"
                  maxDate={todayIso}
                  compact
                  aria-label="Custom range from date"
                  onChange={handleFromChange}
                />
              </div>
              <div className="min-w-[9.5rem] flex-1">
                <label
                  htmlFor={toPickerId}
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted"
                >
                  To
                </label>
                <OperationsDatePicker
                  id={toPickerId}
                  value={filters.dateTo}
                  placeholder="To date"
                  minDate={filters.dateFrom.trim() || undefined}
                  maxDate={todayIso}
                  compact
                  aria-label="Custom range to date"
                  onChange={(dateTo) => onChange({ dateTo })}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[28rem]">
          <article className="rounded-lg border border-border-subtle bg-hero-bg/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Registered {label}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-success">
              {periodStats.candidatesRegistered.toLocaleString("en-IN")}
            </p>
          </article>
          <article className="rounded-lg border border-border-subtle bg-hero-bg/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              With Applications
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-chart-accent">
              {periodStats.withApplications.toLocaleString("en-IN")}
            </p>
          </article>
          <article className="rounded-lg border border-border-subtle bg-hero-bg/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Profiles Incomplete
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-warning">
              {periodStats.profilesIncomplete.toLocaleString("en-IN")}
            </p>
          </article>
          <article className="rounded-lg border border-border-subtle bg-hero-bg/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Recently Active
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-chart-accent-alt">
              {periodStats.recentlyActive.toLocaleString("en-IN")}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
