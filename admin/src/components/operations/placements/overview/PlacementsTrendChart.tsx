import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useOperationsThemeColors } from "../../../../hooks/use-operations-theme-colors";
import type { OperationsPlacementsTrendPoint } from "../../../../types/operations-placements";
import { OperationsCard } from "../../../ui/OperationsCard";

interface PlacementsTrendChartProps {
  data: OperationsPlacementsTrendPoint[];
  rangeLabel?: string;
  /** Overall uses fewer monthly buckets — widen bars to match Jobs Overview. */
  isOverall?: boolean;
}

export function PlacementsTrendChart({
  data,
  rangeLabel,
  isOverall = false,
}: PlacementsTrendChartProps) {
  const colors = useOperationsThemeColors();
  const series = Array.isArray(data) ? data : [];
  const hasData = series.some(
    (point) => point.placements > 0 || point.joined > 0,
  );
  const axisTick = { fontSize: 10, fill: "#5a6570" };
  const pointCount = series.length;
  const maxBarSize = isOverall
    ? pointCount <= 8
      ? 56
      : pointCount <= 14
        ? 48
        : pointCount <= 26
          ? 34
          : 22
    : pointCount <= 14
      ? 36
      : pointCount <= 26
        ? 26
        : 16;
  const categoryGap = isOverall
    ? pointCount <= 8
      ? "8%"
      : pointCount <= 14
        ? "6%"
        : pointCount <= 26
          ? "5%"
          : "4%"
    : pointCount <= 14
      ? "28%"
      : pointCount <= 26
        ? "22%"
        : "18%";
  const barGap = isOverall ? 2 : 3;

  return (
    <OperationsCard
      title="Placements Trend"
      subtitle={
        isOverall
          ? "Last 6 months · placements vs joined"
          : rangeLabel || "Placements vs joined"
      }
      className="placements-analytics-card min-w-0"
    >
      {!hasData ? (
        <p className="flex min-h-44 items-center justify-center text-center text-xs text-muted xl:min-h-36">
          No placement activity in this period.
        </p>
      ) : (
        <div className="h-52 min-w-0 max-sm:h-44 sm:h-56 xl:h-44">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={series}
              margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
              barGap={barGap}
              barCategoryGap={categoryGap}
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
                minTickGap={20}
                height={28}
              />
              <YAxis
                allowDecimals={false}
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                labelFormatter={(label) => String(label)}
                formatter={(value, name) => [
                  Number(value).toLocaleString("en-IN"),
                  name === "placements" ? "Placements" : "Joined",
                ]}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                formatter={(value) =>
                  value === "placements" ? "Placements" : "Joined"
                }
              />
              <Bar
                dataKey="placements"
                fill={colors.chartAccent}
                radius={[4, 4, 0, 0]}
                maxBarSize={maxBarSize}
              />
              <Line
                type="monotone"
                dataKey="joined"
                stroke={colors.success}
                strokeWidth={2}
                dot={{ r: 2.5, fill: colors.success }}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </OperationsCard>
  );
}
