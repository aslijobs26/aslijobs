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
import type { OperationsEmployersAnalyticsSeriesPoint } from "../../../../types/operations-employers";
import { OperationsCard } from "../../../ui/OperationsCard";

interface EmployersRegistrationTrendChartProps {
  data: OperationsEmployersAnalyticsSeriesPoint[];
  /** When Overall, subtitle notes the 12-month trend window. */
  isOverall?: boolean;
}

export function EmployersRegistrationTrendChart({
  data,
  isOverall = false,
}: EmployersRegistrationTrendChartProps) {
  const colors = useOperationsThemeColors();
  const series = Array.isArray(data) ? data : [];
  const hasData = series.some(
    (point) => point.newRegistrations > 0 || point.verifiedEmployers > 0,
  );
  const axisTick = { fontSize: 10, fill: "#5a6570" };
  const pointCount = series.length;
  const maxBarSize = pointCount <= 14 ? 36 : pointCount <= 26 ? 26 : 16;
  const categoryGap = pointCount <= 14 ? "28%" : pointCount <= 26 ? "22%" : "18%";

  return (
    <OperationsCard
      title="Registration Trend"
      subtitle={
        isOverall
          ? "Last 12 months · new registrations vs verified"
          : "New registrations vs verified employers"
      }
      className="employers-analytics-card min-w-0"
    >
      {!hasData ? (
        <p className="flex min-h-44 items-center justify-center text-center text-xs text-muted xl:min-h-36">
          No registration activity in this period.
        </p>
      ) : (
        <div className="h-52 min-w-0 max-sm:h-44 sm:h-56 xl:h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={series}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barGap={3}
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
                  name === "newRegistrations"
                    ? "New registrations"
                    : "Verified employers",
                ]}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
                formatter={(value) =>
                  value === "newRegistrations"
                    ? "New registrations"
                    : "Verified employers"
                }
              />
              <Bar
                dataKey="newRegistrations"
                fill={colors.chartAccent}
                radius={[4, 4, 0, 0]}
                maxBarSize={maxBarSize}
              />
              <Bar
                dataKey="verifiedEmployers"
                fill={colors.success}
                radius={[4, 4, 0, 0]}
                maxBarSize={maxBarSize}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </OperationsCard>
  );
}
