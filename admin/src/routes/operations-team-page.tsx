import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Shield,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { OrganizationTabs } from "../components/operations/organization/OrganizationTabs";
import { flattenOrgTree } from "../components/operations/organization/org-tree-utils";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsCan } from "../components/operations/auth/OperationsCan";
import { OperationsCanKey } from "../components/operations/auth/OperationsCanKey";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsFilterSelect } from "../components/operations/jobs/OperationsFilterSelect";
import { PeopleMemberRowActions } from "../components/operations/team/PeopleMemberRowActions";
import {
  formatPeopleTimestamp,
  getAvatarPalette,
  getMemberInitials,
  getRoleBadgePalette,
  PeopleKpiCard,
} from "../components/operations/team/people-ui";
import { getOperationsApiErrorMessage } from "../components/operations/team/team-format";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import { useOperationsPermissions } from "../hooks/use-operations-permissions";
import {
  useCreateOperationsTeamMember,
  useDeleteOperationsTeamMember,
  useOperationsTeamMembers,
  useOperationsTeamOverview,
  useResendOperationsTeamInvitation,
  useUpdateOperationsTeamMember,
  useUpdateOperationsTeamMemberStatus,
} from "../hooks/use-operations-team";
import { useOperationsRoles } from "../hooks/use-operations-roles";
import { useOperationsDepartments } from "../hooks/use-operations-departments";
import { useOperationsOrgTree } from "../hooks/use-operations-organization";
import { useOperationsOpsTeams } from "../hooks/use-operations-ops-teams";
import type {
  CreateOperationsTeamMemberInput,
  OperationsTeamMember,
  OperationsTeamMemberStatus,
} from "../types/operations-team";
import { cn } from "../utils/cn";

const KPI_CARDS: Array<{
  key:
    | "totalMembers"
    | "activeMembers"
    | "inactiveMembers"
    | "totalRoles"
    | "totalDepartments"
    | "pendingInvitations";
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  cardClassName: string;
  accentClassName: string;
  moduleGate?: "team" | "roles" | "departments";
}> = [
  {
    key: "totalMembers",
    label: "Team Members",
    icon: Users,
    iconClassName: "bg-sky-500/20 text-sky-600",
    cardClassName:
      "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white dark:border-sky-500/25 dark:from-sky-500/10 dark:to-surface",
    accentClassName: "text-sky-700 dark:text-sky-300",
    moduleGate: "team",
  },
  {
    key: "activeMembers",
    label: "Active",
    icon: CheckCircle2,
    iconClassName: "bg-success/20 text-success",
    cardClassName:
      "border-success/20 bg-gradient-to-br from-success/10 to-white dark:from-success/15 dark:to-surface",
    accentClassName: "text-success",
    moduleGate: "team",
  },
  {
    key: "inactiveMembers",
    label: "Inactive",
    icon: Ban,
    iconClassName: "bg-danger/20 text-danger",
    cardClassName:
      "border-danger/20 bg-gradient-to-br from-danger/10 to-white dark:from-danger/15 dark:to-surface",
    accentClassName: "text-danger",
    moduleGate: "team",
  },
  {
    key: "totalRoles",
    label: "Custom Roles",
    icon: Shield,
    iconClassName: "bg-blue-500/20 text-blue-600",
    cardClassName:
      "border-blue-200/80 bg-gradient-to-br from-blue-50 to-white dark:border-blue-500/25 dark:from-blue-500/10 dark:to-surface",
    accentClassName: "text-blue-700 dark:text-blue-300",
    moduleGate: "roles",
  },
  {
    key: "totalDepartments",
    label: "Departments",
    icon: Building2,
    iconClassName: "bg-primary/20 text-primary",
    cardClassName:
      "border-primary/20 bg-gradient-to-br from-primary/10 to-white dark:from-primary/15 dark:to-surface",
    accentClassName: "text-primary",
    moduleGate: "departments",
  },
  {
    key: "pendingInvitations",
    label: "Pending Invites",
    icon: UserPlus,
    iconClassName: "bg-violet-500/20 text-violet-600",
    cardClassName:
      "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white dark:border-violet-500/25 dark:from-violet-500/10 dark:to-surface",
    accentClassName: "text-violet-700 dark:text-violet-300",
    moduleGate: "team",
  },
];

type MemberFormState = {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
  roleId: string;
  departmentId: string;
  orgUnitId: string;
  teamId: string;
};

const EMPTY_FORM: MemberFormState = {
  fullName: "",
  email: "",
  mobileNumber: "",
  password: "",
  roleId: "",
  departmentId: "",
  orgUnitId: "",
  teamId: "",
};

type StatusConfirmState = {
  member: OperationsTeamMember;
  nextStatus: OperationsTeamMemberStatus;
};

function memberRoleLabel(member: OperationsTeamMember): string {
  if (member.role === "SUPER_ADMIN") return "Super Admin";
  return member.roleName || member.role || "—";
}

export function OperationsTeamPage() {
  const { user, can, canKey } = useOperationsPermissions();
  const [searchParams] = useSearchParams();
  const departmentIdFromUrl = searchParams.get("departmentId") ?? "";
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [departmentId, setDepartmentId] = useState(departmentIdFromUrl);
  const [orgUnitId, setOrgUnitId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<OperationsTeamMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OperationsTeamMember | null>(
    null,
  );
  const [statusConfirm, setStatusConfirm] = useState<StatusConfirmState | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [form, setForm] = useState<MemberFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [pageFeedback, setPageFeedback] = useState<{
    tone: "success" | "warning" | "danger";
    message: string;
  } | null>(null);

  useEffect(() => {
    setDepartmentId(departmentIdFromUrl);
    setPage(1);
  }, [departmentIdFromUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const overviewQuery = useOperationsTeamOverview();
  const membersQuery = useOperationsTeamMembers({
    page,
    limit,
    search,
    status: status as "" | "active" | "inactive" | "suspended",
    departmentId: departmentId || undefined,
    orgUnitId: orgUnitId || undefined,
    teamId: teamId || undefined,
  });
  const rolesQuery = useOperationsRoles({ status: "active" });
  const departmentsQuery = useOperationsDepartments({ status: "active" });
  const treeQuery = useOperationsOrgTree({ status: "active" });
  const filterTeamsQuery = useOperationsOpsTeams({
    page: 1,
    limit: 100,
    status: "active",
    departmentId: departmentId || undefined,
    orgUnitId: orgUnitId || undefined,
  });
  const formTeamsQuery = useOperationsOpsTeams({
    page: 1,
    limit: 100,
    status: "active",
  });
  const createMutation = useCreateOperationsTeamMember();
  const updateMutation = useUpdateOperationsTeamMember();
  const statusMutation = useUpdateOperationsTeamMemberStatus();
  const resendMutation = useResendOperationsTeamInvitation();
  const deleteMutation = useDeleteOperationsTeamMember();
  const canViewMobile =
    Boolean(user?.isSuperAdmin) ||
    canKey("team.members.fields.mobile.view") ||
    (!(user?.grantedKeys ?? []).some(
      (key) => key === "team" || key.startsWith("team."),
    ) &&
      can("team", "read"));
  const canViewEmail =
    Boolean(user?.isSuperAdmin) ||
    canKey("team.members.fields.email.view") ||
    (!(user?.grantedKeys ?? []).some(
      (key) => key === "team" || key.startsWith("team."),
    ) &&
      can("team", "read"));

  const overview = overviewQuery.data;
  const members = membersQuery.data?.members ?? [];
  const pagination = membersQuery.data?.pagination ?? {
    page,
    limit,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const visibleKpis = useMemo(
    () =>
      KPI_CARDS.filter((item) => {
        if (!item.moduleGate) return true;
        return can(item.moduleGate, "read");
      }),
    [can],
  );

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setDepartmentId(departmentIdFromUrl);
    setOrgUnitId("");
    setTeamId("");
    setPage(1);
  };

  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialog("create");
  };

  const openEdit = (member: OperationsTeamMember) => {
    setSelected(member);
    setForm({
      fullName: member.fullName,
      email: member.email ?? "",
      mobileNumber: member.mobileNumber ?? "",
      password: "",
      roleId: member.roleId ?? "",
      departmentId: member.departmentId ?? "",
      orgUnitId: member.orgUnitId ?? "",
      teamId: member.teamId ?? "",
    });
    setFormError("");
    setDialog("edit");
  };

  const submit = async () => {
    setFormError("");
    try {
      if (dialog === "create") {
        const payload: CreateOperationsTeamMemberInput = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          mobileNumber: form.mobileNumber.trim(),
          roleId: form.roleId,
          departmentId: form.departmentId || null,
          orgUnitId: form.orgUnitId || null,
          teamId: form.teamId || null,
        };
        if (form.password.trim().length >= 8) {
          payload.password = form.password;
        }
        const created = await createMutation.mutateAsync(payload);
        if (created.invitationEmailSent === false) {
          setDialog(null);
          setPageFeedback({
            tone: "warning",
            message:
              created.invitationEmailError ||
              "Person created, but invitation email could not be delivered. Use Resend invitation.",
          });
          return;
        }
        setDialog(null);
        setPageFeedback({
          tone: "success",
          message: "Person created and invitation sent.",
        });
        return;
      } else if (selected) {
        await updateMutation.mutateAsync({
          memberId: selected.id,
          input: {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            ...(canViewMobile
              ? { mobileNumber: form.mobileNumber.trim() }
              : {}),
            password: form.password || undefined,
            roleId: form.roleId || undefined,
            departmentId: form.departmentId || null,
            orgUnitId: form.orgUnitId || null,
            teamId: form.teamId || null,
          },
        });
      }
      setDialog(null);
    } catch (error) {
      setFormError(
        getOperationsApiErrorMessage(error, "Unable to save team member."),
      );
    }
  };

  const busy = createMutation.isPending || updateMutation.isPending;
  const hasActiveFilters =
    Boolean(searchInput.trim()) ||
    Boolean(status) ||
    Boolean(departmentId && departmentId !== departmentIdFromUrl) ||
    Boolean(orgUnitId) ||
    Boolean(teamId);

  return (
    <OperationsLayout title="People" headerVariant="command">
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
              <span className="font-semibold text-foreground">People</span>
            </Link>
            <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground sm:text-[24px]">
              People
            </h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-snug text-muted">
              Manage team members, their roles, departments and access across
              the organization.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <OperationsCan module="team" action="create">
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-[42px] min-w-[130px] items-center justify-center gap-1.5 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
                Add member
              </button>
            </OperationsCan>
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

        {overviewQuery.isError ? (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {getOperationsApiErrorMessage(
              overviewQuery.error,
              "Unable to load team overview.",
            )}
          </p>
        ) : null}

        {visibleKpis.length > 0 ? (
          <div
            className={cn(
              "grid gap-2.5 sm:gap-3",
              visibleKpis.length >= 6
                ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-6"
                : "grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
            )}
          >
            {visibleKpis.map((item) => (
              <PeopleKpiCard
                key={item.key}
                label={item.label}
                value={overview ? overview[item.key] : "—"}
                icon={item.icon}
                iconClassName={item.iconClassName}
                cardClassName={item.cardClassName}
                accentClassName={item.accentClassName}
                loading={overviewQuery.isPending}
              />
            ))}
          </div>
        ) : null}

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
                placeholder={
                  canViewMobile
                    ? "Search name, email or mobile..."
                    : "Search name or email..."
                }
                className="h-10 w-full rounded-lg border border-border-subtle bg-hero-bg/40 pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:shrink-0 xl:items-center">
              <div className="w-full xl:w-[9.5rem]">
                <OperationsFilterSelect
                  label="Member status"
                  value={status}
                  options={[
                    { value: "", label: "All statuses" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "suspended", label: "Suspended" },
                  ]}
                  onChange={(value) => {
                    setPage(1);
                    setStatus(value);
                  }}
                  hideSearch
                  triggerClassName="h-10"
                />
              </div>
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
                    setPage(1);
                    setDepartmentId(value);
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
                    ...flattenOrgTree(treeQuery.data?.roots ?? [])
                      .filter((unit) =>
                        ["region", "state", "city", "office"].includes(
                          unit.type,
                        ),
                      )
                      .map((unit) => ({
                        value: unit.id,
                        label: `${unit.name} · ${unit.type}`,
                      })),
                  ]}
                  onChange={(value) => {
                    setPage(1);
                    setOrgUnitId(value);
                    setTeamId("");
                  }}
                  triggerClassName="h-10"
                />
              </div>
              <div className="w-full xl:w-[11rem]">
                <OperationsFilterSelect
                  label="Team"
                  value={teamId}
                  options={[
                    { value: "", label: "All teams" },
                    ...(filterTeamsQuery.data?.teams ?? []).map((team) => ({
                      value: team.id,
                      label: team.name,
                    })),
                  ]}
                  onChange={(value) => {
                    setPage(1);
                    setTeamId(value);
                  }}
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
              <OperationsCan module="team" action="create">
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-[12px] font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <Plus className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                  Add member
                </button>
              </OperationsCan>
            </div>
          </div>
        </div>

        {pageFeedback ? (
          <p
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              pageFeedback.tone === "success" &&
                "border-success/30 bg-success/10 text-success",
              pageFeedback.tone === "warning" &&
                "border-amber-500/30 bg-amber-500/10 text-amber-800",
              pageFeedback.tone === "danger" &&
                "border-danger/30 bg-danger/10 text-danger",
            )}
            role={pageFeedback.tone === "danger" ? "alert" : "status"}
          >
            {pageFeedback.message}
          </p>
        ) : null}

        {membersQuery.isError ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-danger">
              Unable to load team members.
            </p>
            <p className="mt-1 text-sm text-danger/80">
              {getOperationsApiErrorMessage(
                membersQuery.error,
                "Please try again.",
              )}
            </p>
            <button
              type="button"
              onClick={() => void membersQuery.refetch()}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-danger/30 bg-surface px-4 text-[12px] font-semibold text-danger hover:bg-danger/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Retry
            </button>
          </div>
        ) : membersQuery.isPending ? (
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
        ) : members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-subtle bg-surface px-6 py-16 text-center">
            <p className="text-sm font-semibold text-foreground">
              No team members found
            </p>
            <p className="mt-1 text-sm text-muted">
              {hasActiveFilters
                ? "Try adjusting your search or filters."
                : "Invite your first team member to get started."}
            </p>
            <OperationsCan module="team" action="create">
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
                Add member
              </button>
            </OperationsCan>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <table className="min-w-[78rem] w-full text-left">
              <thead className="border-b border-border-subtle bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  {canViewEmail ? <th className="px-4 py-3">Email</th> : null}
                  {canViewMobile ? <th className="px-4 py-3">Mobile</th> : null}
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      Created
                      <span aria-hidden="true">↓</span>
                    </span>
                  </th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const roleLabel = memberRoleLabel(member);
                  const canEditMember =
                    member.role !== "SUPER_ADMIN" || Boolean(user?.isSuperAdmin);
                  const showResendPrimary =
                    member.role !== "SUPER_ADMIN" &&
                    Boolean(member.email) &&
                    member.lastActiveAt == null &&
                    Boolean(member.invitedAt);

                  return (
                    <tr
                      key={member.id}
                      className="h-[84px] border-b border-border-subtle transition-colors last:border-0 hover:bg-[#F0F9F8]/40"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={cn(
                              "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
                              getAvatarPalette(member.id || member.fullName),
                            )}
                            aria-hidden="true"
                          >
                            {getMemberInitials(member.fullName)}
                          </span>
                          <span className="min-w-0 whitespace-pre-line text-[13px] font-semibold leading-snug text-foreground">
                            {member.fullName}
                          </span>
                        </div>
                      </td>
                      {canViewEmail ? (
                        <td className="px-4 py-3 align-middle text-[13px] text-muted">
                          {member.email || "—"}
                        </td>
                      ) : null}
                      {canViewMobile ? (
                        <td className="px-4 py-3 align-middle text-[13px] text-muted">
                          {member.mobileNumber || "—"}
                        </td>
                      ) : null}
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                            getRoleBadgePalette(roleLabel),
                          )}
                        >
                          {roleLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-[13px] text-muted">
                        {member.departmentName || "—"}
                      </td>
                      <td className="px-4 py-3 align-middle text-[13px] text-muted">
                        {member.teamName || "—"}
                      </td>
                      <td className="px-4 py-3 align-middle text-[13px] text-muted">
                        {member.orgUnitName || "—"}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                            member.status === "active"
                              ? "bg-success/10 text-success"
                              : member.status === "suspended"
                                ? "bg-[#FFF7ED] text-[#C2410C]"
                                : "bg-danger/10 text-danger",
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              member.status === "active"
                                ? "bg-success"
                                : member.status === "suspended"
                                  ? "bg-[#C2410C]"
                                  : "bg-danger",
                            )}
                            aria-hidden="true"
                          />
                          {member.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-pre-line text-[12px] leading-snug text-muted">
                        {formatPeopleTimestamp(member.createdAt)}
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-pre-line text-[12px] leading-snug text-muted">
                        {formatPeopleTimestamp(member.lastActiveAt)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          {showResendPrimary ? (
                            <OperationsCanKey permissionKey="team.members.invite">
                              <button
                                type="button"
                                disabled={resendMutation.isPending}
                                onClick={() => {
                                  setPageFeedback(null);
                                  void resendMutation
                                    .mutateAsync(member.id)
                                    .then((result) => {
                                      if (result.invitationEmailSent === false) {
                                        setPageFeedback({
                                          tone: "warning",
                                          message:
                                            result.invitationEmailError ||
                                            "Invitation regenerated, but the email could not be delivered.",
                                        });
                                        return;
                                      }
                                      setPageFeedback({
                                        tone: "success",
                                        message: `Invitation resent to ${member.fullName}.`,
                                      });
                                    })
                                    .catch((error: unknown) => {
                                      setPageFeedback({
                                        tone: "danger",
                                        message: getOperationsApiErrorMessage(
                                          error,
                                          "Unable to resend invitation.",
                                        ),
                                      });
                                    });
                                }}
                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
                              >
                                <Send className="size-3.5" aria-hidden="true" />
                                Resend invitation
                              </button>
                            </OperationsCanKey>
                          ) : (
                            <OperationsCan module="team" action="update">
                              {canEditMember ? (
                                <button
                                  type="button"
                                  onClick={() => openEdit(member)}
                                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                >
                                  <Pencil
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                  Edit
                                </button>
                              ) : null}
                            </OperationsCan>
                          )}
                          <PeopleMemberRowActions
                            member={member}
                            currentUserId={user?.id}
                            isSuperAdminViewer={user?.isSuperAdmin}
                            showEditInMenu={showResendPrimary && canEditMember}
                            onEdit={openEdit}
                            onActivate={(target) => {
                              setStatusError("");
                              setStatusConfirm({
                                member: target,
                                nextStatus: "active",
                              });
                            }}
                            onDeactivate={(target) => {
                              setStatusError("");
                              setStatusConfirm({
                                member: target,
                                nextStatus: "inactive",
                              });
                            }}
                            onDelete={(target) => {
                              setDeleteError("");
                              setDeleteTarget(target);
                            }}
                          />
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
              ariaLabel="Team members pagination"
            />
          </div>
        ) : null}
      </div>

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-member-dialog-title"
            className="w-full max-w-lg rounded-2xl border border-border-subtle bg-surface p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h2
                id="team-member-dialog-title"
                className="text-base font-bold text-foreground"
              >
                {dialog === "create" ? "Add team member" : "Edit team member"}
              </h2>
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label="Close"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-xs font-semibold text-muted">
                Full name
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-muted">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </label>
              {dialog === "create" || canViewMobile ? (
                <label className="grid gap-1 text-xs font-semibold text-muted">
                  Mobile number
                  <input
                    value={form.mobileNumber}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        mobileNumber: event.target.value,
                      }))
                    }
                    className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </label>
              ) : null}
              <label className="grid gap-1 text-xs font-semibold text-muted">
                {dialog === "create"
                  ? "Password (optional — emailed if left blank)"
                  : "New password (optional)"}
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </label>
              <div className="grid gap-1.5">
                <p className="text-xs font-semibold text-muted">Role</p>
                <OperationsFilterSelect
                  label="Role"
                  value={form.roleId}
                  options={[
                    { value: "", label: "Select a role" },
                    ...(rolesQuery.data?.roles ?? []).map((role) => ({
                      value: role.id,
                      label: role.name,
                    })),
                  ]}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, roleId: value }))
                  }
                  hideSearch={(rolesQuery.data?.roles?.length ?? 0) <= 8}
                  triggerClassName="h-9 rounded-lg text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <p className="text-xs font-semibold text-muted">Department</p>
                <OperationsFilterSelect
                  label="Department"
                  value={form.departmentId}
                  options={[
                    { value: "", label: "None" },
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
                      teamId: "",
                    }))
                  }
                  hideSearch={
                    (departmentsQuery.data?.departments?.length ?? 0) <= 8
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
                    { value: "", label: "None" },
                    ...flattenOrgTree(treeQuery.data?.roots ?? [])
                      .filter((unit) =>
                        ["region", "state", "city", "office"].includes(
                          unit.type,
                        ),
                      )
                      .map((unit) => ({
                        value: unit.id,
                        label: `${unit.name} · ${unit.type}`,
                      })),
                  ]}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      orgUnitId: value,
                      teamId: "",
                    }))
                  }
                  triggerClassName="h-9 rounded-lg text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <p className="text-xs font-semibold text-muted">Team</p>
                <OperationsFilterSelect
                  label="Team"
                  value={form.teamId}
                  options={[
                    { value: "", label: "None" },
                    ...(() => {
                      const teams = formTeamsQuery.data?.teams ?? [];
                      const hasCurrent =
                        Boolean(form.teamId) &&
                        teams.some((team) => team.id === form.teamId);
                      if (
                        form.teamId &&
                        !hasCurrent &&
                        selected?.teamId === form.teamId &&
                        selected.teamName
                      ) {
                        return [
                          {
                            value: form.teamId,
                            label: selected.departmentName
                              ? `${selected.teamName} · ${selected.departmentName}`
                              : selected.teamName,
                          },
                          ...teams.map((team) => ({
                            value: team.id,
                            label: team.departmentName
                              ? `${team.name} · ${team.departmentName}`
                              : team.name,
                          })),
                        ];
                      }
                      return teams.map((team) => ({
                        value: team.id,
                        label: team.departmentName
                          ? `${team.name} · ${team.departmentName}`
                          : team.name,
                      }));
                    })(),
                  ]}
                  onChange={(value) => {
                    const selectedTeam = (
                      formTeamsQuery.data?.teams ?? []
                    ).find((team) => team.id === value);
                    setForm((current) => ({
                      ...current,
                      teamId: value,
                      ...(selectedTeam
                        ? {
                            departmentId: selectedTeam.departmentId,
                            orgUnitId: selectedTeam.orgUnitId,
                          }
                        : {}),
                    }));
                  }}
                  hideSearch={(formTeamsQuery.data?.teams?.length ?? 0) <= 8}
                  triggerClassName="h-9 rounded-lg text-xs"
                />
                {formTeamsQuery.isError ? (
                  <p className="text-[11px] text-danger">
                    {getOperationsApiErrorMessage(
                      formTeamsQuery.error,
                      "Unable to load teams.",
                    )}
                  </p>
                ) : formTeamsQuery.isPending ? (
                  <p className="text-[11px] text-muted">Loading teams…</p>
                ) : (formTeamsQuery.data?.teams.length ?? 0) === 0 ? (
                  <p className="text-[11px] text-muted">
                    No active teams found. Create a team from Organization →
                    Teams.
                  </p>
                ) : null}
              </div>
              {formError ? (
                <p className="text-sm text-danger">{formError}</p>
              ) : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="h-10 rounded-lg border border-border-subtle px-4 text-sm font-semibold text-foreground hover:bg-hero-bg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  busy ||
                  !can("team", dialog === "create" ? "create" : "update")
                }
                onClick={() => void submit()}
                className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {statusConfirm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="status-person-title"
            aria-describedby="status-person-description"
            className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface p-5 shadow-xl"
          >
            <h2
              id="status-person-title"
              className="text-base font-bold text-foreground"
            >
              {statusConfirm.nextStatus === "inactive"
                ? "Deactivate member?"
                : "Activate member?"}
            </h2>
            <p
              id="status-person-description"
              className="mt-2 text-sm text-muted"
            >
              {statusConfirm.nextStatus === "inactive"
                ? `This will prevent ${statusConfirm.member.fullName} from signing in.`
                : `This will allow ${statusConfirm.member.fullName} to sign in again.`}
            </p>
            {statusError ? (
              <p className="mt-3 text-sm text-danger" role="alert">
                {statusError}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={statusMutation.isPending}
                onClick={() => {
                  setStatusConfirm(null);
                  setStatusError("");
                }}
                className="h-10 rounded-lg border border-border-subtle px-4 text-sm font-semibold text-foreground hover:bg-hero-bg disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusMutation.isPending}
                onClick={() => {
                  void statusMutation
                    .mutateAsync({
                      memberId: statusConfirm.member.id,
                      status: statusConfirm.nextStatus,
                    })
                    .then(() => {
                      setStatusConfirm(null);
                      setStatusError("");
                    })
                    .catch((error: unknown) => {
                      setStatusError(
                        getOperationsApiErrorMessage(
                          error,
                          "Unable to update member status.",
                        ),
                      );
                    });
                }}
                className={cn(
                  "h-10 rounded-lg px-4 text-sm font-semibold text-surface disabled:opacity-60",
                  statusConfirm.nextStatus === "inactive"
                    ? "bg-danger hover:opacity-90"
                    : "bg-primary hover:bg-primary-hover",
                )}
              >
                {statusMutation.isPending
                  ? "Updating…"
                  : statusConfirm.nextStatus === "inactive"
                    ? "Deactivate"
                    : "Activate"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-person-title"
            aria-describedby="delete-person-description"
            className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface p-5 shadow-xl"
          >
            <h2
              id="delete-person-title"
              className="text-base font-bold text-foreground"
            >
              Delete person permanently?
            </h2>
            <p
              id="delete-person-description"
              className="mt-2 text-sm text-muted"
            >
              This will completely remove{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget.fullName}
              </span>{" "}
              from the database. Their login will stop working. This cannot be
              undone.
            </p>
            {deleteError ? (
              <p className="mt-3 text-sm text-danger" role="alert">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                className="h-10 rounded-lg border border-border-subtle px-4 text-sm font-semibold text-foreground hover:bg-hero-bg disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  void deleteMutation
                    .mutateAsync(deleteTarget.id)
                    .then(() => {
                      setDeleteTarget(null);
                      setDeleteError("");
                    })
                    .catch((error: unknown) => {
                      setDeleteError(
                        getOperationsApiErrorMessage(
                          error,
                          "Unable to delete this person.",
                        ),
                      );
                    });
                }}
                className="h-10 rounded-lg bg-danger px-4 text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </OperationsLayout>
  );
}
