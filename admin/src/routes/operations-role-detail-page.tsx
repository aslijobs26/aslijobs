import { Link, useParams } from "react-router-dom";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsCan } from "../components/operations/auth/OperationsCan";
import {
  formatOperationsTimestamp,
  getOperationsApiErrorMessage,
} from "../components/operations/team/team-format";
import {
  operationsRoleEditPath,
} from "../constants/operations-routes";
import { useOperationsRoleDetail } from "../hooks/use-operations-roles";

export function OperationsRoleDetailPage() {
  const { roleId } = useParams();
  const detailQuery = useOperationsRoleDetail(roleId);

  if (detailQuery.isPending) {
    return (
      <OperationsLayout title="Role" subtitle="Loading role details.">
        <div className="h-80 animate-pulse rounded-xl border border-border-subtle bg-surface" />
      </OperationsLayout>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <OperationsLayout title="Role" subtitle="Unable to load this role.">
        <p className="text-sm text-danger">
          {getOperationsApiErrorMessage(
            detailQuery.error,
            "This role is not available in your scope.",
          )}
        </p>
      </OperationsLayout>
    );
  }

  const { role, members, childRoles, auditEvents } = detailQuery.data;
  const granted = role.grants.filter((grant) => grant.access === "allow");
  const delegatable = granted.filter((grant) => grant.canDelegate);

  return (
    <OperationsLayout
      title={role.name}
      subtitle={role.description || "Role details, members, permissions and history."}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted">
            Status: <span className="font-semibold text-foreground">{role.status}</span>
            {" · "}
            Created by {role.createdByName || "—"} on{" "}
            {formatOperationsTimestamp(role.createdAt)}
          </div>
          <OperationsCan module="roles" action="update">
            {role.status === "active" ? (
              <Link
                to={operationsRoleEditPath(role.id)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface hover:bg-primary-hover"
              >
                Edit role
              </Link>
            ) : null}
          </OperationsCan>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Department" value={role.departmentName || "—"} />
          <Info label="Parent role" value={role.parentRoleName || "—"} />
          <Info label="Can create roles" value={role.canCreateRoles ? "Yes" : "No"} />
          <Info label="Updated" value={formatOperationsTimestamp(role.updatedAt)} />
        </div>

        <section className="rounded-xl border border-border-subtle bg-surface p-4">
          <h2 className="text-sm font-bold text-foreground">Assigned members</h2>
          {members.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No members assigned.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {members.map((member) => (
                <li key={member.id} className="flex justify-between gap-3">
                  <span className="font-semibold text-foreground">{member.fullName}</span>
                  <span className="text-muted">{member.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border-subtle bg-surface p-4">
          <h2 className="text-sm font-bold text-foreground">Permissions</h2>
          <p className="mt-1 text-xs text-muted">
            {granted.length} granted · {delegatable.length} delegatable
          </p>
          <ul className="mt-3 max-h-80 space-y-1 overflow-auto text-xs">
            {granted.map((grant) => (
              <li key={grant.key} className="flex justify-between gap-3 rounded-md bg-hero-bg/50 px-2 py-1">
                <span className="font-mono text-foreground">{grant.key}</span>
                <span className="text-muted">
                  {grant.canDelegate ? "use + delegate" : "use only"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border-subtle bg-surface p-4">
          <h2 className="text-sm font-bold text-foreground">Child roles</h2>
          {childRoles.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No child roles.</p>
          ) : (
            <ul className="mt-3 space-y-1 text-sm">
              {childRoles.map((child) => (
                <li key={child.id}>
                  {child.name} · {child.status}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border-subtle bg-surface p-4">
          <h2 className="text-sm font-bold text-foreground">Role history</h2>
          {auditEvents.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No audit events visible.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {auditEvents.map((event) => (
                <li key={event.id} className="rounded-lg bg-hero-bg/50 px-3 py-2">
                  <p className="font-semibold text-foreground">{event.action}</p>
                  <p className="text-xs text-muted">
                    {event.actorName || "Unknown"} ·{" "}
                    {formatOperationsTimestamp(event.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </OperationsLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
