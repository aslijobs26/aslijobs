import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import type { OperationsDashboardOverview } from "../../../../types/operations-dashboard-overview";
import { cn } from "../../../../utils/cn";

export function OverviewQuickActions({
  actions,
  onExport,
  exporting,
}: {
  actions: OperationsDashboardOverview["quickActions"];
  onExport: () => void;
  exporting: boolean;
}) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-sm">
      <h3 className="text-[12px] font-semibold text-foreground">Quick Actions</h3>
      {actions.length === 0 ? (
        <p className="mt-2 text-[11px] text-muted">No actions available.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {actions.map((action) => {
            if (action.id === "download-report") {
              return (
                <li key={action.id}>
                  <button
                    type="button"
                    disabled={exporting}
                    onClick={onExport}
                    className="w-full rounded-md px-2 py-1.5 text-left text-[11px] font-medium text-foreground hover:bg-hero-bg disabled:opacity-60"
                  >
                    {exporting ? "Downloading…" : action.label}
                  </button>
                </li>
              );
            }
            return (
              <li key={action.id}>
                <Link
                  to={action.href}
                  className="block rounded-md px-2 py-1.5 text-[11px] font-medium text-foreground hover:bg-hero-bg"
                >
                  {action.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function OverviewMyTeams({
  teams,
}: {
  teams: OperationsDashboardOverview["myTeams"];
}) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[12px] font-semibold text-foreground">My Teams</h3>
        <Link
          to={OPERATIONS_ROUTES.TEAM_MANAGEMENT}
          className="text-[10px] font-semibold text-primary hover:underline"
        >
          View All
        </Link>
      </div>
      {teams.length === 0 ? (
        <p className="mt-2 text-[11px] text-muted">No team data available.</p>
      ) : (
        <table className="mt-2 w-full text-left text-[11px]">
          <thead className="text-muted">
            <tr>
              <th className="py-1 font-semibold">Team</th>
              <th className="py-1 font-semibold">Members</th>
              <th className="py-1 font-semibold">Open</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.departmentId} className="border-t border-border-subtle/70">
                <td className="py-1.5 font-medium">{team.teamName}</td>
                <td className="py-1.5 tabular-nums">{team.memberCount}</td>
                <td className="py-1.5 tabular-nums">{team.openTasks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function OverviewAlerts({
  alerts,
}: {
  alerts: OperationsDashboardOverview["alerts"];
}) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-sm">
      <h3 className="text-[12px] font-semibold text-foreground">
        Operational Alerts
      </h3>
      {alerts.length === 0 ? (
        <p className="mt-2 text-[11px] text-muted">No operational alerts.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <Link
                to={alert.href}
                className="block rounded-md border border-border-subtle/80 px-2.5 py-2 hover:bg-hero-bg"
              >
                <p className="flex items-start gap-2 text-[11px] font-medium text-foreground">
                  <span
                    className={cn(
                      "mt-1 size-1.5 shrink-0 rounded-full",
                      alert.severity === "critical" && "bg-rose-500",
                      alert.severity === "warning" && "bg-orange-500",
                      alert.severity === "info" && "bg-sky-500",
                    )}
                    aria-hidden
                  />
                  <span>{alert.title}</span>
                </p>
                <p className="mt-1 pl-3.5 text-[10px] text-muted">
                  {alert.relativeTime}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function OverviewAskAsli() {
  return (
    <section className="rounded-xl border border-primary/15 bg-gradient-to-br from-[#EFF6FF] to-[#F8FAFC] p-3.5 shadow-sm dark:from-primary/10 dark:to-surface">
      <div className="flex items-start gap-2.5">
        <img
          src="/assets/ask-asli-robot.png"
          alt=""
          className="size-10 shrink-0 object-contain"
        />
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-foreground">Ask ASLI</p>
          <p className="mt-0.5 text-[11px] text-muted">
            Get insights about operations, team performance, or any operational
            query.
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          disabled
          placeholder="Ask a question..."
          aria-label="Ask ASLI"
          className="h-8 flex-1 cursor-not-allowed rounded-md border border-border-subtle bg-surface px-2.5 text-[11px] text-muted opacity-80"
        />
        <button
          type="button"
          disabled
          title="Ask ASLI is not available yet"
          className="inline-flex size-8 cursor-not-allowed items-center justify-center rounded-md bg-primary/70 text-white opacity-70"
          aria-label="Send question (coming soon)"
        >
          →
        </button>
      </div>
      <p className="mt-2 text-[10px] text-muted">Coming soon</p>
    </section>
  );
}
