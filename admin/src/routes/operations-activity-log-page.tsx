import { useState } from "react";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import {
  formatOperationsTimestamp,
  getOperationsApiErrorMessage,
} from "../components/operations/team/team-format";
import { useOperationsAuditLog } from "../hooks/use-operations-audit";

export function OperationsActivityLogPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [targetType, setTargetType] = useState("");
  const query = useOperationsAuditLog({
    page,
    limit,
    search,
    targetType,
  });
  const events = query.data?.events ?? [];
  const pagination = query.data?.pagination ?? {
    page,
    limit,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  return (
    <OperationsLayout
      title="Activity Log"
      subtitle="Immutable history of role, permission, and team changes."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Search actor, target or action"
            className="h-10 min-w-0 flex-1 rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground"
          />
          <select
            value={targetType}
            onChange={(event) => {
              setPage(1);
              setTargetType(event.target.value);
            }}
            className="h-10 rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground"
          >
            <option value="">All targets</option>
            <option value="role">Roles</option>
            <option value="user">Users</option>
            <option value="department">Departments</option>
          </select>
        </div>
        {query.isError ? (
          <p className="text-sm text-danger">
            {getOperationsApiErrorMessage(query.error, "Unable to load activity log.")}
          </p>
        ) : query.isPending ? (
          <div className="h-80 animate-pulse rounded-xl border border-border-subtle bg-surface" />
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-subtle px-6 py-16 text-center text-sm text-muted">
            No activity recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-hero-bg/60 text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-3 text-muted">
                      {formatOperationsTimestamp(event.createdAt)}
                    </td>
                    <td className="px-4 py-3">{event.actorName || "—"}</td>
                    <td className="px-4 py-3 font-semibold">{event.action}</td>
                    <td className="px-4 py-3 text-muted">
                      {event.targetType} · {event.targetLabel || event.targetId}
                    </td>
                    <td className="px-4 py-3 text-muted">{event.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.total > 0 ? (
          <JobsPaginationBar
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={(next) => {
              setLimit(next);
              setPage(1);
            }}
            ariaLabel="Activity log pagination"
          />
        ) : null}
      </div>
    </OperationsLayout>
  );
}
