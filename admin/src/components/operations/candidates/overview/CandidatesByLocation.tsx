import { useMemo, useState } from "react";
import indiaStatesMap from "../../../../assets/india-states-map.json";
import type { OperationsCandidatesAnalyticsNamedCount } from "../../../../types/operations-candidates";
import { cn } from "../../../../utils/cn";
import { OperationsFilterSelect } from "../../jobs/OperationsFilterSelect";
import {
  resolveIndiaStateLabel,
  resolveMapFeatureStateName,
} from "../../employers/overview/india-state-normalize";

type LocationDimension = "states" | "cities";
type LocationLimit = "5" | "10" | "all";

interface CandidatesByLocationProps {
  items: OperationsCandidatesAnalyticsNamedCount[];
  cities?: OperationsCandidatesAnalyticsNamedCount[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

const INACTIVE_FILL = "#E8EEF5";
const INACTIVE_STROKE = "#D5DEE9";
const HIGHLIGHT_PALETTE = [
  "#0F766E",
  "#0D9488",
  "#14B8A6",
  "#2DD4BF",
  "#5EEAD4",
  "#99F6E4",
  "#CCFBF1",
  "#E0F2FE",
  "#EEF2FF",
  "#F1F5F9",
] as const;

const DIMENSION_TABS: Array<{ id: LocationDimension; label: string }> = [
  { id: "states", label: "States" },
  { id: "cities", label: "Cities" },
];

const LIMIT_OPTIONS = [
  { value: "5", label: "Top 5" },
  { value: "10", label: "Top 10" },
  { value: "all", label: "All" },
] as const;

function intensityColor(rank: number, total: number): string {
  if (total <= 1) {
    return HIGHLIGHT_PALETTE[0];
  }
  const ratio = rank / Math.max(total - 1, 1);
  const index = Math.min(
    HIGHLIGHT_PALETTE.length - 1,
    Math.round(ratio * (HIGHLIGHT_PALETTE.length - 1)),
  );
  return HIGHLIGHT_PALETTE[index];
}

function mergeStateItems(
  items: OperationsCandidatesAnalyticsNamedCount[],
): {
  ranked: OperationsCandidatesAnalyticsNamedCount[];
  unspecifiedCount: number;
} {
  const merged = new Map<string, OperationsCandidatesAnalyticsNamedCount>();
  let unspecifiedCount = 0;

  for (const item of items) {
    if (item.count <= 0) {
      continue;
    }
    if (item.label === "Unspecified") {
      unspecifiedCount += item.count;
      continue;
    }
    const resolved = resolveIndiaStateLabel(item.label) ?? item.label;
    const key = resolved.toLowerCase();
    const existing = merged.get(key);
    if (existing) {
      merged.set(key, {
        ...existing,
        count: existing.count + item.count,
      });
    } else {
      merged.set(key, {
        ...item,
        id: key.replace(/\s+/g, "-"),
        label: resolved,
      });
    }
  }

  return {
    ranked: Array.from(merged.values()).sort((a, b) => b.count - a.count),
    unspecifiedCount,
  };
}

export function CandidatesByLocation({
  items,
  cities = [],
  isLoading = false,
  isError = false,
  onRetry,
}: CandidatesByLocationProps) {
  const [dimension, setDimension] = useState<LocationDimension>("states");
  const [limit, setLimit] = useState<LocationLimit>("5");
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const showMap = dimension === "states";

  const { ranked: rankedStates, unspecifiedCount } = useMemo(
    () => mergeStateItems(items),
    [items],
  );

  const rankedCities = useMemo(
    () =>
      cities
        .filter((item) => item.count > 0 && item.label.trim())
        .slice()
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    [cities],
  );

  const rankedItems = dimension === "cities" ? rankedCities : rankedStates;
  const mappedCount = rankedStates.reduce((sum, item) => sum + item.count, 0);
  const locationTotal = mappedCount + unspecifiedCount;

  const visibleItems = useMemo(() => {
    if (limit === "all") {
      return rankedItems;
    }
    return rankedItems.slice(0, Number(limit));
  }, [limit, rankedItems]);

  const countByState = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of rankedStates) {
      map.set(item.label.toLowerCase(), item.count);
    }
    return map;
  }, [rankedStates]);

  const colorByItem = useMemo(() => {
    const map = new Map<string, string>();
    visibleItems.forEach((item, index) => {
      map.set(
        item.label.toLowerCase(),
        intensityColor(index, visibleItems.length),
      );
    });
    return map;
  }, [visibleItems]);

  const mapFeatures = useMemo(
    () =>
      indiaStatesMap.features.filter(
        (feature) =>
          feature.name && feature.name !== "Unknown" && feature.d,
      ),
    [],
  );

  const tooltip = useMemo(() => {
    if (!hoveredState || !showMap) {
      return null;
    }
    return {
      label: hoveredState,
      count: countByState.get(hoveredState.toLowerCase()) ?? 0,
    };
  }, [countByState, hoveredState, showMap]);

  const emptyLabel =
    dimension === "cities"
      ? "No city data available"
      : "No location data available";

  return (
    <section className="candidates-analytics-card operations-density-card flex h-full min-w-0 flex-col rounded-xl border border-border-subtle bg-surface shadow-sm">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-3 py-2 sm:px-3.5 sm:py-2.5">
        <h3 className="text-[13px] font-semibold tracking-tight text-foreground">
          By Location
        </h3>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <div
            role="tablist"
            aria-label="Location dimension"
            className="inline-flex max-w-full rounded-md bg-[#EEF2F6] p-0.5 dark:bg-hero-bg"
          >
            {DIMENSION_TABS.map((tab) => {
              const selected = dimension === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setDimension(tab.id);
                    setHoveredState(null);
                  }}
                  className={cn(
                    "relative rounded px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    selected
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {tab.label}
                  {selected ? (
                    <span
                      className="absolute inset-x-1.5 -bottom-0.5 h-0.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
          <OperationsFilterSelect
            label="Location ranking"
            value={limit}
            options={[...LIMIT_OPTIONS]}
            onChange={(value) => setLimit((value as LocationLimit) || "5")}
            hideSearch
            className="w-auto min-w-[6.5rem]"
            triggerClassName="h-7 min-w-[6.25rem] px-2 text-[11px] font-medium text-muted xl:h-6 xl:text-[10px]"
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 p-2.5 sm:p-3">
        {isLoading ? (
          <div
            className="grid min-h-[11.5rem] animate-pulse grid-cols-1 gap-3 sm:grid-cols-2 xl:min-h-36"
            aria-hidden="true"
          >
            <div className="rounded-lg bg-hero-bg" />
            <div className="space-y-2 py-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-6 rounded bg-hero-bg" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="flex min-h-[11.5rem] flex-col items-center justify-center gap-2 text-center xl:min-h-36">
            <p className="text-[12px] text-muted">
              Unable to load location analytics
            </p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : rankedItems.length === 0 ? (
          <p className="flex min-h-[11.5rem] items-center justify-center text-center text-xs text-muted xl:min-h-36">
            {emptyLabel}
          </p>
        ) : (
          <div
            className={cn(
              "grid min-h-[11.5rem] items-center gap-3 xl:min-h-36 xl:gap-2",
              showMap ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
            )}
          >
            {showMap ? (
              <div className="relative mx-auto w-full max-w-[11.5rem] sm:max-w-none">
                <svg
                  viewBox={indiaStatesMap.viewBox}
                  className="h-auto w-full max-h-[12.5rem] xl:max-h-[10rem]"
                  role="img"
                  aria-label="India map of jobseeker concentration by state"
                >
                  {mapFeatures.map((feature) => {
                    const canonical = resolveMapFeatureStateName(feature.name);
                    const key = canonical.toLowerCase();
                    const fill = colorByItem.get(key) ?? INACTIVE_FILL;
                    const isHovered = hoveredState?.toLowerCase() === key;

                    return (
                      <path
                        key={feature.id}
                        d={feature.d}
                        fill={fill}
                        stroke={isHovered ? "#115E59" : INACTIVE_STROKE}
                        strokeWidth={isHovered ? 1.4 : 0.6}
                        className="cursor-pointer transition-[fill,stroke-width] duration-150"
                        onMouseEnter={() => setHoveredState(canonical)}
                        onMouseLeave={() => setHoveredState(null)}
                        onFocus={() => setHoveredState(canonical)}
                        onBlur={() => setHoveredState(null)}
                        tabIndex={0}
                        aria-label={`${canonical}: ${countByState.get(key) ?? 0} jobseekers`}
                      />
                    );
                  })}
                </svg>
                {tooltip ? (
                  <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-md border border-border-subtle bg-surface px-2 py-1 text-center shadow-sm">
                    <p className="text-[11px] font-semibold text-foreground">
                      {tooltip.label}
                    </p>
                    <p className="text-[10px] text-muted">
                      {tooltip.count.toLocaleString("en-IN")} Jobseekers
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="min-w-0">
              <ul
                className={cn(
                  "min-w-0 divide-y divide-border-subtle",
                  (limit === "all" || !showMap) &&
                    "max-h-[12.5rem] overflow-y-auto overscroll-contain scrollbar-hidden xl:max-h-[10rem]",
                )}
              >
                {visibleItems.map((item) => {
                  const swatch =
                    colorByItem.get(item.label.toLowerCase()) ?? INACTIVE_FILL;
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        "flex items-center gap-2 py-1.5 text-[12px] xl:py-1 xl:text-[11px]",
                        showMap &&
                          hoveredState?.toLowerCase() ===
                            item.label.toLowerCase() &&
                          "bg-hero-bg/70",
                      )}
                      onMouseEnter={() => {
                        if (showMap) {
                          setHoveredState(item.label);
                        }
                      }}
                      onMouseLeave={() => {
                        if (showMap) {
                          setHoveredState(null);
                        }
                      }}
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-[3px]"
                        style={{ backgroundColor: swatch }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="shrink-0 tabular-nums font-semibold text-foreground">
                        {item.count.toLocaleString("en-IN")}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {dimension === "states" && unspecifiedCount > 0 ? (
                <p className="mt-2 border-t border-border-subtle pt-2 text-[10px] leading-snug text-muted">
                  {unspecifiedCount.toLocaleString("en-IN")} unspecified
                  {locationTotal > 0
                    ? ` · ${mappedCount.toLocaleString("en-IN")} of ${locationTotal.toLocaleString("en-IN")} have a mapped state`
                    : null}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
