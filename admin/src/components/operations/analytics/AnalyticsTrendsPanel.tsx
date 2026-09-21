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
import { useOperationsThemeColors } from "../../../hooks/use-operations-theme-colors";
import type { OperationsAnalyticsTrendPoint } from "../../../types/operations-analytics";
import { OperationsCard } from "../../ui/OperationsCard";

interface AnalyticsTrendsPanelProps {
  trends: OperationsAnalyticsTrendPoint[];
  rangeLabel: string;
}

export function AnalyticsTrendsPanel({
  trends,
  rangeLabel,
}: AnalyticsTrendsPanelProps) {
  const colors = useOperationsThemeColors();
  const series = Array.isArray(trends) ? trends : [];
  const hasData = series.some(
    (point) =>
      point.placements > 0 ||
      point.joined > 0 ||
      point.registrations > 0 ||
      point.jobsCreated > 0,
  );

  return (
    <OperationsCard
      title="Platform Trends"
      subtitle={`${rangeLabel} · placements, joins, registrations, and jobs created`}
      className="min-w-0"
      bodyClassName="p-3 sm:p-3.5"
    >
      {!hasData ? (
        <p className="flex min-h-56 items-center justify-center text-center text-sm text-muted">
          No trend activity recorded for this period.
        </p>
      ) : (
        <div className="h-72 min-w-0 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={series}
              margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#5a6570" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "#5a6570" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  borderColor: "#E5E7EB",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="placements"
                name="Placements"
                stroke={colors.primary}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="joined"
                name="Joined"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="registrations"
                name="Registrations"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="jobsCreated"
                name="Jobs created"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </OperationsCard>
  );
}
