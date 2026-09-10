import { RotateCcw, Search } from "lucide-react";
import type {
  OperationsPlacementsFilterOptions,
  PlacementJoiningStatusFilter,
  PlacementsAnalyticsPreset,
} from "../../../types/operations-placements";
import { cn } from "../../../utils/cn";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";

export interface PlacementsFiltersState {
  search: string;
  status: PlacementJoiningStatusFilter | "";
  category: string;
  state: string;
  city: string;
  preset: PlacementsAnalyticsPreset | "";
}

export const EMPTY_PLACEMENTS_FILTERS: PlacementsFiltersState = {
  search: "",
  status: "",
  category: "",
  state: "",
  city: "",
  preset: "",
};

interface PlacementsFiltersBarProps {
  filters: PlacementsFiltersState;
  filterOptions: OperationsPlacementsFilterOptions;
  onChange: (next: Partial<PlacementsFiltersState>) => void;
  onClear: () => void;
  showStatus?: boolean;
  compact?: boolean;
}

const PRESET_OPTIONS: {
  value: PlacementsAnalyticsPreset | "";
  label: string;
}[] = [
  { value: "", label: "All Dates" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "last_90_days", label: "Last 90 Days" },
  { value: "this_year", label: "This Year" },
  { value: "all", label: "Overall" },
];

const STATUS_FALLBACK: Array<{
  value: PlacementJoiningStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All Statuses" },
  { value: "joined", label: "Joined" },
  { value: "joining_pending", label: "Joining Pending" },
  { value: "did_not_join", label: "Did Not Join" },
];

const triggerClassName = cn(
  "!h-8 !w-full !min-w-0 !rounded-md !px-2 !text-[11px] xl:!h-7 xl:!text-[10px]",
  "border-border-subtle bg-surface ops-brand-border-glow hover:bg-hero-bg/60",
);

export function PlacementsFiltersBar({
  filters,
  filterOptions,
  onChange,
  onClear,
  showStatus = true,
  compact = false,
}: PlacementsFiltersBarProps) {
  const statusOptions =
    filterOptions.statuses.length > 0
      ? filterOptions.statuses
      : STATUS_FALLBACK;

  const activeFilterCount = [
    filters.search.trim(),
    showStatus && filters.status && filters.status !== "all"
      ? filters.status
      : "",
    filters.category,
    filters.state,
    filters.city,
    filters.preset,
  ].filter(Boolean).length;

  return (
    <div className="flex min-w-0 flex-col gap-2 xl:gap-1.5">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="relative block min-w-0 sm:min-w-[12rem] sm:max-w-xs sm:flex-1 xl:max-w-[14rem]">
          <span className="sr-only">Search placements</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted xl:size-3"
            aria-hidden="true"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Search candidate, company, job"
            autoComplete="off"
            spellCheck={false}
            className={cn(
              "h-8 w-full rounded-md border border-border-subtle bg-surface py-1.5 pr-2.5 pl-8 text-[11px] text-foreground outline-none",
              "placeholder:text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
              "xl:h-7 xl:pl-7 xl:text-[10px]",
              "[appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
            )}
          />
        </label>

        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md border border-border-subtle bg-surface px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:h-7 xl:text-[10px]"
          >
            <RotateCcw className="size-3 xl:size-2.5" aria-hidden="true" />
            Reset
            <span className="tabular-nums text-muted">
              ({activeFilterCount})
            </span>
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          "grid min-w-0 gap-1.5",
          compact
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
        )}
      >
        {showStatus ? (
          <OperationsFilterSelect
            label="Status"
            value={filters.status || "all"}
            options={statusOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            hideSearch
            triggerClassName={triggerClassName}
            onChange={(status) =>
              onChange({
                status: status as PlacementJoiningStatusFilter,
              })
            }
          />
        ) : null}
        <OperationsFilterSelect
          label="Category"
          value={filters.category}
          options={[
            { value: "", label: "All Categories" },
            ...filterOptions.categories,
          ]}
          triggerClassName={triggerClassName}
          onChange={(category) => onChange({ category })}
        />
        <OperationsFilterSelect
          label="State"
          value={filters.state}
          options={[
            { value: "", label: "All States" },
            ...filterOptions.states.map((state) => ({
              value: state,
              label: state,
            })),
          ]}
          triggerClassName={triggerClassName}
          onChange={(state) => onChange({ state, city: "" })}
        />
        <OperationsFilterSelect
          label="City"
          value={filters.city}
          options={[
            { value: "", label: "All Cities" },
            ...filterOptions.cities.map((city) => ({
              value: city,
              label: city,
            })),
          ]}
          triggerClassName={triggerClassName}
          onChange={(city) => onChange({ city })}
        />
        <OperationsFilterSelect
          label="Date range"
          value={filters.preset}
          options={PRESET_OPTIONS}
          hideSearch
          triggerClassName={triggerClassName}
          onChange={(value) =>
            onChange({
              preset: value as PlacementsAnalyticsPreset | "",
            })
          }
        />
      </div>
    </div>
  );
}
