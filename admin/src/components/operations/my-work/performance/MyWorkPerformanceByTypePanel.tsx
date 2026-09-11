import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import { useOperationsThemeColors } from "../../../../hooks/use-operations-theme-colors";
import type { OperationsWorkPerformanceResult } from "../../../../types/operations-work";
import { OperationsFilterSelect } from "../../jobs/OperationsFilterSelect";
import { cn } from "../../../../utils/cn";

interface MyWorkPerformanceByTypeProps {
  byType: OperationsWorkPerformanceResult["byType"];
  completedTotal: number;
}

const TYPE_FILTER_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "assigned", label: "Assigned" },
] as const;

const FALLBACK_COLORS = [
  "#0e8585",
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#ea580c",
  "#16a34a",
  "#0891b2",
];

export function MyWorkPerformanceByTypePanel({
  byType,
  completedTotal,
}: MyWorkPerformanceByTypeProps) {
  const colors = useOperationsThemeColors();
  const [metric, setMetric] = useState<"completed" | "assigned">("completed");

  const chartItems = useMemo(() => {
    return byType
      .map((row, index) => ({
        key: row.type,
        label: row.typeLabel,
        count: metric === "completed" ? row.completed : row.assigned,
        fill:
          index === 0
            ? colors.primary
            : (FALLBACK_COLORS[index % FALLBACK_COLORS.length] ?? colors.primary),
      }))
      .filter((row) => row.count > 0);
  }, [byType, colors.primary, metric]);

  const total = chartItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(15rem,0.75fr)]">
      <section className="flex min-w-0 flex-col rounded-xl border border-border-subtle bg-surface shadow-sm">
        <header className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold tracking-tight text-foreground">
              Work by type
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">
              Distribution of your completed work by type
            </p>
          </div>
          <OperationsFilterSelect
            label="Work metric"
            value={metric}
            options={TYPE_FILTER_OPTIONS}
            hideSearch
            className="w-[8.25rem]"
            triggerClassName="!h-8 !min-w-0 !rounded-lg !border-border-subtle !bg-surface !text-[11px] !font-semibold"
            onChange={(value) =>
              setMetric(value === "assigned" ? "assigned" : "completed")
            }
          />
        </header>

        <div className="flex min-h-0 flex-1 items-center px-4 pb-4 sm:px-5 sm:pb-5">
          {total === 0 ? (
            <p className="flex min-h-[10rem] w-full items-center justify-center text-center text-xs text-muted">
              No {metric} work by type yet.
            </p>
          ) : (
            <div className="flex w-full min-w-0 flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
              <div className="relative size-[9.5rem] shrink-0 sm:size-[10.25rem]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartItems}
                      dataKey="count"
                      nameKey="label"
                      innerRadius="62%"
                      outerRadius="100%"
                      paddingAngle={0}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {chartItems.map((entry) => (
                        <Cell key={entry.key} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        Number(value).toLocaleString("en-IN"),
                        String(name),
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[1.75rem] font-bold leading-none text-foreground">
                    {total.toLocaleString("en-IN")}
                  </span>
                  <span className="mt-1 text-[11px] font-medium text-muted">
                    Total
                  </span>
                </div>
              </div>

              <ul className="w-full min-w-0 flex-1 space-y-2.5">
                {chartItems.map((item) => {
                  const percent =
                    total > 0 ? Math.round((item.count / total) * 100) : 0;
                  return (
                    <li
                      key={item.key}
                      className="flex items-center justify-between gap-3 text-[13px]"
                    >
                      <span className="flex min-w-0 items-center gap-2.5 text-foreground">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.fill }}
                          aria-hidden
                        />
                        <span className="truncate font-medium">{item.label}</span>
                      </span>
                      <span className="shrink-0 tabular-nums font-semibold text-foreground">
                        {item.count.toLocaleString("en-IN")} ({percent}%)
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>

      <AchievementCard completedTotal={completedTotal} />
    </div>
  );
}

function AchievementCard({ completedTotal }: { completedTotal: number }) {
  const hasCompletions = completedTotal > 0;

  return (
    <section
      className={cn(
        "flex min-h-full flex-col items-center justify-center rounded-xl border px-5 py-6 text-center shadow-sm",
        hasCompletions
          ? "border-emerald-200/70 bg-gradient-to-b from-emerald-50 via-teal-50/80 to-emerald-50/40"
          : "border-border-subtle bg-hero-bg/60",
      )}
    >
      <span
        className={cn(
          "inline-flex size-12 items-center justify-center rounded-full",
          hasCompletions
            ? "bg-emerald-100 text-emerald-700"
            : "bg-border-subtle text-muted",
        )}
      >
        <Trophy className="size-6" strokeWidth={1.75} aria-hidden />
      </span>

      <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">
        {hasCompletions ? "Great work!" : "Keep going"}
      </h2>

      <p className="mt-2 max-w-[16rem] text-[13px] leading-relaxed text-foreground/75">
        {hasCompletions
          ? `You have completed ${completedTotal.toLocaleString("en-IN")} work item${completedTotal === 1 ? "" : "s"}. Keep up the excellent work.`
          : "Complete your first assigned work item to unlock performance insights here."}
      </p>

      <Link
        to={OPERATIONS_ROUTES.MY_WORK}
        className="mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#0b1f2a] px-5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#132a38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        View My Work
        <span aria-hidden>→</span>
      </Link>
    </section>
  );
}
