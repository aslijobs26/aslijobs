import { useMemo, useState } from "react";
import indiaStatesMap from "../../../../assets/india-states-map.json";
import type {
  OperationsJobsAnalyticsNamedCount,
  OperationsJobsLocationAnalytics,
} from "../../../../types/operations-jobs";
import { cn } from "../../../../utils/cn";
import {
  resolveIndiaStateLabel,
  resolveMapFeatureStateName,
} from "../../employers/overview/india-state-normalize";

type LocationTab = "states" | "cities" | "topLocations";

interface JobsByLocationProps {
  data: OperationsJobsLocationAnalytics;
  className?: string;
}

const INACTIVE_FILL = "#E8EEF5";
const INACTIVE_STROKE = "#D5DEE9";
const BAR_COLOR = "#2563EB";
const HIGHLIGHT_PALETTE = [
  "#1D4ED8",
  "#2563EB",
  "#3B82F6",
  "#60A5FA",
  "#93C5FD",
  "#BFDBFE",
  "#DBEAFE",
  "#E0E7FF",
  "#EEF2FF",
  "#F1F5F9",
] as const;

const TABS: { id: LocationTab; label: string }[] = [
  { id: "states", label: "States" },
  { id: "cities", label: "Cities" },
  { id: "topLocations", label: "Top Locations" },
];

const LIST_LIMIT = 6;

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

function withOthers(
  items: OperationsJobsAnalyticsNamedCount[],
  limit: number,
): OperationsJobsAnalyticsNamedCount[] {
  if (items.length <= limit) {
    return items;
  }
  const head = items.slice(0, limit);
  const restCount = items
    .slice(limit)
    .reduce((sum, item) => sum + item.count, 0);
  if (restCount <= 0) {
    return head;
  }
  return [
    ...head,
    {
      key: "others",
      label: "Others",
      count: restCount,
    },
  ];
}

export function JobsByLocation({ data, className }: JobsByLocationProps) {
  const [tab, setTab] = useState<LocationTab>("states");
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const rankedStates = useMemo(() => {
    return data.states
      .filter((item) => item.count > 0)
      .map((item) => {
        const resolved = resolveIndiaStateLabel(item.label);
        return {
          ...item,
          label: resolved ?? item.label,
        };
      });
  }, [data.states]);

  const activeItems = useMemo(() => {
    if (tab === "states") {
      return withOthers(rankedStates, LIST_LIMIT);
    }
    if (tab === "cities") {
      return withOthers(data.cities, LIST_LIMIT);
    }
    return withOthers(data.topLocations, LIST_LIMIT);
  }, [tab, rankedStates, data.cities, data.topLocations]);

  const maxCount = Math.max(...activeItems.map((item) => item.count), 1);

  const countByState = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of rankedStates) {
      map.set(item.label.toLowerCase(), item.count);
    }
    return map;
  }, [rankedStates]);

  const colorByState = useMemo(() => {
    const map = new Map<string, string>();
    rankedStates.forEach((item, index) => {
      map.set(
        item.label.toLowerCase(),
        intensityColor(index, rankedStates.length),
      );
    });
    return map;
  }, [rankedStates]);

  const mapFeatures = useMemo(
    () =>
      indiaStatesMap.features.filter(
        (feature) => feature.name && feature.name !== "Unknown" && feature.d,
      ),
    [],
  );

  const tooltip = useMemo(() => {
    if (!hoveredState) {
      return null;
    }
    return {
      label: hoveredState,
      count: countByState.get(hoveredState.toLowerCase()) ?? 0,
    };
  }, [countByState, hoveredState]);

  const showMap = tab === "states";
  const isEmpty = activeItems.length === 0;

  return (
    <section
      className={cn(
        "jobs-analytics-card operations-density-card flex h-full min-w-0 flex-col rounded-xl border border-border-subtle bg-surface shadow-sm",
        className,
      )}
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-3 py-2 sm:px-3.5 sm:py-2.5 xl:px-3 xl:py-1.5">
        <h3 className="text-[13px] font-semibold tracking-tight text-foreground xl:text-[12px]">
          Jobs by Location
        </h3>
        <div
          role="tablist"
          aria-label="Location breakdown"
          className="inline-flex max-w-full flex-wrap rounded-md bg-[#EEF2F6] p-0.5 dark:bg-hero-bg"
        >
          {TABS.map((item) => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(item.id)}
                className={cn(
                  "relative rounded px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:px-1.5 xl:py-0.5 xl:text-[9px]",
                  selected
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted hover:text-foreground",
                )}
              >
                {item.label}
                {selected ? (
                  <span
                    className="absolute inset-x-1.5 -bottom-0.5 h-0.5 rounded-full bg-[#2563EB]"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </header>

      <div className="min-h-0 flex-1 p-2.5 sm:p-3 xl:p-2.5">
        {isEmpty ? (
          <p className="flex min-h-[9rem] items-center justify-center text-center text-xs text-muted xl:min-h-[8rem]">
            No location data available
          </p>
        ) : (
          <div
            className={cn(
              "grid min-h-[9rem] items-center gap-2.5 xl:min-h-[8rem] xl:gap-2",
              showMap ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
            )}
          >
            {showMap ? (
              <div className="relative mx-auto w-full max-w-[10rem] sm:max-w-none">
                <svg
                  viewBox={indiaStatesMap.viewBox}
                  className="h-auto w-full max-h-[10.5rem] xl:max-h-[8.5rem]"
                  role="img"
                  aria-label="India map of job concentration by state"
                >
                  {mapFeatures.map((feature) => {
                    const canonical = resolveMapFeatureStateName(feature.name);
                    const key = canonical.toLowerCase();
                    const fill = colorByState.get(key) ?? INACTIVE_FILL;
                    const isHovered = hoveredState?.toLowerCase() === key;

                    return (
                      <path
                        key={feature.id}
                        d={feature.d}
                        fill={fill}
                        stroke={isHovered ? "#1E3A8A" : INACTIVE_STROKE}
                        strokeWidth={isHovered ? 1.4 : 0.6}
                        className="cursor-pointer transition-[fill,stroke-width] duration-150"
                        onMouseEnter={() => setHoveredState(canonical)}
                        onMouseLeave={() => setHoveredState(null)}
                        onFocus={() => setHoveredState(canonical)}
                        onBlur={() => setHoveredState(null)}
                        tabIndex={0}
                        aria-label={`${canonical}: ${countByState.get(key) ?? 0} jobs`}
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
                      {tooltip.count.toLocaleString("en-IN")} Jobs
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <ul
              className={cn(
                "flex min-w-0 flex-col justify-center gap-2 overflow-y-auto overscroll-contain scrollbar-hidden xl:gap-1.5",
                "max-h-[10.5rem] xl:max-h-[8.5rem]",
              )}
            >
              {activeItems.map((item) => {
                const width = Math.max(
                  8,
                  Math.round((item.count / maxCount) * 100),
                );
                const isStateRow =
                  tab === "states" && item.key !== "others";
                return (
                  <li
                    key={item.key}
                    className={cn(
                      "grid shrink-0 grid-cols-[minmax(4.5rem,6.5rem)_minmax(0,1fr)_auto] items-center gap-2 text-[12px] xl:grid-cols-[minmax(3.75rem,5.25rem)_minmax(0,1fr)_auto] xl:gap-1.5 xl:text-[10px]",
                      isStateRow &&
                        hoveredState?.toLowerCase() ===
                          item.label.toLowerCase() &&
                        "rounded-md bg-hero-bg/70",
                    )}
                    onMouseEnter={() => {
                      if (isStateRow) {
                        setHoveredState(item.label);
                      }
                    }}
                    onMouseLeave={() => {
                      if (isStateRow) {
                        setHoveredState(null);
                      }
                    }}
                  >
                    <span className="truncate font-medium text-foreground">
                      {item.label}
                    </span>
                    <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F6] dark:bg-hero-bg xl:h-1.5">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${width}%`,
                          backgroundColor: BAR_COLOR,
                        }}
                      />
                    </div>
                    <span className="min-w-[1.5rem] text-right font-semibold tabular-nums text-foreground">
                      {item.count.toLocaleString("en-IN")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
