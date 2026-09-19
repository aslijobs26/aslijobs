import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  Briefcase,
  Building2,
  CheckCircle2,
  Eye,
  MapPin,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { OrganizationTabs } from "../components/operations/organization/OrganizationTabs";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsCanKey } from "../components/operations/auth/OperationsCanKey";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsFilterSelect } from "../components/operations/jobs/OperationsFilterSelect";
import {
  formatPeopleTimestamp,
  getAvatarPalette,
  getMemberInitials,
  PeopleKpiCard,
} from "../components/operations/team/people-ui";
import { getOperationsApiErrorMessage } from "../components/operations/team/team-format";
import { flattenOrgTree } from "../components/operations/organization/org-tree-utils";
import {
  OPERATIONS_ROUTES,
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

const KPI_CARDS: Array<{
  key:
    | "totalTeams"
    | "activeTeams"
    | "inactiveTeams"
    | "locations"
    | "departments"
    | "openWork";
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  cardClassName: string;
  accentClassName: string;
}> = [
  {
    key: "totalTeams",
    label: "Total Teams",
    icon: UsersRound,
    iconClassName: "bg-sky-500/20 text-sky-600",
    cardClassName:
      "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white dark:border-sky-500/25 dark:from-sky-500/10 dark:to-surface",
    accentClassName: "text-sky-700 dark:text-sky-300",
  },
  {
    key: "activeTeams",
    label: "Active Teams",
    icon: CheckCircle2,
    iconClassName: "bg-success/20 text-success",
    cardClassName:
      "border-success/20 bg-gradient-to-br from-success/10 to-white dark:from-success/15 dark:to-surface",
    accentClassName: "text-success",
  },
  {
    key: "inactiveTeams",
    label: "Inactive Teams",
    icon: Ban,
    iconClassName: "bg-danger/20 text-danger",
    cardClassName:
      "border-danger/20 bg-gradient-to-br from-danger/10 to-white dark:from-danger/15 dark:to-surface",
    accentClassName: "text-danger",
  },
  {
    key: "locations",
    label: "Locations",
    icon: MapPin,
    iconClassName: "bg-blue-500/20 text-blue-600",
    cardClassName:
      "border-blue-200/80 bg-gradient-to-br from-blue-50 to-white dark:border-blue-500/25 dark:from-blue-500/10 dark:to-surface",
    accentClassName: "text-blue-700 dark:text-blue-300",
  },
  {
    key: "departments",
    label: "Departments",
    icon: Building2,
    iconClassName: "bg-primary/20 text-primary",
    cardClassName:
      "border-primary/20 bg-gradient-to-br from-primary/10 to-white dark:from-primary/15 dark:to-surface",
    accentClassName: "text-primary",
  },
  {
    key: "openWork",
    label: "Open Work",
    icon: Briefcase,
    iconClassName: "bg-violet-500/20 text-violet-600",
    cardClassName:
      "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white dark:border-violet-500/25 dark:from-violet-500/10 dark:to-surface",
    accentClassName: "text-violet-700 dark:text-violet-300",
  },
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

function formatTeamLocation(team: OperationsOpsTeam): string {
  return (
    [team.city, team.state, team.region].filter(Boolean).join(" · ") ||
    team.orgUnitName ||
    "—"
  );
}

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

  const hasActiveFilters =
    Boolean(searchInput.trim()) ||
    Boolean(departmentId && departmentId !== departmentFromUrl) ||
    Boolean(orgUnitId && orgUnitId !== orgUnitFromUrl) ||
    status !== "active";

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("active");
    setDepartmentId(departmentFromUrl);
    setOrgUnitId(orgUnitFromUrl);
    setPage(1);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setDialog(true);
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
    <OperationsLayout title="Teams" headerVariant="command">
      <div className="flex flex-col gap-4 lg:gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              to={OPERATIONS_ROUTES.ORGANIZATION}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Organization
              <span className="text-muted/70" aria-hidden="true">
                ›
              </span>
              <span className="font-semibold text-foreground">Teams</span>
            </Link>
            <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground sm:text-[24px]">
              Teams
            </h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-snug text-muted">
              Manage operational teams, locations, leads and members across the
              organization.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <OperationsCanKey permissionKey="team.teams.create">
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-[42px] min-w-[130px] items-center justify-center gap-1.5 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
                Create team
              </button>
            </OperationsCanKey>
            <button
              type="button"
              aria-label="More page actions"
              className="inline-flex size-[42px] items-center justify-center rounded-[10px] border border-border-subtle bg-surface text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <MoreVertical className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <OrganizationTabs />

        {metricsQuery.isError ? (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {getOperationsApiErrorMessage(
              metricsQuery.error,
              "Unable to load team metrics.",
            )}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
          {KPI_CARDS.map((item) => (
            <PeopleKpiCard
              key={item.key}
              label={item.label}
              value={
                metricsQuery.data?.[item.key] != null
                  ? metricsQuery.data[item.key]
                  : "—"
              }
              icon={item.icon}
              iconClassName={item.iconClassName}
              cardClassName={item.cardClassName}
              accentClassName={item.accentClassName}
              loading={metricsQuery.isPending}
            />
          ))}
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-3.5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search teams..."
                className="h-10 w-full rounded-lg border border-border-subtle bg-hero-bg/40 pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:flex xl:shrink-0 xl:items-center">
              <div className="w-full xl:w-[11rem]">
                <OperationsFilterSelect
                  label="Department"
                  value={departmentId}
                  options={[
                    { value: "", label: "All departments" },
                    ...(departmentsQuery.data?.departments ?? []).map(
                      (department) => ({
                        value: department.id,
                        label: department.name,
                      }),
                    ),
                  ]}
                  onChange={(value) => {
                    setDepartmentId(value);
                    setPage(1);
                  }}
                  hideSearch
                  triggerClassName="h-10"
                />
              </div>
              <div className="w-full xl:w-[11rem]">
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
                  triggerClassName="h-10"
                />
              </div>
              <div className="w-full xl:w-[9.5rem]">
                <OperationsFilterSelect
                  label="Status"
                  value={status}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "archived", label: "Inactive" },
                    { value: "all", label: "All statuses" },
                  ]}
                  onChange={(value) => {
                    setStatus(value as typeof status);
                    setPage(1);
                  }}
                  hideSearch
                  triggerClassName="h-10"
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 xl:ml-auto">
              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters && !searchInput}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-[12px] font-semibold text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Reset
              </button>
              <OperationsCanKey permissionKey="team.teams.create">
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-[12px] font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <Plus
                    className="size-3.5"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  Create team
                </button>
              </OperationsCanKey>
            </div>
          </div>
        </div>

        {teamsQuery.isError ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-danger">
              Unable to load teams.
            </p>
            <p className="mt-1 text-sm text-danger/80">
              {getOperationsApiErrorMessage(
                teamsQuery.error,
                "Please try again.",
              )}
            </p>
            <button
              type="button"
              onClick={() => void teamsQuery.refetch()}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-danger/30 bg-surface px-4 text-[12px] font-semibold text-danger hover:bg-danger/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Retry
            </button>
          </div>
        ) : teamsQuery.isPending ? (
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="space-y-0">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex h-[84px] items-center gap-4 border-b border-border-subtle px-4 last:border-0"
                >
                  <div className="size-9 animate-pulse rounded-full bg-hero-bg" />
                  <div className="h-4 w-28 animate-pulse rounded bg-hero-bg" />
                  <div className="ml-auto h-4 w-40 animate-pulse rounded bg-hero-bg" />
                </div>
              ))}
            </div>
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-subtle bg-surface px-6 py-16 text-center">
            <p className="text-sm font-semibold text-foreground">
              No teams found
            </p>
            <p className="mt-1 text-sm text-muted">
              {hasActiveFilters
                ? "Try adjusting your search or filters."
                : "Create your first operational team to get started."}
            </p>
            <OperationsCanKey permissionKey="team.teams.create">
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
                Create team
              </button>
            </OperationsCanKey>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <table className="min-w-[64rem] w-full text-left">
              <thead className="border-b border-border-subtle bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
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
                {teams.map((team) => {
                  const isActive = team.status === "active";
                  return (
                    <tr
                      key={team.id}
                      className="h-[84px] border-b border-border-subtle transition-colors last:border-0 hover:bg-[#F0F9F8]/40"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={cn(
                              "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
                              getAvatarPalette(team.id || team.name),
                            )}
                            aria-hidden="true"
                          >
                            {getMemberInitials(team.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold leading-snug text-foreground">
                              {team.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted">
                              {team.code}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-[13px] text-muted">
                        {team.departmentName || "—"}
                      </td>
                      <td className="px-4 py-3 align-middle text-[13px] text-muted">
                        {formatTeamLocation(team)}
                      </td>
                      <td className="px-4 py-3 align-middle text-[13px] text-foreground">
                        {team.leadName || "—"}
                      </td>
                      <td className="px-4 py-3 align-middle text-[13px] tabular-nums text-foreground">
                        {team.activeMemberCount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 align-middle text-[13px] tabular-nums text-foreground">
                        {team.openWorkCount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            isActive
                              ? "bg-success/10 text-success"
                              : "bg-danger/10 text-danger",
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              isActive ? "bg-success" : "bg-danger",
                            )}
                            aria-hidden="true"
                          />
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-pre-line text-[12px] leading-snug text-muted">
                        {formatPeopleTimestamp(team.createdAt)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <Link
                            to={operationsTeamDetailPath(team.id)}
                            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          >
                            <Eye className="size-3.5" aria-hidden="true" />
                            View
                          </Link>
                          <OperationsCanKey permissionKey="team.teams.archive">
                            {isActive ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setArchiveError("");
                                  setArchiveTarget(team);
                                }}
                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-danger transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                              >
                                Archive
                              </button>
                            ) : null}
                          </OperationsCanKey>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.total > limit ? (
          <div className="rounded-xl border border-border-subtle bg-surface px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-4">
            <JobsPaginationBar
              pagination={pagination}
              onPageChange={setPage}
              onLimitChange={(next) => {
                setLimit(next);
                setPage(1);
              }}
              ariaLabel="Teams pagination"
            />
          </div>
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
            <h2
              id="create-team-title"
              className="text-base font-bold text-foreground"
            >
              Create team
            </h2>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-xs font-semibold text-muted">
                Team name
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-muted">
                Team code
                <input
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      code: event.target.value,
                    }))
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
                    ...(leadCandidatesQuery.data?.members ?? []).map(
                      (member) => ({
                        value: member.id,
                        label: member.fullName,
                      }),
                    ),
                  ]}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, leadUserId: value }))
                  }
                  triggerClassName="h-9 rounded-lg text-xs"
                />
              </div>
              {formError ? (
                <p className="text-sm text-danger">{formError}</p>
              ) : null}
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
            <h2 className="text-base font-bold text-foreground">
              Archive team?
            </h2>
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
                className="h-10 rounded-lg border border-border-subtle px-4 text-sm font-semibold text-foreground hover:bg-hero-bg"
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
