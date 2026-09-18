import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Building2,
  CheckCircle2,
  MapPin,
  Plus,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { OrganizationTabs } from "../components/operations/organization/OrganizationTabs";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsCanKey } from "../components/operations/auth/OperationsCanKey";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsFilterSelect } from "../components/operations/jobs/OperationsFilterSelect";
import {
  formatOperationsTimestamp,
  getOperationsApiErrorMessage,
} from "../components/operations/team/team-format";
import { flattenOrgTree } from "../components/operations/organization/org-tree-utils";
import {
  operationsTeamDetailPath,
} from "../constants/operations-routes";
import { useOperationsDepartments } from "../hooks/use-operations-departments";
import { useOperationsOrgTree } from "../hooks/use-operations-organization";
import {
  useArchiveOperationsOpsTeam,
  useCreateOperationsOpsTeam,
  useOperationsOpsTeamMetrics,
  useOperationsOpsTeams,
} from "../hooks/use-operations-ops-teams";
import { useOperationsTeamMembers } from "../hooks/use-operations-team";
import type { OperationsOpsTeam } from "../types/operations-ops-teams";
import { cn } from "../utils/cn";

const KPI: Array<{
  key:
    | "totalTeams"
    | "activeTeams"
    | "inactiveTeams"
    | "locations"
    | "departments"
    | "openWork";
  label: string;
  icon: LucideIcon;
}> = [
  { key: "totalTeams", label: "Total Teams", icon: UsersRound },
  { key: "activeTeams", label: "Active Teams", icon: CheckCircle2 },
  { key: "inactiveTeams", label: "Inactive Teams", icon: Ban },
  { key: "locations", label: "Locations", icon: MapPin },
  { key: "departments", label: "Departments", icon: Building2 },
  { key: "openWork", label: "Open Work", icon: Users },
];

type TeamFormState = {
  name: string;
  code: string;
  description: string;
  departmentId: string;
  orgUnitId: string;
  leadUserId: string;
};

const EMPTY_FORM: TeamFormState = {
  name: "",
  code: "",
  description: "",
  departmentId: "",
  orgUnitId: "",
  leadUserId: "",
};

export function OperationsTeamsPage() {
  const [searchParams] = useSearchParams();
  const departmentFromUrl = searchParams.get("departmentId") ?? "";
  const orgUnitFromUrl = searchParams.get("orgUnitId") ?? "";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"active" | "archived" | "all">("active");
  const [departmentId, setDepartmentId] = useState(departmentFromUrl);
  const [orgUnitId, setOrgUnitId] = useState(orgUnitFromUrl);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState<TeamFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<OperationsOpsTeam | null>(
    null,
  );
  const [archiveError, setArchiveError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setDepartmentId(departmentFromUrl);
    setOrgUnitId(orgUnitFromUrl);
    setPage(1);
  }, [departmentFromUrl, orgUnitFromUrl]);

  const metricsQuery = useOperationsOpsTeamMetrics();
  const teamsQuery = useOperationsOpsTeams({
    page,
    limit,
    search,
    status,
    departmentId: departmentId || undefined,
    orgUnitId: orgUnitId || undefined,
  });
  const departmentsQuery = useOperationsDepartments({ status: "active" });
  const treeQuery = useOperationsOrgTree({ status: "active" });
  const createMutation = useCreateOperationsOpsTeam();
  const archiveMutation = useArchiveOperationsOpsTeam();
  const leadCandidatesQuery = useOperationsTeamMembers(
    {
      page: 1,
      limit: 100,
      status: "active",
      departmentId: form.departmentId || undefined,
      orgUnitId: form.orgUnitId || undefined,
    },
    { enabled: dialog && Boolean(form.departmentId && form.orgUnitId) },
  );

  const locations = useMemo(
    () =>
      flattenOrgTree(treeQuery.data?.roots ?? []).filter((node) =>
        ["region", "state", "city", "office"].includes(node.type),
      ),
    [treeQuery.data?.roots],
  );

  const teams = teamsQuery.data?.teams ?? [];
  const pagination = teamsQuery.data?.pagination ?? {
    page,
    limit,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const submit = async () => {
    setFormError("");
    try {
      await createMutation.mutateAsync({
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim(),
        departmentId: form.departmentId,
        orgUnitId: form.orgUnitId,
        leadUserId: form.leadUserId || null,
      });
      setDialog(false);
      setForm(EMPTY_FORM);
    } catch (error) {
      setFormError(getOperationsApiErrorMessage(error, "Unable to create team."));
    }
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiveError("");
    try {
      await archiveMutation.mutateAsync({
        teamId: archiveTarget.id,
        expectedRevision: archiveTarget.revision,
      });
      setArchiveTarget(null);
    } catch (error) {
      setArchiveError(
        getOperationsApiErrorMessage(error, "Unable to archive team."),
      );
    }
  };

  return (
    <OperationsLayout
      title="Teams"
      subtitle="Manage operational teams, locations, leads and members."
    >
      <div className="flex flex-col gap-4">
        <OrganizationTabs />

        {metricsQuery.isError ? (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {getOperationsApiErrorMessage(
              metricsQuery.error,
              "Unable to load team metrics.",
            )}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {KPI.map((item) => {
            const Icon = item.icon;
            const value = metricsQuery.data?.[item.key];
            return (
              <div
                key={item.key}
                className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm ops-brand-border-glow"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-primary/10 p-1.5 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {item.label}
                  </p>
                </div>
                <p className="mt-2 text-xl font-bold text-foreground">
                  {metricsQuery.isPending || value == null
                    ? "—"
                    : value.toLocaleString("en-IN")}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-3 shadow-sm lg:flex-row lg:items-center">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search teams"
            className="h-10 min-w-0 flex-1 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-[36rem]">
            <OperationsFilterSelect
              label="Department"
              value={departmentId}
              options={[
                { value: "", label: "All departments" },
                ...(departmentsQuery.data?.departments ?? []).map((department) => ({
                  value: department.id,
                  label: department.name,
                })),
              ]}
              onChange={(value) => {
                setDepartmentId(value);
                setPage(1);
              }}
              hideSearch
              triggerClassName="h-9"
            />
            <OperationsFilterSelect
              label="Location"
              value={orgUnitId}
              options={[
                { value: "", label: "All locations" },
                ...locations.map((unit) => ({
                  value: unit.id,
                  label: `${unit.name} · ${unit.type}`,
                })),
              ]}
              onChange={(value) => {
                setOrgUnitId(value);
                setPage(1);
              }}
              triggerClassName="h-9"
            />
            <OperationsFilterSelect
              label="Status"
              value={status}
              options={[
                { value: "active", label: "Active" },
                { value: "archived", label: "Inactive" },
                { value: "all", label: "All" },
              ]}
              onChange={(value) => {
                setStatus(value as typeof status);
                setPage(1);
              }}
              hideSearch
              triggerClassName="h-9"
            />
          </div>
          <OperationsCanKey permissionKey="team.teams.create">
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_FORM);
                setFormError("");
                setDialog(true);
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Plus className="size-4" aria-hidden="true" />
              Create team
            </button>
          </OperationsCanKey>
        </div>

        {teamsQuery.isError ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <p>
              {getOperationsApiErrorMessage(
                teamsQuery.error,
                "Unable to load teams.",
              )}
            </p>
            <button
              type="button"
              onClick={() => void teamsQuery.refetch()}
              className="mt-2 text-xs font-semibold underline"
            >
              Retry
            </button>
          </div>
        ) : teamsQuery.isPending ? (
          <div className="h-64 animate-pulse rounded-xl border border-border-subtle bg-surface" />
        ) : teams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-subtle bg-surface px-6 py-16 text-center text-sm text-muted">
            No operational teams match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-sm">
            <table className="min-w-[64rem] text-left text-sm">
              <thead className="border-b border-border-subtle bg-hero-bg/60 text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Team Lead</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Open Work</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{team.name}</p>
                      <p className="text-[11px] text-muted">{team.code}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {team.departmentName || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {[team.city, team.state, team.region]
                        .filter(Boolean)
                        .join(" · ") || team.orgUnitName || "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {team.leadName || "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {team.activeMemberCount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {team.openWorkCount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                          team.status === "active"
                            ? "bg-success/10 text-success"
                            : "bg-muted/25 text-muted",
                        )}
                      >
                        {team.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatOperationsTimestamp(team.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          to={operationsTeamDetailPath(team.id)}
                          className="rounded-lg border border-border-subtle px-2 py-1 text-xs font-semibold text-foreground hover:bg-hero-bg"
                        >
                          View
                        </Link>
                        <OperationsCanKey permissionKey="team.teams.archive">
                          {team.status === "active" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setArchiveError("");
                                setArchiveTarget(team);
                              }}
                              className="rounded-lg border border-danger/30 px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/10"
                            >
                              Archive
                            </button>
                          ) : null}
                        </OperationsCanKey>
                      </div>
                    </td>
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
            ariaLabel="Teams pagination"
          />
        ) : null}
      </div>

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-team-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border-subtle bg-surface p-5 shadow-xl"
          >
            <h2 id="create-team-title" className="text-base font-bold text-foreground">
              Create team
            </h2>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-xs font-semibold text-muted">
                Team name
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-muted">
                Team code
                <input
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, code: event.target.value }))
                  }
                  className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-muted">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className="rounded-lg border border-border-subtle bg-hero-bg/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </label>
              <div className="grid gap-1.5">
                <p className="text-xs font-semibold text-muted">Department</p>
                <OperationsFilterSelect
                  label="Department"
                  value={form.departmentId}
                  options={[
                    { value: "", label: "Select department" },
                    ...(departmentsQuery.data?.departments ?? []).map(
                      (department) => ({
                        value: department.id,
                        label: department.name,
                      }),
                    ),
                  ]}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      departmentId: value,
                      leadUserId: "",
                    }))
                  }
                  triggerClassName="h-9 rounded-lg text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <p className="text-xs font-semibold text-muted">Location</p>
                <OperationsFilterSelect
                  label="Location"
                  value={form.orgUnitId}
                  options={[
                    { value: "", label: "Select location" },
                    ...locations.map((unit) => ({
                      value: unit.id,
                      label: `${unit.name} · ${unit.type}`,
                    })),
                  ]}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      orgUnitId: value,
                      leadUserId: "",
                    }))
                  }
                  triggerClassName="h-9 rounded-lg text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <p className="text-xs font-semibold text-muted">Team lead</p>
                <OperationsFilterSelect
                  label="Team lead"
                  value={form.leadUserId}
                  options={[
                    { value: "", label: "Assign later" },
                    ...(leadCandidatesQuery.data?.members ?? []).map((member) => ({
                      value: member.id,
                      label: member.fullName,
                    })),
                  ]}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, leadUserId: value }))
                  }
                  triggerClassName="h-9 rounded-lg text-xs"
                />
              </div>
              {formError ? <p className="text-sm text-danger">{formError}</p> : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialog(false)}
                className="h-10 rounded-lg border border-border-subtle px-4 text-sm font-semibold text-foreground hover:bg-hero-bg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  createMutation.isPending ||
                  !form.name.trim() ||
                  !form.code.trim() ||
                  !form.departmentId ||
                  !form.orgUnitId
                }
                onClick={() => void submit()}
                className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover disabled:opacity-60"
              >
                {createMutation.isPending ? "Saving…" : "Create team"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {archiveTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface p-5 shadow-xl"
          >
            <h2 className="text-base font-bold text-foreground">Archive team?</h2>
            <p className="mt-2 text-sm text-muted">
              {archiveTarget.name} will be soft-archived. Active members and open
              work must be reassigned first.
            </p>
            {archiveError ? (
              <p className="mt-3 text-sm text-danger" role="alert">
                {archiveError}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                className="h-10 rounded-lg border border-border-subtle px-4 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={archiveMutation.isPending}
                onClick={() => void confirmArchive()}
                className="h-10 rounded-lg bg-danger px-4 text-sm font-semibold text-surface disabled:opacity-60"
              >
                {archiveMutation.isPending ? "Archiving…" : "Archive"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </OperationsLayout>
  );
}
