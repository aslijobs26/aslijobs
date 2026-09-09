import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { OperationsVerificationsStatusCount } from "../../../../types/operations-verifications";
import { OperationsCard } from "../../../ui/OperationsCard";

interface VerificationsStatusDonutProps {
  items: OperationsVerificationsStatusCount[];
}

const STATUS_COLORS: Record<string, string> = {
  verified: "#16A34A",
  pending: "#F59E0B",
  under_review: "#2563EB",
  rejected: "#DC2626",
};

const FALLBACK_COLORS = ["#F59E0B", "#2563EB", "#16A34A", "#DC2626", "#7C3AED"];

interface ChartDatum extends OperationsVerificationsStatusCount {
  fill: string;
  displayPercent: number;
}

function resolveDisplayPercent(
  item: OperationsVerificationsStatusCount,
  total: number,
): number {
  if (typeof item.percent === "number" && Number.isFinite(item.percent)) {
    return Math.round(item.percent);
  }
  if (total <= 0) {
    return 0;
  }
  return Math.round((item.count / total) * 100);
}

export function VerificationsStatusDonut({
  items,
}: VerificationsStatusDonutProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const chartData: ChartDatum[] = useMemo(() => {
    const source = (Array.isArray(items) ? items : []).filter(
      (item) => item.count > 0,
    );
    const total = source.reduce((sum, item) => sum + item.count, 0);
    return source.map((item, index) => ({
      ...item,
      fill:
        STATUS_COLORS[item.key] ??
        FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      displayPercent: resolveDisplayPercent(item, total),
    }));
  }, [items]);

  const total = chartData.reduce((sum, item) => sum + item.count, 0);
  const activeItem =
    activeKey == null
      ? null
      : (chartData.find((item) => item.key === activeKey) ?? null);

  const centerValue = activeItem
    ? activeItem.count.toLocaleString("en-IN")
    : total.toLocaleString("en-IN");

  return (
    <OperationsCard
      title="Verifications by Status"
      subtitle="Current status mix"
      className="employers-analytics-card min-w-0"
    >
      {total === 0 || chartData.length === 0 ? (
        <p className="flex min-h-44 items-center justify-center text-center text-xs text-muted xl:min-h-36">
          No status data available.
        </p>
      ) : (
        <div className="flex min-h-44 min-w-0 flex-col gap-4 max-sm:min-h-36 max-sm:gap-3 sm:flex-row sm:items-center xl:min-h-36 xl:gap-3">
          <div className="relative mx-auto size-[9rem] shrink-0 overflow-hidden max-sm:size-32 sm:mx-0 sm:size-36 xl:size-28">
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
                  onMouseLeave={() => setActiveKey(null)}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={entry.fill}
                      stroke="none"
                      className="outline-none focus:outline-none"
                      style={{
                        outline: "none",
                        opacity:
                          activeKey == null || activeKey === entry.key
                            ? 1
                            : 0.45,
                        cursor: "pointer",
                        transition: "opacity 120ms ease",
                      }}
                      onMouseEnter={() => setActiveKey(entry.key)}
                      onFocus={() => setActiveKey(entry.key)}
                      onBlur={() => setActiveKey(null)}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center px-3 text-center">
              <span className="text-xl font-bold leading-none text-foreground xl:text-lg">
                {centerValue}
              </span>
              <span className="mt-1 max-w-[5.5rem] truncate text-[10px] font-medium text-muted xl:text-[9px]">
                {activeItem ? activeItem.label : "Total"}
              </span>
              {activeItem ? (
                <span className="mt-0.5 text-[10px] font-semibold tabular-nums text-foreground xl:text-[9px]">
                  {activeItem.displayPercent}%
                </span>
              ) : null}
            </div>
          </div>

          <ul className="min-w-0 flex-1 space-y-1.5 xl:space-y-1">
            {chartData.map((item) => {
              const isActive = activeKey === item.key;

              return (
                <li
                  key={item.key}
                  className="flex items-center justify-between gap-2 text-[11px] xl:text-[10px]"
                  onMouseEnter={() => setActiveKey(item.key)}
                  onMouseLeave={() => setActiveKey(null)}
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
                    <span className="ml-1.5 text-muted">
                      ({item.displayPercent}%)
                    </span>
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
