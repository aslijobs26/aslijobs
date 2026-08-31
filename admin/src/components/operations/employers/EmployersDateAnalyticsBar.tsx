import { useId } from "react";
import type {
  OperationsEmployerDatePreset,
  OperationsEmployersPeriodStats,
} from "../../../types/operations-employers";
import { cn } from "../../../utils/cn";
import { OperationsDatePicker } from "../../ui/OperationsDatePicker";

export interface EmployersDateFiltersState {
  datePreset: OperationsEmployerDatePreset;
  dateFrom: string;
  dateTo: string;
}

interface EmployersDateAnalyticsBarProps {
  filters: EmployersDateFiltersState;
  periodStats: OperationsEmployersPeriodStats;
  onChange: (next: Partial<EmployersDateFiltersState>) => void;
}

const PRESETS: { value: OperationsEmployerDatePreset; label: string }[] = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "custom", label: "Custom" },
];

function periodLabel(preset: OperationsEmployerDatePreset): string {
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
      return "All Time";
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

export function EmployersDateAnalyticsBar({
  filters,
  periodStats,
  onChange,
}: EmployersDateAnalyticsBarProps) {
  const label = periodLabel(filters.datePreset);
  const fromPickerId = useId();
  const toPickerId = useId();
  const todayIso = todayIsoDate();

  const handleFromChange = (dateFrom: string) => {
    const dateTo =
      filters.dateTo && dateFrom && filters.dateTo < dateFrom
        ? dateFrom
        : filters.dateTo;
    onChange({ dateFrom, dateTo });
  };

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm ops-brand-border-glow sm:p-3.5">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        {/* Header & Date Range Presets */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Employer Registration Analytics
          </p>
          <div
            className="mt-2 flex flex-wrap items-center gap-1.5"
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
                    "inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-md border px-2.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
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
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-xl">
              <div className="min-w-0 flex-1">
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
              <div className="min-w-0 flex-1">
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

        {/* Analytics Summary Cards - Side-by-side on extra-large screens (xl+), stacked below on smaller screens */}
        <div className="grid w-full min-w-0 grid-cols-2 gap-2 min-[480px]:grid-cols-3 md:grid-cols-5 xl:w-auto xl:shrink-0 xl:min-w-[32rem] 2xl:min-w-[35rem]">
          <article className="rounded-lg border border-border-subtle bg-hero-bg/50 px-2.5 py-2 sm:px-3 sm:py-2.5">
            <p
              className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted xl:whitespace-normal xl:line-clamp-1"
              title={`Registered ${label}`}
            >
              Registered {label}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-success sm:text-xl">
              {periodStats.registered.toLocaleString("en-IN")}
            </p>
          </article>
          <article className="rounded-lg border border-border-subtle bg-hero-bg/50 px-2.5 py-2 sm:px-3 sm:py-2.5">
            <p
              className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted xl:whitespace-normal xl:line-clamp-1"
              title={`Verified ${label}`}
            >
              Verified {label}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-chart-accent sm:text-xl">
              {periodStats.verified.toLocaleString("en-IN")}
            </p>
          </article>
          <article className="rounded-lg border border-border-subtle bg-hero-bg/50 px-2.5 py-2 sm:px-3 sm:py-2.5">
            <p
              className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted xl:whitespace-normal xl:line-clamp-1"
              title="Pending Verification"
            >
              Pending Verification
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-warning sm:text-xl">
              {periodStats.pendingVerification.toLocaleString("en-IN")}
            </p>
          </article>
          <article className="rounded-lg border border-border-subtle bg-hero-bg/50 px-2.5 py-2 sm:px-3 sm:py-2.5">
            <p
              className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted xl:whitespace-normal xl:line-clamp-1"
              title={`Suspended ${label}`}
            >
              Suspended {label}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-danger sm:text-xl">
              {periodStats.suspended.toLocaleString("en-IN")}
            </p>
          </article>
          <article className="col-span-2 rounded-lg border border-border-subtle bg-hero-bg/50 px-2.5 py-2 min-[480px]:col-span-1 sm:px-3 sm:py-2.5 md:col-span-1 xl:col-span-1">
            <p
              className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted xl:whitespace-normal xl:line-clamp-1"
              title={`Rejected ${label}`}
            >
              Rejected {label}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-danger sm:text-xl">
              {periodStats.rejected.toLocaleString("en-IN")}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
