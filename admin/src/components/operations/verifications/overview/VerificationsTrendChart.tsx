import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useOperationsThemeColors } from "../../../../hooks/use-operations-theme-colors";
import type { OperationsVerificationsTrendPoint } from "../../../../types/operations-verifications";
import { OperationsCard } from "../../../ui/OperationsCard";

interface VerificationsTrendChartProps {
  data: OperationsVerificationsTrendPoint[];
  rangeLabel?: string;
}

export function VerificationsTrendChart({
  data,
  rangeLabel,
}: VerificationsTrendChartProps) {
  const colors = useOperationsThemeColors();
  const series = Array.isArray(data) ? data : [];
  const hasData = series.some(
    (point) =>
      point.submitted > 0 || point.verified > 0 || point.rejected > 0,
  );
  const axisTick = { fontSize: 10, fill: "#5a6570" };
  const pointCount = series.length;
  const maxBarSize = pointCount <= 14 ? 28 : pointCount <= 26 ? 20 : 14;
  const categoryGap = pointCount <= 14 ? "28%" : pointCount <= 26 ? "22%" : "18%";

  return (
    <OperationsCard
      title="Verifications Trend"
      subtitle={rangeLabel || "Submitted vs verified vs rejected"}
      className="employers-analytics-card min-w-0"
    >
      {!hasData ? (
        <p className="flex min-h-44 items-center justify-center text-center text-xs text-muted xl:min-h-36">
          No verification activity in this period.
        </p>
      ) : (
        <div className="h-52 min-w-0 max-sm:h-44 sm:h-56 xl:h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={series}
              margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
              barGap={2}
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
                  name === "submitted"
                    ? "Submitted"
                    : name === "verified"
                      ? "Verified"
                      : "Rejected",
                ]}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                formatter={(value) =>
                  value === "submitted"
                    ? "Submitted"
                    : value === "verified"
                      ? "Verified"
                      : "Rejected"
                }
              />
              <Bar
                dataKey="submitted"
                fill={colors.chartAccent}
                radius={[3, 3, 0, 0]}
                maxBarSize={maxBarSize}
              />
              <Bar
                dataKey="verified"
                fill={colors.success}
                radius={[3, 3, 0, 0]}
                maxBarSize={maxBarSize}
              />
              <Bar
                dataKey="rejected"
                fill={colors.danger}
                radius={[3, 3, 0, 0]}
                maxBarSize={maxBarSize}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </OperationsCard>
  );
}
