import { useState } from "react";
import {
  Ban,
  CheckCircle2,
  Plus,
  Shield,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsCan } from "../components/operations/auth/OperationsCan";
import { OperationsCanKey } from "../components/operations/auth/OperationsCanKey";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import {
  formatOperationsTimestamp,
  getOperationsApiErrorMessage,
} from "../components/operations/team/team-format";
import { useOperationsPermissions } from "../hooks/use-operations-permissions";
import {
  useCreateOperationsTeamMember,
  useOperationsTeamMembers,
  useOperationsTeamOverview,
  useUpdateOperationsTeamMember,
  useUpdateOperationsTeamMemberStatus,
} from "../hooks/use-operations-team";
import { useOperationsRoles } from "../hooks/use-operations-roles";
import { useOperationsDepartments } from "../hooks/use-operations-departments";
import type {
  CreateOperationsTeamMemberInput,
  OperationsTeamMember,
} from "../types/operations-team";
import { cn } from "../utils/cn";

const KPI: Array<{
  key:
    | "totalMembers"
    | "activeMembers"
    | "inactiveMembers"
    | "totalRoles"
    | "totalDepartments"
    | "pendingInvitations";
  label: string;
  icon: LucideIcon;
}> = [
  { key: "totalMembers", label: "Team members", icon: Users },
  { key: "activeMembers", label: "Active", icon: CheckCircle2 },
  { key: "inactiveMembers", label: "Inactive", icon: Ban },
  { key: "totalRoles", label: "Custom roles", icon: Shield },
  { key: "totalDepartments", label: "Departments", icon: Users },
  { key: "pendingInvitations", label: "Pending invites", icon: UserPlus },
];

type MemberFormState = {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
  roleId: string;
  departmentId: string;
};

const EMPTY_FORM: MemberFormState = {
  fullName: "",
  email: "",
  mobileNumber: "",
  password: "",
  roleId: "",
  departmentId: "",
};

export function OperationsTeamPage() {
  const { user, can } = useOperationsPermissions();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<OperationsTeamMember | null>(null);
  const [form, setForm] = useState<MemberFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const overviewQuery = useOperationsTeamOverview();
  const membersQuery = useOperationsTeamMembers({
    page,
    limit,
    search,
    status: status as "" | "active" | "inactive" | "suspended",
  });
  const rolesQuery = useOperationsRoles({ status: "active" });
  const departmentsQuery = useOperationsDepartments({ status: "active" });
  const createMutation = useCreateOperationsTeamMember();
  const updateMutation = useUpdateOperationsTeamMember();
  const statusMutation = useUpdateOperationsTeamMemberStatus();

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
      email: member.email,
      mobileNumber: member.mobileNumber,
      password: "",
      roleId: member.roleId ?? "",
      departmentId: member.departmentId ?? "",
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
          password: form.password,
          roleId: form.roleId,
          departmentId: form.departmentId || null,
        };
        await createMutation.mutateAsync(payload);
      } else if (selected) {
        await updateMutation.mutateAsync({
          memberId: selected.id,
          input: {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            mobileNumber: form.mobileNumber.trim(),
            password: form.password || undefined,
            roleId: form.roleId || undefined,
            departmentId: form.departmentId || null,
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

  return (
    <OperationsLayout
      title="Team Management"
      subtitle="Invite members, assign custom roles, and control Operations access."
    >
      <div className="flex flex-col gap-4">
        {overviewQuery.isError ? (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {getOperationsApiErrorMessage(
              overviewQuery.error,
              "Unable to load team overview.",
            )}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {KPI.map((item) => {
            const Icon = item.icon;
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
                  {overview ? overview[item.key] : "—"}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-3 shadow-sm sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Search name, email or mobile"
            className="h-10 min-w-0 flex-1 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <OperationsCan module="team" action="create">
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add member
            </button>
          </OperationsCan>
        </div>

        {membersQuery.isError ? (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {getOperationsApiErrorMessage(
              membersQuery.error,
              "Unable to load team members.",
            )}
          </p>
        ) : membersQuery.isPending ? (
          <div className="h-64 animate-pulse rounded-xl border border-border-subtle bg-surface" />
        ) : members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-subtle bg-surface px-6 py-16 text-center text-sm text-muted">
            No team members match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-hero-bg/60 text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Last active</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {member.fullName}
                    </td>
                    <td className="px-4 py-3 text-muted">{member.email || "—"}</td>
                    <td className="px-4 py-3 text-foreground">
                      {member.role === "SUPER_ADMIN"
                        ? "Super Admin"
                        : member.roleName || member.role}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {member.departmentName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                          member.status === "active"
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger",
                        )}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatOperationsTimestamp(member.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatOperationsTimestamp(member.lastActiveAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <OperationsCan module="team" action="update">
                          {member.role !== "SUPER_ADMIN" || user?.isSuperAdmin ? (
                            <button
                              type="button"
                              onClick={() => openEdit(member)}
                              className="rounded-lg border border-border-subtle px-2 py-1 text-xs font-semibold text-foreground hover:bg-hero-bg"
                            >
                              Edit
                            </button>
                          ) : null}
                        </OperationsCan>
                        <OperationsCanKey permissionKey="team.members.activate">
                          {member.status !== "active" && member.id !== user?.id ? (
                            <button
                              type="button"
                              onClick={() =>
                                void statusMutation.mutateAsync({
                                  memberId: member.id,
                                  status: "active",
                                })
                              }
                              className="rounded-lg border border-success/30 px-2 py-1 text-xs font-semibold text-success hover:bg-success/10"
                            >
                              Activate
                            </button>
                          ) : null}
                        </OperationsCanKey>
                        <OperationsCanKey permissionKey="team.members.deactivate">
                          {member.status === "active" && member.id !== user?.id ? (
                            <button
                              type="button"
                              onClick={() =>
                                void statusMutation.mutateAsync({
                                  memberId: member.id,
                                  status: "inactive",
                                })
                              }
                              className="rounded-lg border border-danger/30 px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/10"
                            >
                              Deactivate
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
            ariaLabel="Team members pagination"
          />
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
            <h2
              id="team-member-dialog-title"
              className="text-base font-bold text-foreground"
            >
              {dialog === "create" ? "Add team member" : "Edit team member"}
            </h2>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-xs font-semibold text-muted">
                Full name
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, fullName: event.target.value }))
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
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </label>
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
              <label className="grid gap-1 text-xs font-semibold text-muted">
                {dialog === "create" ? "Password" : "New password (optional)"}
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-muted">
                Role
                <select
                  value={form.roleId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, roleId: event.target.value }))
                  }
                  className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <option value="">Select a role</option>
                  {(rolesQuery.data?.roles ?? []).map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-muted">
                Department
                <select
                  value={form.departmentId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      departmentId: event.target.value,
                    }))
                  }
                  className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <option value="">None</option>
                  {(departmentsQuery.data?.departments ?? []).map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
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
                disabled={busy || !can("team", dialog === "create" ? "create" : "update")}
                onClick={() => void submit()}
                className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </OperationsLayout>
  );
}
