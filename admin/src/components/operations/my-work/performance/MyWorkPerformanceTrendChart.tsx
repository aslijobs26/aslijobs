import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useOperationsThemeColors } from "../../../../hooks/use-operations-theme-colors";
import type { OperationsWorkPerformanceResult } from "../../../../types/operations-work";
import { OperationsCard } from "../../../ui/OperationsCard";
import { OperationsFilterSelect } from "../../jobs/OperationsFilterSelect";
import { formatTrendAxisLabel } from "./performance-format";

interface MyWorkPerformanceTrendChartProps {
  trend: OperationsWorkPerformanceResult["completionTrend"];
  generatedAt: string;
}

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "all", label: "All available" },
] as const;

export function MyWorkPerformanceTrendChart({
  trend,
  generatedAt,
}: MyWorkPerformanceTrendChartProps) {
  const colors = useOperationsThemeColors();
  const [range, setRange] = useState<"7" | "all">("7");

  const chartData = useMemo(() => {
    const source = range === "7" ? trend.slice(-7) : trend;
    return source.map((point) => ({
      ...point,
      axisLabel: formatTrendAxisLabel(point.date, point.label),
    }));
  }, [range, trend]);

  const maxValue = Math.max(2, ...chartData.map((point) => point.completed));

  return (
    <OperationsCard
      title="Completion trend (7 days)"
      subtitle="Daily count of completed work items"
      action={
        <OperationsFilterSelect
          label="Trend range"
          value={range}
          options={RANGE_OPTIONS}
          hideSearch
          className="w-[9.5rem]"
          triggerClassName="!h-8 !min-w-0"
          onChange={(value) => setRange(value === "all" ? "all" : "7")}
        />
      }
      bodyClassName="px-3 py-2 sm:px-3.5 sm:py-2.5"
    >
      {chartData.length === 0 ? (
        <p className="flex min-h-36 items-center justify-center text-center text-xs text-muted">
          No completion trend data yet.
        </p>
      ) : (
        <>
          <div className="h-36 min-w-0 sm:h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 4, left: 0, bottom: 0 }}
                barCategoryGap="32%"
              >
                <CartesianGrid
                  vertical={false}
                  stroke={colors.borderSubtle}
                  strokeDasharray="4 6"
                />
                <XAxis
                  dataKey="axisLabel"
                  tick={{ fontSize: 9, fill: "#5a6570" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  height={28}
                  angle={chartData.length > 7 ? -20 : 0}
                  textAnchor={chartData.length > 7 ? "end" : "middle"}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, maxValue]}
                  tick={{ fontSize: 9, fill: "#5a6570" }}
                  axisLine={false}
                  tickLine={false}
                  width={22}
                />
                <Tooltip
                  formatter={(value) => [
                    Number(value).toLocaleString("en-IN"),
                    "Completed",
                  ]}
                  labelFormatter={(label) => String(label)}
                />
                <Bar
                  dataKey="completed"
                  fill={colors.primary}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                >
                  <LabelList
                    dataKey="completed"
                    position="top"
                    className="fill-foreground text-[9px] font-semibold"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[10px] text-muted">
            Generated {new Date(generatedAt).toLocaleString("en-IN")}
          </p>
        </>
      )}
    </OperationsCard>
  );
}
