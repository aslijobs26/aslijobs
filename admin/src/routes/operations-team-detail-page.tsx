import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  PauseCircle,
  Plus,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { OrganizationTabs } from "../components/operations/organization/OrganizationTabs";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsCanKey } from "../components/operations/auth/OperationsCanKey";
import { OperationsFilterSelect } from "../components/operations/jobs/OperationsFilterSelect";
import {
  formatPeopleTimestamp,
  getAvatarPalette,
  getMemberInitials,
  getRoleBadgePalette,
  PeopleKpiCard,
} from "../components/operations/team/people-ui";
import { getOperationsApiErrorMessage } from "../components/operations/team/team-format";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import {
  useAddOperationsOpsTeamMember,
  useOperationsOpsTeam,
  useOperationsOpsTeamMembers,
  useOperationsOpsTeamWorkSummary,
  useRemoveOperationsOpsTeamMember,
  useUpdateOperationsOpsTeam,
} from "../hooks/use-operations-ops-teams";
import { useOperationsTeamMembers } from "../hooks/use-operations-team";
import { cn } from "../utils/cn";

const DETAIL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
  { id: "work", label: "Work" },
  { id: "settings", label: "Settings" },
] as const;

type DetailTab = (typeof DETAIL_TABS)[number]["id"];

const WORK_KPI: Array<{
  key: "open" | "inProgress" | "waiting" | "completed" | "overdue";
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  cardClassName: string;
  accentClassName: string;
}> = [
  {
    key: "open",
    label: "Open",
    icon: Briefcase,
    iconClassName: "bg-sky-500/20 text-sky-600",
    cardClassName:
      "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white dark:border-sky-500/25 dark:from-sky-500/10 dark:to-surface",
    accentClassName: "text-sky-700 dark:text-sky-300",
  },
  {
    key: "inProgress",
    label: "In Progress",
    icon: Clock,
    iconClassName: "bg-blue-500/20 text-blue-600",
    cardClassName:
      "border-blue-200/80 bg-gradient-to-br from-blue-50 to-white dark:border-blue-500/25 dark:from-blue-500/10 dark:to-surface",
    accentClassName: "text-blue-700 dark:text-blue-300",
  },
  {
    key: "waiting",
    label: "Waiting",
    icon: PauseCircle,
    iconClassName: "bg-[#FFF1E6] text-[#C2410C]",
    cardClassName:
      "border-orange-200/80 bg-gradient-to-br from-orange-50 to-white dark:border-orange-500/25 dark:from-orange-500/10 dark:to-surface",
    accentClassName: "text-[#C2410C]",
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
    iconClassName: "bg-success/20 text-success",
    cardClassName:
      "border-success/20 bg-gradient-to-br from-success/10 to-white dark:from-success/15 dark:to-surface",
    accentClassName: "text-success",
  },
  {
    key: "overdue",
    label: "Overdue",
    icon: AlertTriangle,
    iconClassName: "bg-danger/20 text-danger",
    cardClassName:
      "border-danger/20 bg-gradient-to-br from-danger/10 to-white dark:from-danger/15 dark:to-surface",
    accentClassName: "text-danger",
  },
];

type SettingsFormState = {
  name: string;
  code: string;
  description: string;
};

export function OperationsTeamDetailPage() {
  const { teamId = "" } = useParams();
  const [tab, setTab] = useState<DetailTab>("overview");
  const [addUserId, setAddUserId] = useState("");
  const [leadUserId, setLeadUserId] = useState("");
  const [error, setError] = useState("");
  const [settingsForm, setSettingsForm] = useState<SettingsFormState>({
    name: "",
    code: "",
    description: "",
  });
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  const teamQuery = useOperationsOpsTeam(teamId);
  const membersQuery = useOperationsOpsTeamMembers(teamId, {
    page: 1,
    limit: 50,
    status: "all",
  });
  const workQuery = useOperationsOpsTeamWorkSummary(teamId);
  const team = teamQuery.data;
  const candidatesQuery = useOperationsTeamMembers(
    {
      page: 1,
      limit: 100,
      status: "active",
      departmentId: team?.departmentId,
    },
    { enabled: Boolean(team) },
  );
  const addMutation = useAddOperationsOpsTeamMember();
  const removeMutation = useRemoveOperationsOpsTeamMember();
  const updateMutation = useUpdateOperationsOpsTeam();

  useEffect(() => {
    if (!team) return;
    setSettingsForm({
      name: team.name,
      code: team.code,
      description: team.description ?? "",
    });
  }, [team]);

  const memberIds = useMemo(
    () =>
      new Set((membersQuery.data?.members ?? []).map((member) => member.id)),
    [membersQuery.data?.members],
  );
  const addable = (candidatesQuery.data?.members ?? []).filter(
    (member) => !memberIds.has(member.id),
  );

  const addMember = async () => {
    if (!team || !addUserId) return;
    setError("");
    try {
      await addMutation.mutateAsync({
        teamId: team.id,
        userId: addUserId,
        expectedRevision: team.revision,
      });
      setAddUserId("");
    } catch (caught) {
      setError(getOperationsApiErrorMessage(caught, "Unable to add member."));
    }
  };

  const removeMember = async (memberId: string) => {
    if (!team) return;
    setError("");
    try {
      await removeMutation.mutateAsync({
        teamId: team.id,
        memberId,
        expectedRevision: team.revision,
      });
    } catch (caught) {
      setError(getOperationsApiErrorMessage(caught, "Unable to remove member."));
    }
  };

  const changeLead = async () => {
    if (!team || !leadUserId) return;
    setError("");
    try {
      await updateMutation.mutateAsync({
        teamId: team.id,
        input: {
          leadUserId,
          expectedRevision: team.revision,
        },
      });
      setLeadUserId("");
    } catch (caught) {
      setError(getOperationsApiErrorMessage(caught, "Unable to change lead."));
    }
  };

  const saveSettings = async () => {
    if (!team) return;
    setSettingsError("");
    setSettingsSuccess("");
    try {
      await updateMutation.mutateAsync({
        teamId: team.id,
        input: {
          name: settingsForm.name.trim(),
          code: settingsForm.code.trim(),
          description: settingsForm.description.trim(),
          expectedRevision: team.revision,
        },
      });
      setSettingsSuccess("Team settings saved.");
    } catch (caught) {
      setSettingsError(
        getOperationsApiErrorMessage(caught, "Unable to save team settings."),
      );
    }
  };

  const isActive = team?.status === "active";

  return (
    <OperationsLayout
      title={team?.name ?? "Team"}
      headerVariant="command"
    >
      <div className="flex flex-col gap-4 lg:gap-5">
        <div className="min-w-0">
          <Link
            to={OPERATIONS_ROUTES.TEAMS}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Teams
            {team ? (
              <>
                <span className="text-muted/70" aria-hidden="true">
                  ›
                </span>
                <span className="font-semibold text-foreground">{team.name}</span>
              </>
            ) : null}
          </Link>
          <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground sm:text-[24px]">
            {team?.name ?? "Team"}
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-snug text-muted">
            Operational unit, members, lead and work in this location.
          </p>
        </div>

        <OrganizationTabs />

        {teamQuery.isError ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-danger">
              Unable to load team.
            </p>
            <p className="mt-1 text-sm text-danger/80">
              {getOperationsApiErrorMessage(
                teamQuery.error,
                "Please try again.",
              )}
            </p>
            <button
              type="button"
              onClick={() => void teamQuery.refetch()}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-danger/30 bg-surface px-4 text-[12px] font-semibold text-danger hover:bg-danger/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Retry
            </button>
          </div>
        ) : teamQuery.isPending || !team ? (
          <div className="space-y-3">
            <div className="h-36 animate-pulse rounded-xl border border-border-subtle bg-surface" />
            <div className="h-10 animate-pulse rounded-xl border border-border-subtle bg-surface" />
            <div className="h-48 animate-pulse rounded-xl border border-border-subtle bg-surface" />
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      "inline-flex size-12 shrink-0 items-center justify-center rounded-xl text-[14px] font-semibold",
                      getAvatarPalette(team.id || team.name),
                    )}
                    aria-hidden="true"
                  >
                    {getMemberInitials(team.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
                        {team.name}
                      </h2>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
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
                    </div>
                    <p className="mt-1 text-[12px] text-muted">
                      {team.code}
                      {team.departmentName ? ` · ${team.departmentName}` : ""}
                      {team.orgUnitName ? ` · ${team.orgUnitName}` : ""}
                    </p>
                    <p className="mt-2 text-[13px] leading-snug text-muted">
                      {team.description || "No description."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <SummaryStat
                  label="Lead"
                  value={team.leadName || "Unassigned"}
                  icon={UserPlus}
                  iconClassName="bg-violet-500/20 text-violet-600"
                />
                <SummaryStat
                  label="Members"
                  value={team.activeMemberCount.toLocaleString("en-IN")}
                  icon={Users}
                  iconClassName="bg-sky-500/20 text-sky-600"
                />
                <SummaryStat
                  label="Open work"
                  value={team.openWorkCount.toLocaleString("en-IN")}
                  icon={Briefcase}
                  iconClassName="bg-primary/20 text-primary"
                />
                <SummaryStat
                  label="Updated"
                  value={formatPeopleTimestamp(team.updatedAt).replace(
                    "\n",
                    " ",
                  )}
                  icon={Clock}
                  iconClassName="bg-blue-500/20 text-blue-600"
                />
              </div>
            </section>

            <div
              role="tablist"
              aria-label="Team sections"
              className="flex gap-1 overflow-x-auto border-b border-border-subtle scrollbar-hidden"
            >
              {DETAIL_TABS.map((item) => {
                const selected = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "shrink-0 border-b-2 px-3 py-2.5 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      selected
                        ? "border-primary font-semibold text-foreground"
                        : "border-transparent font-medium text-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {error ? (
              <p
                className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {tab === "overview" ? (
              <div className="flex flex-col gap-4">
                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                  <InfoCard
                    label="Region"
                    value={team.region}
                    icon={MapPin}
                    iconClassName="bg-blue-500/20 text-blue-600"
                  />
                  <InfoCard
                    label="State"
                    value={team.state}
                    icon={MapPin}
                    iconClassName="bg-sky-500/20 text-sky-600"
                  />
                  <InfoCard
                    label="City"
                    value={team.city}
                    icon={MapPin}
                    iconClassName="bg-primary/20 text-primary"
                  />
                  <InfoCard
                    label="Department"
                    value={team.departmentName}
                    icon={Building2}
                    iconClassName="bg-violet-500/20 text-violet-600"
                  />
                </div>

                <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
                  <h3 className="text-[13px] font-semibold text-foreground">
                    Team capabilities
                  </h3>
                  <p className="mt-1 text-[12px] text-muted">
                    Work types this team can handle based on active member
                    roles.
                  </p>
                  {team.capabilities && team.capabilities.length > 0 ? (
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {team.capabilities.map((capability) => (
                        <li
                          key={capability.workType}
                          className="flex items-start gap-2.5 rounded-lg border border-border-subtle bg-hero-bg/30 px-3 py-2.5"
                        >
                          <span
                            className={cn(
                              "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                              capability.available
                                ? "bg-success/15 text-success"
                                : "bg-danger/15 text-danger",
                            )}
                            aria-hidden="true"
                          >
                            {capability.available ? "✓" : "✗"}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-foreground">
                              {capability.moduleLabel}
                            </p>
                            <p className="text-[11px] text-muted">
                              {capability.capabilityLabel}
                            </p>
                          </div>
                          <span className="sr-only">
                            {capability.available
                              ? "Supported"
                              : "Not supported"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 rounded-lg border border-dashed border-border-subtle px-4 py-8 text-center text-[13px] text-muted">
                      No capability data yet. Add active members to this team.
                    </p>
                  )}
                </section>
              </div>
            ) : null}

            {tab === "members" ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-border-subtle bg-surface p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-3.5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                    <OperationsCanKey permissionKey="team.teams.members.add">
                      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="min-w-0 flex-1">
                          <OperationsFilterSelect
                            label="Add member"
                            value={addUserId}
                            options={[
                              { value: "", label: "Select a member" },
                              ...addable.map((member) => ({
                                value: member.id,
                                label: member.fullName,
                              })),
                            ]}
                            onChange={setAddUserId}
                            triggerClassName="h-10"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={!addUserId || addMutation.isPending}
                          onClick={() => void addMember()}
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-[12px] font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
                        >
                          <Plus
                            className="size-3.5"
                            strokeWidth={2.5}
                            aria-hidden="true"
                          />
                          {addMutation.isPending ? "Adding…" : "Add member"}
                        </button>
                      </div>
                    </OperationsCanKey>
                    <OperationsCanKey permissionKey="team.teams.lead.assign">
                      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="min-w-0 flex-1">
                          <OperationsFilterSelect
                            label="Change lead"
                            value={leadUserId}
                            options={[
                              { value: "", label: "Select lead" },
                              ...(membersQuery.data?.members ?? []).map(
                                (member) => ({
                                  value: member.id,
                                  label: member.fullName,
                                }),
                              ),
                            ]}
                            onChange={setLeadUserId}
                            triggerClassName="h-10"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={!leadUserId || updateMutation.isPending}
                          onClick={() => void changeLead()}
                          className="inline-flex h-10 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
                        >
                          {updateMutation.isPending
                            ? "Updating…"
                            : "Change lead"}
                        </button>
                      </div>
                    </OperationsCanKey>
                  </div>
                </div>

                {membersQuery.isPending ? (
                  <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex h-[72px] items-center gap-4 border-b border-border-subtle px-4 last:border-0"
                      >
                        <div className="size-9 animate-pulse rounded-full bg-hero-bg" />
                        <div className="h-4 w-28 animate-pulse rounded bg-hero-bg" />
                      </div>
                    ))}
                  </div>
                ) : (membersQuery.data?.members.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-dashed border-border-subtle bg-surface px-6 py-16 text-center">
                    <p className="text-sm font-semibold text-foreground">
                      No members found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Assign people to this team to start routing work.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <table className="min-w-[44rem] w-full text-left">
                      <thead className="border-b border-border-subtle bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
                        <tr>
                          <th className="px-4 py-3">Member</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Last Active</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(membersQuery.data?.members ?? []).map((member) => {
                          const roleLabel =
                            member.roleName || member.role || "—";
                          return (
                            <tr
                              key={member.id}
                              className="h-[72px] border-b border-border-subtle transition-colors last:border-0 hover:bg-[#F0F9F8]/40"
                            >
                              <td className="px-4 py-3 align-middle">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <span
                                    className={cn(
                                      "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
                                      getAvatarPalette(
                                        member.id || member.fullName,
                                      ),
                                    )}
                                    aria-hidden="true"
                                  >
                                    {getMemberInitials(member.fullName)}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-foreground">
                                      {member.fullName}
                                    </p>
                                    {member.isLead ? (
                                      <span className="mt-0.5 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                        Lead
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
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
                              <td className="px-4 py-3 align-middle">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                                    member.status === "active"
                                      ? "bg-success/10 text-success"
                                      : "bg-danger/10 text-danger",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "size-1.5 rounded-full",
                                      member.status === "active"
                                        ? "bg-success"
                                        : "bg-danger",
                                    )}
                                    aria-hidden="true"
                                  />
                                  {member.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 align-middle whitespace-pre-line text-[12px] leading-snug text-muted">
                                {formatPeopleTimestamp(member.lastActiveAt)}
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <OperationsCanKey permissionKey="team.teams.members.remove">
                                  <button
                                    type="button"
                                    onClick={() => void removeMember(member.id)}
                                    disabled={removeMutation.isPending}
                                    className="text-[12px] font-semibold text-danger transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
                                  >
                                    Remove
                                  </button>
                                </OperationsCanKey>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}

            {tab === "work" ? (
              workQuery.isPending ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[104px] animate-pulse rounded-xl border border-border-subtle bg-surface"
                    />
                  ))}
                </div>
              ) : workQuery.isError ? (
                <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-danger">
                    Unable to load work summary.
                  </p>
                  <button
                    type="button"
                    onClick={() => void workQuery.refetch()}
                    className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-danger/30 bg-surface px-4 text-[12px] font-semibold text-danger"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
                  {WORK_KPI.map((item) => (
                    <PeopleKpiCard
                      key={item.key}
                      label={item.label}
                      value={workQuery.data?.[item.key] ?? 0}
                      icon={item.icon}
                      iconClassName={item.iconClassName}
                      cardClassName={item.cardClassName}
                      accentClassName={item.accentClassName}
                    />
                  ))}
                </div>
              )
            ) : null}

            {tab === "settings" ? (
              <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
                <h3 className="text-[13px] font-semibold text-foreground">
                  Team settings
                </h3>
                <p className="mt-1 text-[12px] text-muted">
                  Update team identity. Department and location stay bound to
                  operational boundaries.
                </p>
                <div className="mt-4 grid max-w-xl gap-3">
                  <label className="grid gap-1 text-xs font-semibold text-muted">
                    Team name
                    <input
                      value={settingsForm.name}
                      onChange={(event) =>
                        setSettingsForm((current) => ({
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
                      value={settingsForm.code}
                      onChange={(event) =>
                        setSettingsForm((current) => ({
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
                      value={settingsForm.description}
                      onChange={(event) =>
                        setSettingsForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      rows={3}
                      className="rounded-lg border border-border-subtle bg-hero-bg/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                  </label>
                  <div className="grid gap-2 rounded-lg border border-border-subtle bg-hero-bg/30 px-3 py-2.5 text-[12px]">
                    <p className="text-muted">
                      Department:{" "}
                      <span className="font-semibold text-foreground">
                        {team.departmentName || "—"}
                      </span>
                    </p>
                    <p className="text-muted">
                      Location:{" "}
                      <span className="font-semibold text-foreground">
                        {team.orgUnitName || "—"}
                      </span>
                    </p>
                  </div>
                  {settingsError ? (
                    <p className="text-sm text-danger" role="alert">
                      {settingsError}
                    </p>
                  ) : null}
                  {settingsSuccess ? (
                    <p className="text-sm text-success" role="status">
                      {settingsSuccess}
                    </p>
                  ) : null}
                  <OperationsCanKey permissionKey="team.teams.update">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={
                          updateMutation.isPending ||
                          !settingsForm.name.trim() ||
                          !settingsForm.code.trim()
                        }
                        onClick={() => void saveSettings()}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
                      >
                        {updateMutation.isPending ? "Saving…" : "Save settings"}
                      </button>
                    </div>
                  </OperationsCanKey>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </OperationsLayout>
  );
}

function SummaryStat({
  label,
  value,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-hero-bg/30 p-3">
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
            iconClassName,
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
            {label}
          </p>
          <p className="mt-1 truncate text-[13px] font-semibold text-foreground">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string | null;
  icon: LucideIcon;
  iconClassName: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
            iconClassName,
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
            {label}
          </p>
          <p className="mt-1 text-[14px] font-semibold text-foreground">
            {value || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
