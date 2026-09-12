import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import type {
  DashboardTaskTab,
  OperationsDashboardOverview,
} from "../../../../types/operations-dashboard-overview";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import { cn } from "../../../../utils/cn";
import { OperationsBadge } from "../../../ui/OperationsBadge";

const STATUS_COLORS = {
  completed: "#059669",
  inProgress: "#2563EB",
  pending: "#EA580C",
  overdue: "#DC2626",
};

export function OverviewTaskStatus({
  status,
}: {
  status: OperationsDashboardOverview["taskStatus"];
}) {
  const data = [
    { name: "Completed", value: status.completed, key: "completed" as const },
    {
      name: "In Progress",
      value: status.inProgress,
      key: "inProgress" as const,
    },
    { name: "Pending", value: status.pending, key: "pending" as const },
    { name: "Overdue", value: status.overdue, key: "overdue" as const },
  ].filter((row) => row.value > 0);

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
      <h3 className="mb-3 text-[13px] font-semibold text-foreground">
        Task Status
      </h3>
      {status.total === 0 ? (
        <p className="py-8 text-center text-[12px] text-muted">
          No operational tasks found.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
          <div className="relative mx-auto h-36 w-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={42}
                  outerRadius={60}
                  paddingAngle={2}
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={STATUS_COLORS[entry.key]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[16px] font-semibold tabular-nums">
                {status.total}
              </p>
              <p className="text-[10px] text-muted">Total Tasks</p>
            </div>
          </div>
          <ul className="flex flex-col justify-center gap-1.5 text-[12px]">
            <li>
              Completed: {status.completed} ({status.completedPercent ?? 0}%)
            </li>
            <li>
              In Progress: {status.inProgress} (
              {status.inProgressPercent ?? 0}%)
            </li>
            <li>
              Pending: {status.pending} ({status.pendingPercent ?? 0}%)
            </li>
            <li>
              Overdue: {status.overdue} ({status.overduePercent ?? 0}%)
            </li>
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
      <h3 className="mb-3 text-[13px] font-semibold text-foreground">
        Team Performance
      </h3>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-[12px] text-muted">
          No team activity available.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => {
            const rate = row.completionRate ?? 0;
            const barColor =
              rate >= 85
                ? "bg-emerald-500"
                : rate >= 70
                  ? "bg-orange-500"
                  : "bg-rose-500";
            return (
              <li key={row.departmentId}>
                <div className="mb-1 flex items-center justify-between gap-2 text-[12px]">
                  <span className="font-medium text-foreground">
                    {row.teamName}
                  </span>
                  <span className="tabular-nums font-semibold text-foreground">
                    {row.completionRate == null
                      ? "—"
                      : `${row.completionRate}%`}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-hero-bg">
                  <div
                    className={cn("h-full rounded-full", barColor)}
                    style={{ width: `${Math.min(rate, 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
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

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-foreground">
          Recent Operational Tasks
        </h3>
        <Link
          to={OPERATIONS_ROUTES.MY_WORK}
          className="text-[11px] font-semibold text-primary hover:underline"
        >
          View All →
        </Link>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              taskTab === tab.id
                ? "bg-primary text-white"
                : "bg-hero-bg text-muted hover:text-foreground",
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
        <input
          value={taskSearch}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search tasks..."
          aria-label="Search operational tasks"
          className="ml-auto h-8 min-w-[160px] flex-1 rounded-md border border-border-subtle px-2.5 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:max-w-[220px]"
        />
      </div>
      {recentTasks.items.length === 0 ? (
        <p className="py-8 text-center text-[12px] text-muted">No tasks found.</p>
      ) : (
        <div className="overflow-x-auto">
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
              {recentTasks.items.map((task) => (
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
                  <td className="py-2.5 pr-2 capitalize text-muted">
                    {task.statusBucket.replace("_", " ")}
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
