import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { OperationsEmployersAnalyticsNamedCount } from "../../../../types/operations-employers";
import { OperationsCard } from "../../../ui/OperationsCard";
import {
  EMPLOYERS_OVERVIEW_BAR_COLORS,
  EMPLOYERS_TYPE_COLORS,
} from "./employers-overview-theme";

interface EmployerTypeDonutProps {
  items: OperationsEmployersAnalyticsNamedCount[];
  total: number;
}

interface ChartDatum extends OperationsEmployersAnalyticsNamedCount {
  fill: string;
}

export function EmployerTypeDonut({ items, total }: EmployerTypeDonutProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const chartData: ChartDatum[] = items.map((item, index) => ({
    ...item,
    fill:
      EMPLOYERS_TYPE_COLORS[item.id] ??
      EMPLOYERS_OVERVIEW_BAR_COLORS[index % EMPLOYERS_OVERVIEW_BAR_COLORS.length],
  }));

  const activeItem =
    activeId == null
      ? null
      : (chartData.find((item) => item.id === activeId) ?? null);

  const centerValue = activeItem
    ? activeItem.count.toLocaleString("en-IN")
    : total.toLocaleString("en-IN");

  return (
    <OperationsCard
      title="Employer Type"
      subtitle="Company size / account mix"
      className="min-w-0"
    >
      {total === 0 || items.length === 0 ? (
        <p className="flex min-h-44 items-center justify-center text-center text-xs text-muted">
          No employer type data available.
        </p>
      ) : (
        <div className="flex min-h-44 min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative mx-auto size-[9rem] shrink-0 overflow-hidden sm:mx-0 sm:size-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius="62%"
                  outerRadius="100%"
                  paddingAngle={1.5}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  isAnimationActive={false}
                  onMouseLeave={() => setActiveId(null)}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={entry.fill}
                      stroke="none"
                      className="outline-none focus:outline-none"
                      style={{
                        outline: "none",
                        opacity:
                          activeId == null || activeId === entry.id ? 1 : 0.45,
                        cursor: "pointer",
                        transition: "opacity 120ms ease",
                      }}
                      onMouseEnter={() => setActiveId(entry.id)}
                      onFocus={() => setActiveId(entry.id)}
                      onBlur={() => setActiveId(null)}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center px-3 text-center">
              <span className="text-xl font-bold leading-none text-foreground">
                {centerValue}
              </span>
              <span className="mt-1 max-w-[5.5rem] truncate text-[10px] font-medium text-muted">
                {activeItem ? activeItem.label : "Employers"}
              </span>
              {activeItem?.percent != null ? (
                <span className="mt-0.5 text-[10px] font-semibold tabular-nums text-foreground">
                  {activeItem.percent}%
                </span>
              ) : null}
            </div>
          </div>

          <ul className="min-w-0 flex-1 space-y-1.5">
            {chartData.map((item) => {
              const percent =
                item.percent ??
                (total > 0 ? Math.round((item.count / total) * 100) : 0);
              const isActive = activeId === item.id;

              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 text-[11px]"
                  onMouseEnter={() => setActiveId(item.id)}
                  onMouseLeave={() => setActiveId(null)}
                >
                  <span className="flex min-w-0 items-center gap-2 text-muted">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: item.fill }}
                      aria-hidden="true"
                    />
                    <span
                      className={
                        isActive
                          ? "truncate font-semibold text-foreground"
                          : "truncate"
                      }
                    >
                      {item.label}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-foreground">
                    <span className="font-semibold">
                      {item.count.toLocaleString("en-IN")}
                    </span>
                    <span className="ml-1 text-muted">{percent}%</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </OperationsCard>
  );
}
