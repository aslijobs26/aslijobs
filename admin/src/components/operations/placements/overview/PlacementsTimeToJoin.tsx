import { TrendingDown, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useOperationsThemeColors } from "../../../../hooks/use-operations-theme-colors";
import type {
  OperationsPlacementsTimeToJoinPoint,
  PlacementsAnalyticsPreset,
} from "../../../../types/operations-placements";
import { cn } from "../../../../utils/cn";
import { OperationsCard } from "../../../ui/OperationsCard";
import { OperationsFilterSelect } from "../../jobs/OperationsFilterSelect";

const PERIOD_OPTIONS: {
  value: PlacementsAnalyticsPreset;
  label: string;
}[] = [
  { value: "all", label: "Overall" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "last_90_days", label: "Last 3 months" },
  { value: "this_year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

interface PlacementsTimeToJoinProps {
  avgDays: number | null;
  trendPercent: number | null;
  series: OperationsPlacementsTimeToJoinPoint[];
  preset: PlacementsAnalyticsPreset;
  onPresetChange: (preset: PlacementsAnalyticsPreset) => void;
}

export function PlacementsTimeToJoin({
  avgDays,
  trendPercent,
  series,
  preset,
  onPresetChange,
}: PlacementsTimeToJoinProps) {
  const colors = useOperationsThemeColors();
  const chartSeries = (Array.isArray(series) ? series : []).map((point) => ({
    ...point,
    avgDays: point.avgDays ?? null,
  }));
  const hasChartData = chartSeries.some((point) => point.avgDays != null);
  const maxSeriesDays = chartSeries.reduce(
    (max, point) => Math.max(max, point.avgDays ?? 0),
    0,
  );
  const yMax = Math.max(60, Math.ceil(maxSeriesDays / 20) * 20 || 60);
  const yTicks = [0, yMax / 3, (2 * yMax) / 3, yMax].map((value) =>
    Math.round(value),
  );
  const axisTick = { fontSize: 10, fill: "#5a6570" };

  const avgDisplay = Math.round(avgDays ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

  // Lower time-to-join is better: down = success, up = danger.
  const isImproved = trendPercent != null && trendPercent < 0;
  const isWorse = trendPercent != null && trendPercent > 0;
  const TrendIcon = isWorse ? TrendingUp : TrendingDown;

  return (
    <OperationsCard
      title="Placements Time to Join"
      className="placements-analytics-card min-w-0"
      action={
        <OperationsFilterSelect
          label="Time period"
          value={preset === "custom" ? "custom" : preset}
          options={PERIOD_OPTIONS}
          onChange={(value) =>
            onPresetChange(value as PlacementsAnalyticsPreset)
          }
          hideSearch
          className="w-[8.75rem] min-w-0 xl:w-[8.25rem]"
        />
      }
    >
      <div className="flex min-h-44 flex-col gap-3 xl:min-h-36 xl:gap-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-end gap-x-2.5 gap-y-1">
            <p className="text-[1.75rem] font-bold leading-none tabular-nums tracking-tight text-foreground max-sm:text-[1.5rem] xl:text-[1.625rem]">
              {avgDisplay}
              <span className="ml-1.5 text-[13px] font-medium text-muted xl:text-[12px]">
                Days
              </span>
            </p>
            {trendPercent != null ? (
              <span
                className={cn(
                  "mb-0.5 inline-flex items-center gap-0.5 text-[12px] font-semibold tabular-nums xl:text-[11px]",
                  isImproved && "text-success",
                  isWorse && "text-danger",
                  !isImproved && !isWorse && "text-muted",
                )}
              >
                <TrendIcon className="size-3.5" aria-hidden="true" />
                {Math.abs(Math.round(trendPercent))}%
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-muted xl:text-[11px]">
            Average time from offer to joining
          </p>
        </div>

        {!hasChartData ? (
          <p className="flex flex-1 items-center justify-center text-center text-xs text-muted">
            No time-to-join trend in this period.
          </p>
        ) : (
          <div className="h-32 min-w-0 max-sm:h-28 xl:h-[7.25rem]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartSeries}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  stroke={colors.borderSubtle}
                  strokeDasharray="3 6"
                />
                <XAxis
                  dataKey="label"
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={16}
                  height={22}
                />
                <YAxis
                  domain={[0, yMax]}
                  ticks={yTicks}
                  allowDecimals={false}
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toLocaleString("en-IN", {
                      maximumFractionDigits: 1,
                    })} days`,
                    "Avg days",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="avgDays"
                  stroke={colors.chartAccent}
                  strokeWidth={2.5}
                  connectNulls={false}
                  dot={{
                    r: 4,
                    fill: colors.chartAccent,
                    strokeWidth: 0,
                  }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </OperationsCard>
  );
}
