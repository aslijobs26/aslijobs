import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { OperationsCard } from "../../ui/OperationsCard";
import { useOperationsThemeColors } from "../../../hooks/use-operations-theme-colors";
import type { EscalationBreakdownItem } from "../../../types/operations-dashboard";

interface EscalationsOverviewSectionProps {
  items: EscalationBreakdownItem[];
}

export function EscalationsOverviewSection({ items }: EscalationsOverviewSectionProps) {
  const colors = useOperationsThemeColors();
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <OperationsCard
      title="Escalations Overview"
      subtitle={`${total} active escalations`}
      className="min-w-0"
    >
      <div className="flex items-center gap-2.5">
        <div className="relative size-20 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={items}
                dataKey="count"
                nameKey="label"
                innerRadius="58%"
                outerRadius="100%"
                stroke="none"
              >
                {items.map((item) => (
                  <Cell key={item.id} fill={colors[item.colorToken]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold leading-none text-foreground">{total}</span>
            <span className="text-[9px] text-muted">Total</span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-muted">
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colors[item.colorToken] }}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0 font-medium text-foreground">{item.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </OperationsCard>
  );
}
