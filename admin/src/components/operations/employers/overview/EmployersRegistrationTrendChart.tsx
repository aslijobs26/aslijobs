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
}

export function EmployersRegistrationTrendChart({
  data,
}: EmployersRegistrationTrendChartProps) {
  const colors = useOperationsThemeColors();
  const hasData = data.some(
    (point) => point.newRegistrations > 0 || point.verifiedEmployers > 0,
  );
  const axisTick = { fontSize: 10, fill: "#5a6570" };

  return (
    <OperationsCard
      title="Registration Trend"
      subtitle="New registrations vs verified employers"
      className="min-w-0"
    >
      {!hasData ? (
        <p className="flex min-h-44 items-center justify-center text-center text-xs text-muted">
          No registration activity in this period.
        </p>
      ) : (
        <div className="h-52 min-w-0 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barGap={2}
              barCategoryGap="18%"
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
              />
              <YAxis
                allowDecimals={false}
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
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
                maxBarSize={18}
              />
              <Bar
                dataKey="verifiedEmployers"
                fill={colors.success}
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </OperationsCard>
  );
}
