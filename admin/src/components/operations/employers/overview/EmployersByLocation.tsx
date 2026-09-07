import { useMemo, useState } from "react";
import indiaStatesMap from "../../../../assets/india-states-map.json";
import type { OperationsEmployersAnalyticsNamedCount } from "../../../../types/operations-employers";
import { OperationsFilterSelect } from "../../jobs/OperationsFilterSelect";
import { cn } from "../../../../utils/cn";
import {
  resolveIndiaStateLabel,
  resolveMapFeatureStateName,
} from "./india-state-normalize";

type LocationLimit = "5" | "10" | "all";

interface EmployersByLocationProps {
  items: OperationsEmployersAnalyticsNamedCount[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

const INACTIVE_FILL = "#E8EEF5";
const INACTIVE_STROKE = "#D5DEE9";
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

const LIMIT_OPTIONS = [
  { value: "5", label: "Top 5 States" },
  { value: "10", label: "Top 10 States" },
  { value: "all", label: "All States" },
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

export function EmployersByLocation({
  items,
  isLoading = false,
  isError = false,
  onRetry,
}: EmployersByLocationProps) {
  const [limit, setLimit] = useState<LocationLimit>("5");
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const rankedStates = useMemo(() => {
    return items
      .filter((item) => item.label !== "Unspecified" && item.count > 0)
      .map((item) => {
        const resolved = resolveIndiaStateLabel(item.label);
        return {
          ...item,
          label: resolved ?? item.label,
        };
      });
  }, [items]);

  const visibleStates = useMemo(() => {
    if (limit === "all") {
      return rankedStates;
    }
    const n = limit === "5" ? 5 : 10;
    return rankedStates.slice(0, n);
  }, [limit, rankedStates]);

  const countByState = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of rankedStates) {
      map.set(item.label.toLowerCase(), item.count);
    }
    return map;
  }, [rankedStates]);

  const colorByState = useMemo(() => {
    const map = new Map<string, string>();
    visibleStates.forEach((item, index) => {
      map.set(
        item.label.toLowerCase(),
        intensityColor(index, visibleStates.length),
      );
    });
    return map;
  }, [visibleStates]);

  const mapFeatures = useMemo(
    () =>
      indiaStatesMap.features.filter(
        (feature) =>
          feature.name &&
          feature.name !== "Unknown" &&
          feature.d,
      ),
    [],
  );

  const tooltip = useMemo(() => {
    if (!hoveredState) {
      return null;
    }
    const count = countByState.get(hoveredState.toLowerCase()) ?? 0;
    return {
      label: hoveredState,
      count,
    };
  }, [countByState, hoveredState]);

  return (
    <section className="employers-analytics-card operations-density-card flex h-full min-w-0 flex-col rounded-xl border border-border-subtle bg-surface shadow-sm">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-3 py-2 sm:px-3.5 sm:py-2.5">
        <h3 className="text-[13px] font-semibold tracking-tight text-foreground">
          Employers by Location
        </h3>
        <OperationsFilterSelect
          label="Location ranking"
          value={limit}
          options={[...LIMIT_OPTIONS]}
          onChange={(value) => setLimit((value as LocationLimit) || "5")}
          hideSearch
          className="w-auto min-w-[8.5rem]"
          triggerClassName="h-7 min-w-[8.25rem] px-2 text-[11px] font-medium text-muted xl:h-6 xl:text-[10px]"
        />
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
        ) : rankedStates.length === 0 ? (
          <p className="flex min-h-[11.5rem] items-center justify-center text-center text-xs text-muted xl:min-h-36">
            No location data available
          </p>
        ) : (
          <div className="grid min-h-[11.5rem] grid-cols-1 items-center gap-3 sm:grid-cols-2 xl:min-h-36 xl:gap-2">
            <div className="relative mx-auto w-full max-w-[11.5rem] sm:max-w-none">
              <svg
                viewBox={indiaStatesMap.viewBox}
                className="h-auto w-full max-h-[12.5rem] xl:max-h-[10rem]"
                role="img"
                aria-label="India map of employer concentration by state"
              >
                {mapFeatures.map((feature) => {
                  const canonical = resolveMapFeatureStateName(feature.name);
                  const key = canonical.toLowerCase();
                  const fill =
                    colorByState.get(key) ?? INACTIVE_FILL;
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
                      aria-label={`${canonical}: ${countByState.get(key) ?? 0} employers`}
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
                    {tooltip.count.toLocaleString("en-IN")} Employers
                  </p>
                </div>
              ) : null}
            </div>

            <ul
              className={cn(
                "min-w-0 divide-y divide-border-subtle",
                limit === "all" &&
                  "max-h-[12.5rem] overflow-y-auto overscroll-contain scrollbar-hidden xl:max-h-[10rem]",
              )}
            >
              {visibleStates.map((item) => {
                const swatch =
                  colorByState.get(item.label.toLowerCase()) ?? INACTIVE_FILL;
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "flex items-center gap-2 py-1.5 text-[12px] xl:py-1 xl:text-[11px]",
                      hoveredState?.toLowerCase() === item.label.toLowerCase() &&
                        "bg-hero-bg/70",
                    )}
                    onMouseEnter={() => setHoveredState(item.label)}
                    onMouseLeave={() => setHoveredState(null)}
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
          </div>
        )}
      </div>
    </section>
  );
}
