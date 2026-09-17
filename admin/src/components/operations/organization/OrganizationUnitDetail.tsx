import { MoreHorizontal, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type {
  OperationsOrgOverviewResponse,
  OperationsOrgPeopleResponse,
  OperationsOrgUnitDetailTab,
  OperationsOrgUnitPublic,
} from "../../../types/operations-organization";
import { cn } from "../../../utils/cn";
import { OperationsCan } from "../auth/OperationsCan";
import { OrganizationOverview } from "./OrganizationOverview";
import { formatOrgUnitType } from "./org-tree-utils";

const DETAIL_TABS: Array<{ id: OperationsOrgUnitDetailTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "teams", label: "Teams" },
  { id: "people", label: "People" },
  { id: "departments", label: "Departments" },
  { id: "roles", label: "Roles" },
  { id: "settings", label: "Settings" },
];

interface OrganizationUnitDetailProps {
  unit: OperationsOrgUnitPublic | null;
  overview: OperationsOrgOverviewResponse | null;
  people: OperationsOrgPeopleResponse | null;
  detailTab: OperationsOrgUnitDetailTab;
  onDetailTabChange: (tab: OperationsOrgUnitDetailTab) => void;
  isOverviewLoading?: boolean;
  isPeopleLoading?: boolean;
  overviewError?: string | null;
  onEdit: () => void;
  onAddSubUnit: () => void;
  onArchive: () => void;
  canAddSubUnit?: boolean;
  emptyMessage?: string;
}

export function OrganizationUnitDetail({
  unit,
  overview,
  people,
  detailTab,
  onDetailTabChange,
  isOverviewLoading,
  isPeopleLoading,
  overviewError,
  onEdit,
  onAddSubUnit,
  onArchive,
  canAddSubUnit = true,
  emptyMessage,
}: OrganizationUnitDetailProps) {
  if (!unit) {
    return (
      <section className="flex min-h-[24rem] items-center justify-center rounded-xl border border-border-subtle bg-surface p-6 text-center shadow-sm xl:min-h-[32rem]">
        <p className="text-[12px] text-muted">
          {emptyMessage ??
            "Select an organization unit from the hierarchy to view details."}
        </p>
      </section>
    );
  }

  return (
    <section className="flex min-h-[24rem] flex-col rounded-xl border border-border-subtle bg-surface shadow-sm xl:min-h-[32rem]">
      <header className="flex flex-col gap-3 border-b border-border-subtle px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-4">
        <div className="min-w-0">
          <h2 className="truncate text-[18px] font-semibold tracking-tight text-foreground">
            {unit.name}
          </h2>
          <p className="mt-0.5 text-[12px] text-muted">
            {formatPartOfLabel(overview?.breadcrumbs, unit.type)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OperationsCan module="team" action="update">
            <button
              type="button"
              onClick={onEdit}
              className="h-8 rounded-lg border border-border-subtle px-2.5 text-[11px] font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Edit
            </button>
          </OperationsCan>
          <OperationsCan module="team" action="create">
            <button
              type="button"
              onClick={onAddSubUnit}
              disabled={!canAddSubUnit}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-2.5 text-[11px] font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add Sub-unit
            </button>
          </OperationsCan>
          <OperationsCan module="team" action="update">
            <button
              type="button"
              onClick={onArchive}
              aria-label="Archive unit"
              title="Archive unit"
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border-subtle text-muted hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </button>
          </OperationsCan>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Unit sections"
        className="flex gap-1 overflow-x-auto border-b border-border-subtle px-2 scrollbar-hidden"
      >
        {DETAIL_TABS.map((tab) => {
          const selected = detailTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onDetailTabChange(tab.id)}
              className={cn(
                "shrink-0 border-b-2 px-2.5 py-2 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                selected
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        {detailTab === "overview" ? (
          overviewError ? (
            <p className="py-10 text-center text-[12px] text-danger">
              {overviewError}
            </p>
          ) : overview ? (
            <OrganizationOverview
              overview={overview}
              isLoading={isOverviewLoading}
            />
          ) : (
            <p className="py-10 text-center text-[12px] text-muted">
              Loading overview…
            </p>
          )
        ) : null}

        {detailTab === "teams" ? (
          <DetailTable
            empty="No teams (departments) in this scope."
            headers={["Team", "People", "Status"]}
            rows={(overview?.teams ?? []).map((team) => [
              team.name,
              team.peopleCount.toLocaleString("en-IN"),
              team.status,
            ])}
            footerHref={OPERATIONS_ROUTES.DEPARTMENTS}
            footerLabel="Manage departments"
          />
        ) : null}

        {detailTab === "people" ? (
          isPeopleLoading ? (
            <p className="py-10 text-center text-[12px] text-muted">
              Loading people…
            </p>
          ) : (
            <DetailTable
              empty="No people assigned to this organization scope."
              headers={["Name", "Status", "Role"]}
              rows={(people?.items ?? []).map((person) => [
                person.fullName,
                person.status,
                person.role,
              ])}
              footerHref={OPERATIONS_ROUTES.TEAM_MANAGEMENT}
              footerLabel="Open team management"
            />
          )
        ) : null}

        {detailTab === "departments" ? (
          <LinkPanel
            title="Departments"
            description="Functional Operations departments are managed in the Departments module."
            href={OPERATIONS_ROUTES.DEPARTMENTS}
            actionLabel="Open Departments"
          />
        ) : null}

        {detailTab === "roles" ? (
          <LinkPanel
            title="Roles & Permissions"
            description="Role hierarchy and permission grants are managed in Roles."
            href={OPERATIONS_ROUTES.ROLES}
            actionLabel="Open Roles"
          />
        ) : null}

        {detailTab === "settings" ? (
          <div className="space-y-3 text-[12px]">
            <InfoRow label="Type" value={formatOrgUnitType(unit.type)} />
            <InfoRow label="Timezone" value={unit.timezone || "—"} />
            <InfoRow label="Primary office" value={unit.primaryOffice || "—"} />
            <InfoRow label="Code" value={unit.code || "—"} />
            <InfoRow
              label="Status"
              value={unit.status === "active" ? "Active" : "Archived"}
            />
            <OperationsCan module="team" action="update">
              <button
                type="button"
                onClick={onEdit}
                className="h-8 rounded-lg border border-border-subtle px-3 text-[11px] font-semibold text-foreground hover:bg-hero-bg"
              >
                Edit unit settings
              </button>
            </OperationsCan>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DetailTable({
  headers,
  rows,
  empty,
  footerHref,
  footerLabel,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
  footerHref: string;
  footerLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="space-y-3 py-6 text-center">
        <p className="text-[12px] text-muted">{empty}</p>
        <Link
          to={footerHref}
          className="text-[12px] font-semibold text-primary hover:underline"
        >
          {footerLabel}
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border-subtle">
        <table className="w-full min-w-[28rem] text-left text-[12px]">
          <thead className="bg-hero-bg/70 text-muted">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-3 py-2 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-border-subtle">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-3 py-2 text-foreground"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link
        to={footerHref}
        className="text-[12px] font-semibold text-primary hover:underline"
      >
        {footerLabel}
      </Link>
    </div>
  );
}

function LinkPanel({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-hero-bg/40 p-4">
      <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-[12px] text-muted">{description}</p>
      <Link
        to={href}
        className="mt-3 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-[11px] font-semibold text-surface hover:bg-primary-hover"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function formatPartOfLabel(
  breadcrumbs:
    | OperationsOrgOverviewResponse["breadcrumbs"]
    | undefined,
  unitType: string,
): string {
  if (!breadcrumbs || breadcrumbs.length <= 1) {
    return formatOrgUnitType(unitType);
  }
  const parents = breadcrumbs
    .slice(0, -1)
    .filter((crumb) => crumb.type !== "global")
    .map((crumb) => crumb.name)
    .reverse();
  if (parents.length === 0) {
    return formatOrgUnitType(unitType);
  }
  return `Part of ${parents.join(", ")}`;
}
