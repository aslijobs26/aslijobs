import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { OperationsCandidatesAnalyticsNamedCount } from "../../../../types/operations-candidates";
import { OperationsCard } from "../../../ui/OperationsCard";

const COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#8B5CF6", "#0EA5E9", "#EF4444"];

export function CandidatesByLanguage({ items, total }: { items: OperationsCandidatesAnalyticsNamedCount[]; total: number }) {
  const chartData = items.slice(0, 6);
  return (
    <OperationsCard
      title="By Language"
      subtitle="Languages reported by jobseekers"
      className="candidates-analytics-card min-w-0"
    >
      {chartData.length === 0 || total === 0 ? (
        <p className="flex min-h-44 items-center justify-center text-center text-xs text-muted xl:min-h-36">
          No language data available.
        </p>
      ) : (
        <div className="flex min-h-44 min-w-0 flex-col gap-4 sm:flex-row sm:items-center xl:min-h-36 xl:gap-3">
          <div className="relative mx-auto size-36 shrink-0 xl:size-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="count" nameKey="label" innerRadius="62%" outerRadius="100%" paddingAngle={1.5} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                  {chartData.map((item, index) => <Cell key={item.id} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold leading-none text-foreground xl:text-lg">
                {total.toLocaleString("en-IN")}
              </span>
              <span className="mt-1 text-[10px] font-medium text-muted xl:text-[9px]">Languages</span>
            </div>
          </div>
          <ul className="min-w-0 flex-1 space-y-1.5 xl:space-y-1">
            {chartData.map((item, index) => (
              <li key={item.id} className="flex items-center justify-between gap-2 text-[11px] xl:text-[10px]">
                <span className="flex min-w-0 items-center gap-2 text-muted">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-foreground">
                  {item.count.toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </OperationsCard>
  );
}
