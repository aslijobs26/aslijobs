import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OrganizationTabs } from "../components/operations/organization/OrganizationTabs";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsCanKey } from "../components/operations/auth/OperationsCanKey";
import { OperationsFilterSelect } from "../components/operations/jobs/OperationsFilterSelect";
import {
  formatOperationsTimestamp,
  getOperationsApiErrorMessage,
} from "../components/operations/team/team-format";
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

const DETAIL_TABS = ["overview", "members", "work", "settings"] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

export function OperationsTeamDetailPage() {
  const { teamId = "" } = useParams();
  const [tab, setTab] = useState<DetailTab>("overview");
  const [addUserId, setAddUserId] = useState("");
  const [leadUserId, setLeadUserId] = useState("");
  const [error, setError] = useState("");

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
      orgUnitId: team?.orgUnitId,
    },
    { enabled: Boolean(team) },
  );
  const addMutation = useAddOperationsOpsTeamMember();
  const removeMutation = useRemoveOperationsOpsTeamMember();
  const updateMutation = useUpdateOperationsOpsTeam();

  const memberIds = useMemo(
    () => new Set((membersQuery.data?.members ?? []).map((member) => member.id)),
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

  return (
    <OperationsLayout
      title={team?.name ?? "Team"}
      subtitle="Operational unit, members, lead and work in this location."
    >
      <div className="flex flex-col gap-4">
        <OrganizationTabs />
        <Link
          to={OPERATIONS_ROUTES.TEAMS}
          className="text-[12px] font-semibold text-primary hover:underline"
        >
          Back to teams
        </Link>

        {teamQuery.isError ? (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {getOperationsApiErrorMessage(teamQuery.error, "Unable to load team.")}
          </p>
        ) : teamQuery.isPending || !team ? (
          <div className="h-48 animate-pulse rounded-xl border border-border-subtle bg-surface" />
        ) : (
          <>
            <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{team.name}</h2>
                  <p className="text-[12px] text-muted">
                    {team.code}
                    {team.departmentName ? ` · ${team.departmentName}` : ""}
                    {team.orgUnitName ? ` · ${team.orgUnitName}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                    team.status === "active"
                      ? "bg-success/10 text-success"
                      : "bg-muted/25 text-muted",
                  )}
                >
                  {team.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted">
                {team.description || "No description."}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
                <div>
                  <dt className="text-muted">Lead</dt>
                  <dd className="font-semibold">{team.leadName || "Unassigned"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Members</dt>
                  <dd className="font-semibold">{team.activeMemberCount}</dd>
                </div>
                <div>
                  <dt className="text-muted">Open work</dt>
                  <dd className="font-semibold">{team.openWorkCount}</dd>
                </div>
                <div>
                  <dt className="text-muted">Updated</dt>
                  <dd className="font-semibold">
                    {formatOperationsTimestamp(team.updatedAt)}
                  </dd>
                </div>
              </dl>
            </section>

            <div
              role="tablist"
              className="flex gap-1 overflow-x-auto border-b border-border-subtle"
            >
              {DETAIL_TABS.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={tab === item}
                  onClick={() => setTab(item)}
                  className={cn(
                    "shrink-0 border-b-2 px-3 py-2 text-[12px] font-medium capitalize",
                    tab === item
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>

            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}

            {tab === "overview" ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Region" value={team.region} />
                  <Info label="State" value={team.state} />
                  <Info label="City" value={team.city} />
                  <Info label="Department" value={team.departmentName} />
                </div>

                {team.capabilities && team.capabilities.length > 0 ? (
                  <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
                    <h3 className="text-[12px] font-semibold text-foreground">
                      Team Capabilities
                    </h3>
                    <ul className="mt-3 flex flex-col gap-2">
                      {team.capabilities.map((capability) => (
                        <li
                          key={capability.workType}
                          className="flex items-start gap-2 rounded-md border border-border-subtle px-3 py-2"
                        >
                          <span
                            className={cn(
                              "mt-0.5 text-[12px] font-bold",
                              capability.available
                                ? "text-success"
                                : "text-danger",
                            )}
                            aria-hidden
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
                  </section>
                ) : null}
              </div>
            ) : null}

            {tab === "members" ? (
              <div className="space-y-3">
                <OperationsCanKey permissionKey="team.teams.members.add">
                  <div className="flex flex-col gap-2 sm:flex-row">
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
                        triggerClassName="h-9"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!addUserId || addMutation.isPending}
                      onClick={() => void addMember()}
                      className="h-9 rounded-lg bg-primary px-3 text-[12px] font-semibold text-surface disabled:opacity-60"
                    >
                      Add member
                    </button>
                  </div>
                </OperationsCanKey>
                <OperationsCanKey permissionKey="team.teams.lead.assign">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="min-w-0 flex-1">
                      <OperationsFilterSelect
                        label="Change lead"
                        value={leadUserId}
                        options={[
                          { value: "", label: "Select lead" },
                          ...(membersQuery.data?.members ?? []).map((member) => ({
                            value: member.id,
                            label: member.fullName,
                          })),
                        ]}
                        onChange={setLeadUserId}
                        triggerClassName="h-9"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!leadUserId || updateMutation.isPending}
                      onClick={() => void changeLead()}
                      className="h-9 rounded-lg border border-border-subtle px-3 text-[12px] font-semibold disabled:opacity-60"
                    >
                      Change lead
                    </button>
                  </div>
                </OperationsCanKey>
                {membersQuery.isPending ? (
                  <div className="h-40 animate-pulse rounded-xl border border-border-subtle" />
                ) : (membersQuery.data?.members.length ?? 0) === 0 ? (
                  <p className="rounded-xl border border-dashed border-border-subtle px-4 py-10 text-center text-sm text-muted">
                    No members assigned to this team yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border-subtle">
                    <table className="min-w-[40rem] text-left text-sm">
                      <thead className="bg-hero-bg/60 text-[11px] uppercase text-muted">
                        <tr>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Role</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Last active</th>
                          <th className="px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(membersQuery.data?.members ?? []).map((member) => (
                          <tr key={member.id} className="border-t border-border-subtle">
                            <td className="px-3 py-2 font-semibold">
                              {member.fullName}
                              {member.isLead ? (
                                <span className="ml-2 text-[10px] uppercase text-primary">
                                  Lead
                                </span>
                              ) : null}
                            </td>
                            <td className="px-3 py-2 text-muted">{member.role}</td>
                            <td className="px-3 py-2 capitalize">{member.status}</td>
                            <td className="px-3 py-2 text-muted">
                              {formatOperationsTimestamp(member.lastActiveAt)}
                            </td>
                            <td className="px-3 py-2">
                              <OperationsCanKey permissionKey="team.teams.members.remove">
                                <button
                                  type="button"
                                  onClick={() => void removeMember(member.id)}
                                  className="text-xs font-semibold text-danger"
                                >
                                  Remove
                                </button>
                              </OperationsCanKey>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}

            {tab === "work" ? (
              workQuery.isPending ? (
                <div className="h-32 animate-pulse rounded-xl border border-border-subtle" />
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {(
                    [
                      ["Open", workQuery.data?.open],
                      ["In progress", workQuery.data?.inProgress],
                      ["Waiting", workQuery.data?.waiting],
                      ["Completed", workQuery.data?.completed],
                      ["Overdue", workQuery.data?.overdue],
                    ] as const
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-border-subtle bg-surface p-3"
                    >
                      <p className="text-[11px] text-muted">{label}</p>
                      <p className="mt-1 text-xl font-bold">
                        {(value ?? 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              )
            ) : null}

            {tab === "settings" ? (
              <p className="text-sm text-muted">
                Team settings are edited from the create/update APIs. Location and
                department cannot be mixed across operational boundaries.
              </p>
            ) : null}
          </>
        )}
      </div>
    </OperationsLayout>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface px-3 py-2">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value || "—"}</p>
    </div>
  );
}
