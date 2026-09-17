import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type {
  OperationsOrgOverviewResponse,
  OperationsOrgPeopleResponse,
  OperationsOrgTreeNode,
} from "../../../types/operations-organization";
import { formatOperationsTimestamp } from "../team/team-format";
import { flattenOrgTree, formatOrgUnitType } from "./org-tree-utils";

interface OrganizationEmbedPanelsProps {
  variant: "people" | "roles" | "departments" | "locations" | "teams" | "settings";
  unitId: string | null;
  unitName?: string;
  people: OperationsOrgPeopleResponse | null;
  peopleLoading: boolean;
  overview: OperationsOrgOverviewResponse | null;
  overviewLoading: boolean;
  roots: OperationsOrgTreeNode[];
  onEditUnit?: () => void;
}

export function OrganizationEmbedPanels({
  variant,
  unitId,
  unitName,
  people,
  peopleLoading,
  overview,
  overviewLoading,
  roots,
  onEditUnit,
}: OrganizationEmbedPanelsProps) {
  if (variant === "people") {
    return (
      <div className="space-y-3">
        <EmbedLinkCard
          title="People"
          description={
            unitName
              ? `People assigned under ${unitName}. Full create and status management lives in Team.`
              : "Select a unit to list people in scope, or open Team for full management."
          }
          href={OPERATIONS_ROUTES.TEAM_MANAGEMENT}
          label="Open Team management"
        />
        {!unitId ? (
          <EmptyState message="Select a unit from Structure to load people." />
        ) : peopleLoading ? (
          <EmptyState message="Loading people…" />
        ) : !people || people.items.length === 0 ? (
          <EmptyState message="No people assigned in this unit scope." />
        ) : (
          <section className="rounded-xl border border-border-subtle bg-surface shadow-sm">
            <header className="border-b border-border-subtle px-4 py-3">
              <h3 className="text-[13px] font-semibold text-foreground">
                People in scope ({people.total.toLocaleString("en-IN")})
              </h3>
            </header>
            <ul className="divide-y divide-border-subtle">
              {people.items.map((person) => (
                <li key={person.id} className="px-4 py-3">
                  <p className="text-[12px] font-medium text-foreground">
                    {person.fullName}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {[
                      person.email,
                      person.role,
                      person.status,
                      formatOperationsTimestamp(person.lastActiveAt),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  if (variant === "roles") {
    return (
      <EmbedLinkCard
        title="Roles & Permissions"
        description="Define custom roles, permission matrices, and role hierarchy on the dedicated Roles page."
        href={OPERATIONS_ROUTES.ROLES}
        label="Open Roles & Permissions"
      />
    );
  }

  if (variant === "departments") {
    return (
      <div className="space-y-3">
        <EmbedLinkCard
          title="Departments"
          description="Create and archive departments on the Departments page. Overview below shows people share for the selected unit."
          href={OPERATIONS_ROUTES.DEPARTMENTS}
          label="Open Departments"
        />
        {overviewLoading ? (
          <EmptyState message="Loading department distribution…" />
        ) : overview && overview.peopleByDepartment.length > 0 ? (
          <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
            <h3 className="text-[13px] font-semibold text-foreground">
              People by department
            </h3>
            <ul className="mt-3 space-y-2">
              {overview.peopleByDepartment.map((dept) => (
                <li
                  key={dept.id}
                  className="flex items-center justify-between gap-2 text-[12px]"
                >
                  <span className="min-w-0 truncate text-foreground">
                    {dept.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted">
                    {dept.count.toLocaleString("en-IN")}
                    {dept.percent != null ? ` · ${dept.percent}%` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <EmptyState message="No department distribution for this unit." />
        )}
      </div>
    );
  }

  if (variant === "locations") {
    const locations = flattenOrgTree(roots).filter(
      (node) =>
        node.type === "state" ||
        node.type === "city" ||
        node.type === "office",
    );
    return (
      <section className="rounded-xl border border-border-subtle bg-surface shadow-sm">
        <header className="border-b border-border-subtle px-4 py-3">
          <h2 className="text-[13px] font-semibold text-foreground">
            Locations
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">
            States, cities, and offices from the organization tree
          </p>
        </header>
        {locations.length === 0 ? (
          <EmptyState message="No location units in this scope." />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {locations.map((node) => (
              <li
                key={node.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-foreground">
                    {node.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {formatOrgUnitType(node.type)}
                    {node.primaryOffice ? ` · ${node.primaryOffice}` : ""}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums text-[11px] text-muted">
                  {node.peopleCount.toLocaleString("en-IN")} people
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (variant === "teams") {
    return (
      <div className="space-y-3">
        <EmbedLinkCard
          title="Teams"
          description="Teams are represented by active departments. Manage membership from Team and Departments."
          href={OPERATIONS_ROUTES.DEPARTMENTS}
          label="Open Departments"
        />
        {overviewLoading ? (
          <EmptyState message="Loading teams…" />
        ) : overview && overview.teams.length > 0 ? (
          <section className="overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-sm">
            <table className="w-full min-w-[28rem] text-left text-[12px]">
              <thead>
                <tr className="border-b border-border-subtle text-[10px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium">People</th>
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {overview.teams.map((team) => (
                  <tr key={team.id} className="border-b border-border-subtle/70">
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {team.name}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-muted">
                      {team.peopleCount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      {team.leadName ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 capitalize text-muted">
                      {team.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <EmptyState message="No teams in this scope." />
        )}
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
      <h2 className="text-[13px] font-semibold text-foreground">Settings</h2>
      <p className="mt-1 text-[12px] text-muted">
        {unitName
          ? `Edit ${unitName} from the Structure panel, or use Edit below.`
          : "Select a unit in Structure to edit organization settings."}
      </p>
      {onEditUnit && unitId ? (
        <button
          type="button"
          onClick={onEditUnit}
          className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-3 text-[12px] font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Edit selected unit
        </button>
      ) : null}
    </section>
  );
}

function EmbedLinkCard({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
      <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-[12px] text-muted">{description}</p>
      <Link
        to={href}
        className="mt-4 inline-flex h-9 items-center rounded-lg border border-border-subtle px-3 text-[12px] font-medium text-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        {label}
      </Link>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border-subtle px-4 py-12 text-center text-[12px] text-muted">
      {message}
    </p>
  );
}
