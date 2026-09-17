import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import type {
  DashboardTaskTab,
  OperationsDashboardOverview,
} from "../../../../types/operations-dashboard-overview";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import { cn } from "../../../../utils/cn";
import { OperationsBadge } from "../../../ui/OperationsBadge";

const STATUS_COLORS = {
  completed: "#22C55E",
  inProgress: "#3B82F6",
  pending: "#EAB308",
  overdue: "#EF4444",
} as const;

const TABLE_PAGE_SIZE = 10;

const STATUS_BUCKET_LABELS: Record<
  OperationsDashboardOverview["recentTasks"]["items"][number]["statusBucket"],
  string
> = {
  completed: "Completed",
  in_progress: "In Progress",
  pending: "Pending",
  overdue: "Overdue",
};

function statusBucketBadgeVariant(
  bucket: OperationsDashboardOverview["recentTasks"]["items"][number]["statusBucket"],
): "candidate" | "verification" | "medium" | "high" {
  switch (bucket) {
    case "completed":
      return "candidate";
    case "in_progress":
      return "verification";
    case "pending":
      return "medium";
    case "overdue":
      return "high";
  }
}

function formatShare(count: number, percent: number | null): string {
  if (percent == null) return `${count.toLocaleString("en-IN")} (0%)`;
  return `${count.toLocaleString("en-IN")} (${Math.round(percent)}%)`;
}

export function OverviewTaskStatus({
  status,
}: {
  status: OperationsDashboardOverview["taskStatus"];
}) {
  const legend = [
    {
      name: "Completed",
      value: status.completed,
      percent: status.completedPercent,
      key: "completed" as const,
    },
    {
      name: "In Progress",
      value: status.inProgress,
      percent: status.inProgressPercent,
      key: "inProgress" as const,
    },
    {
      name: "Pending",
      value: status.pending,
      percent: status.pendingPercent,
      key: "pending" as const,
    },
    {
      name: "Overdue",
      value: status.overdue,
      percent: status.overduePercent,
      key: "overdue" as const,
    },
  ];
  const chartData = legend.filter((row) => row.value > 0);

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
      <h3 className="mb-3 text-[13px] font-semibold text-foreground">
        Task Status
      </h3>
      {status.total === 0 ? (
        <p className="flex min-h-[11.5rem] items-center justify-center text-center text-[12px] text-muted">
          No operational tasks found.
        </p>
      ) : (
        <div className="grid min-h-[11.5rem] grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,9.5rem)_1fr]">
          <div className="relative mx-auto size-[9.5rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={38}
                  outerRadius={58}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[22px] font-bold leading-none tabular-nums text-foreground">
                {status.total.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[10px] font-medium text-muted">
                Total Tasks
              </p>
            </div>
          </div>
          <ul className="flex flex-col justify-center gap-2.5">
            {legend.map((row) => (
              <li
                key={row.key}
                className="flex items-center justify-between gap-3 text-[12px]"
              >
                <span className="inline-flex min-w-0 items-center gap-2 font-medium text-foreground">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[row.key] }}
                    aria-hidden
                  />
                  {row.name}
                </span>
                <span className="shrink-0 tabular-nums font-semibold text-foreground">
                  {formatShare(row.value, row.percent)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function OverviewTeamPerformance({
  rows,
}: {
  rows: OperationsDashboardOverview["teamPerformance"];
}) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-foreground">
          Team Performance
        </h3>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface px-2 py-1 text-[11px] font-medium text-muted"
          aria-label="Rank teams by task completion"
        >
          By Task Completion
          <ChevronDown className="size-3.5" aria-hidden />
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="flex min-h-[11.5rem] items-center justify-center text-center text-[12px] text-muted">
          No team activity available.
        </p>
      ) : (
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold text-muted">
            <span>Team</span>
            <span>Completion Rate</span>
          </div>
          <ul className="flex flex-col gap-3">
            {rows.map((row) => {
              const rate = row.completionRate ?? 0;
              const barColor =
                rate >= 75
                  ? "bg-emerald-500"
                  : rate >= 50
                    ? "bg-orange-400"
                    : "bg-rose-500";
              return (
                <li key={row.departmentId}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px]">
                    <span className="min-w-0 truncate font-medium text-foreground">
                      {row.teamName}
                    </span>
                    <span className="shrink-0 tabular-nums font-semibold text-foreground">
                      {Math.round(rate)}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6] dark:bg-hero-bg">
                    <div
                      className={cn("h-full rounded-full transition-[width]", barColor)}
                      style={{
                        width: `${Math.max(rate > 0 ? 4 : 0, Math.min(rate, 100))}%`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

export function OverviewRecentTasks({
  recentTasks,
  taskTab,
  taskSearch,
  onTabChange,
  onSearchChange,
}: {
  recentTasks: OperationsDashboardOverview["recentTasks"];
  taskTab: DashboardTaskTab;
  taskSearch: string;
  onTabChange: (tab: DashboardTaskTab) => void;
  onSearchChange: (value: string) => void;
}) {
  const tabs: Array<{ id: DashboardTaskTab; label: string; count: number }> = [
    { id: "all", label: "All", count: recentTasks.counts.all },
    { id: "pending", label: "Pending", count: recentTasks.counts.pending },
    {
      id: "in_progress",
      label: "In Progress",
      count: recentTasks.counts.inProgress,
    },
    { id: "overdue", label: "Overdue", count: recentTasks.counts.overdue },
    {
      id: "completed",
      label: "Completed",
      count: recentTasks.counts.completed,
    },
  ];

  const visibleItems = useMemo(() => {
    const query = taskSearch.trim().toLowerCase();
    return recentTasks.items
      .filter((task) => {
        if (taskTab !== "all" && task.statusBucket !== taskTab) return false;
        if (!query) return true;
        return (
          task.title.toLowerCase().includes(query) ||
          task.displayId.toLowerCase().includes(query) ||
          (task.assignedToName?.toLowerCase().includes(query) ?? false)
        );
      })
      .slice(0, TABLE_PAGE_SIZE);
  }, [recentTasks.items, taskSearch, taskTab]);

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-foreground">
          Recent Operational Tasks
        </h3>
        <Link
          to={OPERATIONS_ROUTES.MY_WORK}
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary hover:underline"
        >
          View All
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div
          role="tablist"
          aria-label="Task status filters"
          className="-mx-0.5 flex min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain px-0.5 scrollbar-hidden"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={taskTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "shrink-0 rounded-md px-2 py-1 text-[12px] font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                taskTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:text-foreground",
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        <label className="relative ml-auto min-w-[12rem] flex-1 sm:max-w-[14rem]">
          <span className="sr-only">Search tasks</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            value={taskSearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tasks"
            className="h-8 w-full rounded-md border border-border-subtle bg-surface pr-2.5 pl-8 text-[12px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>
      </div>
      {visibleItems.length === 0 ? (
        <p className="py-8 text-center text-[12px] text-muted">No tasks found.</p>
      ) : (
        <div className="overflow-x-auto overscroll-x-contain scrollbar-hidden">
          <table className="w-full min-w-[720px] text-left text-[12px]">
            <thead className="text-muted">
              <tr className="border-b border-border-subtle">
                <th className="py-2 pr-2 font-semibold">Task ID</th>
                <th className="py-2 pr-2 font-semibold">Task Name</th>
                <th className="py-2 pr-2 font-semibold">Module</th>
                <th className="py-2 pr-2 font-semibold">Assigned To</th>
                <th className="py-2 pr-2 font-semibold">Priority</th>
                <th className="py-2 pr-2 font-semibold">Due Date</th>
                <th className="py-2 pr-2 font-semibold">Status</th>
                <th className="py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-border-subtle/70 last:border-0"
                >
                  <td className="py-2.5 pr-2 font-medium">{task.displayId}</td>
                  <td className="py-2.5 pr-2">{task.title}</td>
                  <td className="py-2.5 pr-2 text-muted">{task.typeLabel}</td>
                  <td className="py-2.5 pr-2">
                    {task.assignedToName ?? "Unassigned"}
                  </td>
                  <td className="py-2.5 pr-2">
                    <OperationsBadge
                      variant={task.priority === "P1" ? "high" : "medium"}
                    >
                      {task.priority}
                    </OperationsBadge>
                  </td>
                  <td className="py-2.5 pr-2 text-muted">
                    {task.dueAt
                      ? new Date(task.dueAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="py-2.5 pr-2">
                    <OperationsBadge
                      variant={statusBucketBadgeVariant(task.statusBucket)}
                    >
                      {STATUS_BUCKET_LABELS[task.statusBucket]}
                    </OperationsBadge>
                  </td>
                  <td className="py-2.5">
                    <Link
                      to={task.href}
                      className="font-semibold text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
