import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useOperationsThemeColors } from "../../../../hooks/use-operations-theme-colors";
import type { OperationsCandidatesAnalyticsNamedCount } from "../../../../types/operations-candidates";
import { OperationsCard } from "../../../ui/OperationsCard";

export function CandidatesByExperience({ items }: { items: OperationsCandidatesAnalyticsNamedCount[] }) {
  const colors = useOperationsThemeColors();
  return (
    <OperationsCard
      title="By Experience"
      subtitle="Jobseekers by experience level"
      className="candidates-analytics-card min-w-0"
    >
      {items.length === 0 ? (
        <p className="flex min-h-44 items-center justify-center text-center text-xs text-muted xl:min-h-36">
          No experience data available.
        </p>
      ) : (
        <div className="h-52 min-w-0 sm:h-56 xl:h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={items.slice(0, 8)} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={colors.borderSubtle} strokeDasharray="4 6" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#5a6570" }} axisLine={false} tickLine={false} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#5a6570" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip formatter={(value) => [Number(value).toLocaleString("en-IN"), "Jobseekers"]} />
              <Bar dataKey="count" fill={colors.chartAccent} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </OperationsCard>
  );
}
