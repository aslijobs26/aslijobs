import type {
  OperationsCandidateDatePreset,
  OperationsCandidatesPeriodStats,
} from "../../../types/operations-candidates";
import { cn } from "../../../utils/cn";

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
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "custom", label: "Custom" },
];

export function CandidatesDateAnalyticsBar({
  filters,
  periodStats,
  onChange,
}: CandidatesDateAnalyticsBarProps) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm ops-brand-border-glow sm:p-3.5">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Candidate arrival analytics
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
                              const today = new Date();
                              const iso = [
                                today.getFullYear(),
                                String(today.getMonth() + 1).padStart(2, "0"),
                                String(today.getDate()).padStart(2, "0"),
                              ].join("-");
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
              <label className="min-w-[8rem] flex-1">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted">
                  From
                </span>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) =>
                    onChange({ dateFrom: event.target.value })
                  }
                  className="ops-brand-border-glow h-9 w-full rounded-lg border border-border-subtle bg-hero-bg/60 px-2.5 text-xs font-medium text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </label>
              <label className="min-w-[8rem] flex-1">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted">
                  To
                </span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(event) => onChange({ dateTo: event.target.value })}
                  className="ops-brand-border-glow h-9 w-full rounded-lg border border-border-subtle bg-hero-bg/60 px-2.5 text-xs font-medium text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-2 sm:min-w-[18rem]">
          <article className="rounded-lg border border-border-subtle bg-hero-bg/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Candidates registered
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              {periodStats.candidatesRegistered.toLocaleString("en-IN")}
            </p>
          </article>
          <article className="rounded-lg border border-border-subtle bg-hero-bg/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Applications received
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              {periodStats.applicationsReceived.toLocaleString("en-IN")}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
