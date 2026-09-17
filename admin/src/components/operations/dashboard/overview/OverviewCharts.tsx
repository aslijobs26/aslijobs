import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";
import indiaStatesMap from "../../../../assets/india-states-map.json";
import type { OperationsDashboardOverview } from "../../../../types/operations-dashboard-overview";
import { cn } from "../../../../utils/cn";
import {
  resolveIndiaStateLabel,
  resolveMapFeatureStateName,
} from "../../employers/overview/india-state-normalize";

export function OverviewActivityTrend({
  points,
}: {
  points: OperationsDashboardOverview["activityTrend"];
}) {
  const hasData = points.some(
    (point) =>
      point.jobseekers + point.employers + point.jobs + point.placements > 0,
  );

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-foreground">
          Operational Activity Trend
        </h3>
      </div>
      {!hasData ? (
        <p className="py-10 text-center text-[12px] text-muted">
          No operational activity in this period.
        </p>
      ) : (
        <div className="h-64 w-full min-w-0 overflow-hidden scrollbar-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="jobseekers"
                name="Jobseekers"
                stroke="#0284C7"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="employers"
                name="Employers"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="jobs"
                name="Jobs"
                stroke="#EA580C"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="placements"
                name="Placements"
                stroke="#7C3AED"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
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
] as const;

function intensityColor(rank: number, total: number): string {
  if (total <= 1) return HIGHLIGHT_PALETTE[0];
  const ratio = rank / Math.max(total - 1, 1);
  const index = Math.min(
    HIGHLIGHT_PALETTE.length - 1,
    Math.round(ratio * (HIGHLIGHT_PALETTE.length - 1)),
  );
  return HIGHLIGHT_PALETTE[index];
}

type LocationRow = OperationsDashboardOverview["operationsByLocation"][number];

function isUnspecifiedState(state: string): boolean {
  return state === "Unspecified" || state === "Unknown";
}

export function OverviewByLocation({
  rows,
  datePreset,
}: {
  rows: OperationsDashboardOverview["operationsByLocation"];
  datePreset?: string;
}) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const trendCaption =
    datePreset === "all" ? "vs prior 12 months" : "vs previous period";

  const rankedStates = useMemo(() => {
    const merged = new Map<
      string,
      LocationRow & { mapKey: string | null }
    >();

    for (const row of rows) {
      if (row.totalActivity <= 0) continue;
      const isOthers = row.state === "Others";
      const unspecified = isUnspecifiedState(row.state);
      const resolved = unspecified || isOthers
        ? null
        : resolveIndiaStateLabel(row.state);
      const label = isOthers || unspecified
        ? row.state
        : (resolved ?? row.state);
      const key = label.toLowerCase();
      const existing = merged.get(key);
      if (existing) {
        const totalActivity = existing.totalActivity + row.totalActivity;
        merged.set(key, {
          ...existing,
          totalActivity,
          sharePercent:
            existing.sharePercent != null && row.sharePercent != null
              ? Math.round((existing.sharePercent + row.sharePercent) * 10) /
                10
              : existing.sharePercent ?? row.sharePercent,
        });
        continue;
      }
      merged.set(key, {
        ...row,
        state: label,
        mapKey: isOthers || unspecified ? null : (resolved ?? null),
      });
    }

    return [...merged.values()].sort((a, b) => {
      if (isUnspecifiedState(a.state)) return 1;
      if (isUnspecifiedState(b.state)) return -1;
      if (a.state === "Others") return 1;
      if (b.state === "Others") return -1;
      return b.totalActivity - a.totalActivity;
    });
  }, [rows]);

  const tableRows = useMemo(
    () => rankedStates.filter((row) => !isUnspecifiedState(row.state)),
    [rankedStates],
  );
  const unspecifiedCount = useMemo(
    () =>
      rankedStates
        .filter((row) => isUnspecifiedState(row.state))
        .reduce((sum, row) => sum + row.totalActivity, 0),
    [rankedStates],
  );
  const mappedCount = useMemo(
    () => tableRows.reduce((sum, row) => sum + row.totalActivity, 0),
    [tableRows],
  );
  const locationTotal = mappedCount + unspecifiedCount;

  const mapRanked = useMemo(
    () => tableRows.filter((row) => row.mapKey != null),
    [tableRows],
  );

  const activityByState = useMemo(() => {
    const map = new Map<string, LocationRow & { mapKey: string | null }>();
    for (const row of mapRanked) {
      if (row.mapKey) {
        map.set(row.mapKey.toLowerCase(), row);
      }
    }
    return map;
  }, [mapRanked]);

  const colorByState = useMemo(() => {
    const map = new Map<string, string>();
    mapRanked.forEach((row, index) => {
      if (!row.mapKey) return;
      map.set(
        row.mapKey.toLowerCase(),
        intensityColor(index, mapRanked.length),
      );
    });
    return map;
  }, [mapRanked]);

  const mapFeatures = useMemo(
    () =>
      indiaStatesMap.features.filter(
        (feature) =>
          feature.name && feature.name !== "Unknown" && feature.d,
      ),
    [],
  );

  const tooltip = useMemo(() => {
    if (!hoveredState) return null;
    const row = activityByState.get(hoveredState.toLowerCase());
    return {
      label: hoveredState,
      totalActivity: row?.totalActivity ?? 0,
      sharePercent: row?.sharePercent ?? null,
      trendPercent: row?.trendPercent ?? null,
      trendDirection: row?.trendDirection ?? "neutral",
    };
  }, [activityByState, hoveredState]);

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-[13px] font-semibold text-foreground">
          Operations by Location
        </h3>
        <p className="mt-0.5 text-[11px] text-muted">
          Jobseekers, employers, jobs and placements · Trend {trendCaption}
        </p>
      </div>
      {locationTotal === 0 ? (
        <p className="flex min-h-[11.5rem] items-center justify-center text-center text-[12px] text-muted xl:min-h-36">
          No location activity in this period.
        </p>
      ) : (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="grid min-h-[11.5rem] grid-cols-1 items-center gap-3 sm:grid-cols-2 xl:min-h-36 xl:gap-2">
            <div className="relative mx-auto w-full max-w-[11.5rem] max-sm:max-w-[9.5rem] sm:max-w-none xl:max-w-[10.5rem]">
              <svg
                viewBox={indiaStatesMap.viewBox}
                className="h-auto w-full max-h-[12.5rem] max-sm:max-h-[10rem] xl:max-h-[10rem]"
                role="img"
                aria-label="India map of operational activity by state"
              >
                {mapFeatures.map((feature) => {
                  const canonical = resolveMapFeatureStateName(feature.name);
                  const key = canonical.toLowerCase();
                  const fill = colorByState.get(key) ?? INACTIVE_FILL;
                  const isHovered = hoveredState?.toLowerCase() === key;
                  const activity =
                    activityByState.get(key)?.totalActivity ?? 0;

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
                      aria-label={`${canonical}: ${activity.toLocaleString("en-IN")} activity`}
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
                    {tooltip.totalActivity.toLocaleString("en-IN")} activity
                    {tooltip.sharePercent != null
                      ? ` · ${tooltip.sharePercent}%`
                      : ""}
                    {tooltip.trendDirection === "new"
                      ? " · New"
                      : tooltip.trendPercent != null
                        ? ` · ${tooltip.trendPercent > 0 ? "↑" : tooltip.trendPercent < 0 ? "↓" : ""}${Math.abs(tooltip.trendPercent)}%`
                        : ""}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="min-w-0 overflow-hidden">
              {tableRows.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-muted">
                  No mapped state activity in this period.
                </p>
              ) : (
                <div className="max-h-[12.5rem] overflow-y-auto overscroll-contain scrollbar-hidden xl:max-h-[10rem]">
                  <table className="w-full table-fixed text-left text-[12px] xl:text-[11px]">
                    <colgroup>
                      <col className="w-[46%]" />
                      <col className="w-[32%]" />
                      <col className="w-[22%]" />
                    </colgroup>
                    <thead className="sticky top-0 bg-hero-bg/95 text-muted backdrop-blur-sm">
                      <tr className="border-b border-border-subtle">
                        <th
                          scope="col"
                          className="px-2 py-2 font-semibold xl:px-1.5 xl:py-1.5"
                        >
                          State
                        </th>
                        <th
                          scope="col"
                          className="px-2 py-2 font-semibold xl:px-1.5 xl:py-1.5"
                        >
                          Activity
                        </th>
                        <th
                          scope="col"
                          className="px-2 py-2 font-semibold xl:px-1.5 xl:py-1.5"
                        >
                          Trend
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => {
                        const isHovered =
                          row.mapKey != null &&
                          hoveredState?.toLowerCase() ===
                            row.mapKey.toLowerCase();
                        const swatch = row.mapKey
                          ? (colorByState.get(row.mapKey.toLowerCase()) ??
                            INACTIVE_FILL)
                          : INACTIVE_FILL;
                        return (
                          <tr
                            key={row.state}
                            className={cn(
                              "border-b border-border-subtle/70 last:border-0",
                              isHovered && "bg-hero-bg/70",
                            )}
                            onMouseEnter={() => {
                              if (row.mapKey) setHoveredState(row.mapKey);
                            }}
                            onMouseLeave={() => setHoveredState(null)}
                          >
                            <td className="truncate px-2 py-2 xl:px-1.5 xl:py-1.5">
                              <span className="inline-flex max-w-full items-center gap-2 font-medium text-foreground xl:gap-1.5">
                                <span
                                  className="size-2.5 shrink-0 rounded-[3px]"
                                  style={{ backgroundColor: swatch }}
                                  aria-hidden
                                />
                                <span className="truncate">{row.state}</span>
                              </span>
                            </td>
                            <td className="truncate px-2 py-2 tabular-nums xl:px-1.5 xl:py-1.5">
                              <span className="font-semibold text-foreground">
                                {row.totalActivity.toLocaleString("en-IN")}
                              </span>
                              {row.sharePercent != null ? (
                                <span className="ml-1 text-[10px] font-medium text-muted">
                                  {row.sharePercent}%
                                </span>
                              ) : null}
                            </td>
                            <td className="truncate px-2 py-2 xl:px-1.5 xl:py-1.5">
                              {row.trendDirection === "new" ? (
                                <span className="font-semibold text-sky-700">
                                  New
                                </span>
                              ) : row.trendPercent == null ? (
                                <span className="text-muted">—</span>
                              ) : (
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-0.5 font-semibold",
                                    row.trendDirection === "down"
                                      ? "text-rose-700"
                                      : row.trendDirection === "up"
                                        ? "text-emerald-700"
                                        : "text-muted",
                                  )}
                                >
                                  {row.trendPercent > 0
                                    ? "↑"
                                    : row.trendPercent < 0
                                      ? "↓"
                                      : ""}
                                  {Math.abs(row.trendPercent)}%
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          {unspecifiedCount > 0 ? (
            <p className="border-t border-border-subtle pt-2 text-[10px] leading-snug text-muted">
              {unspecifiedCount.toLocaleString("en-IN")} unspecified
              {locationTotal > 0
                ? ` · ${mappedCount.toLocaleString("en-IN")} of ${locationTotal.toLocaleString("en-IN")} have a mapped state`
                : null}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
