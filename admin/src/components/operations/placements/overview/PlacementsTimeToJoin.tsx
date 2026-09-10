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
import type { OperationsPlacementsTimeToJoinPoint } from "../../../../types/operations-placements";
import { cn } from "../../../../utils/cn";
import { OperationsCard } from "../../../ui/OperationsCard";

interface PlacementsTimeToJoinProps {
  avgDays: number | null;
  trendPercent: number | null;
  series: OperationsPlacementsTimeToJoinPoint[];
}

export function PlacementsTimeToJoin({
  avgDays,
  trendPercent,
  series,
}: PlacementsTimeToJoinProps) {
  const colors = useOperationsThemeColors();
  const chartSeries = (Array.isArray(series) ? series : []).map((point) => ({
    ...point,
    avgDays: point.avgDays ?? 0,
  }));
  const hasData = chartSeries.some((point) => point.avgDays > 0);
  const axisTick = { fontSize: 10, fill: "#5a6570" };
  const avgLabel =
    avgDays == null
      ? "—"
      : avgDays.toLocaleString("en-IN", { maximumFractionDigits: 1 });
  const isUp = trendPercent != null && trendPercent >= 0;
  const TrendIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <OperationsCard
      title="Time to Join"
      subtitle="Average days from offer to joining"
      className="placements-analytics-card min-w-0"
    >
      <div className="flex min-h-44 flex-col gap-3 xl:min-h-36 xl:gap-2.5">
        <div className="rounded-xl border border-primary/15 bg-primary-light/50 px-3 py-2.5 text-center max-sm:py-2">
          <p className="text-[11px] font-medium text-muted max-sm:text-[10px]">
            Average days to join
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-foreground max-sm:text-xl xl:text-xl">
            {avgLabel}
          </p>
          {trendPercent != null ? (
            <div className="mt-1 flex items-center justify-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-[10px] font-semibold",
                  isUp ? "text-success" : "text-danger",
                )}
              >
                <TrendIcon className="size-2.5" aria-hidden="true" />
                {Math.abs(trendPercent)}%
              </span>
              <span className="text-[10px] text-muted">vs prior period</span>
            </div>
          ) : null}
        </div>

        {!hasData ? (
          <p className="flex flex-1 items-center justify-center text-center text-xs text-muted">
            No time-to-join trend in this period.
          </p>
        ) : (
          <div className="h-28 min-w-0 max-sm:h-24 xl:h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartSeries}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke={colors.borderSubtle}
                  strokeDasharray="4 6"
                />
                <XAxis
                  dataKey="label"
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                  height={22}
                />
                <YAxis
                  allowDecimals
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  width={24}
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
                  stroke={colors.chartAccentAlt}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </OperationsCard>
  );
}
