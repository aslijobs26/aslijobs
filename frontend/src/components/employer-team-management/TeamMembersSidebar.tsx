"use client";

import { EMPLOYER_TEAM_QUERY_KEYS } from "@/constants/employer-team-management";
import {
  fetchDepartments,
  fetchTeamRoles,
  fetchTeamSidebar,
} from "@/services/employer-team.service";
import {
  formatRelativeActivity,
  roleChartColor,
} from "@/utils/employer-team";
import { isAssignableRole } from "@/utils/employer-team-permissions";
import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  Pencil,
  Send,
  Shield,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";

type TeamMembersSidebarProps = {
  onInvite: (prefill?: {
    email?: string;
    roleId?: string;
    departmentId?: string;
  }) => void;
  onOpenRoles: () => void;
};

function activityIcon(type: string) {
  if (type.includes("invitation") || type.includes("invite")) {
    return { Icon: Mail, wrap: "bg-violet-50 text-violet-600" };
  }
  if (type.includes("role")) {
    return { Icon: Shield, wrap: "bg-amber-50 text-amber-600" };
  }
  if (type.includes("login") || type.includes("joined") || type.includes("accepted")) {
    return { Icon: UserCheck, wrap: "bg-primary-light text-primary" };
  }
  if (type.includes("update") || type.includes("changed")) {
    return { Icon: Pencil, wrap: "bg-sky-50 text-sky-600" };
  }
  return { Icon: UserPlus, wrap: "bg-primary-light text-primary" };
}

export function TeamMembersSidebar({
  onInvite,
  onOpenRoles,
}: TeamMembersSidebarProps) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const sidebarQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.sidebar(),
    queryFn: fetchTeamSidebar,
    staleTime: 20_000,
  });

  const rolesQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.roles(),
    queryFn: fetchTeamRoles,
    staleTime: 30_000,
  });

  const departmentsQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.departments({
      status: "active",
      limit: 100,
      page: 1,
    }),
    queryFn: () => fetchDepartments({ status: "active", limit: 100, page: 1 }),
    staleTime: 30_000,
  });

  const slices = sidebarQuery.data?.roleDistribution.slices ?? [];
  const total = sidebarQuery.data?.roleDistribution.total ?? 0;
  const activities = (sidebarQuery.data?.recentActivity ?? []).slice(0, 4);
  const roles = useMemo(
    () =>
      (rolesQuery.data ?? []).filter((role) => isAssignableRole(role.status)),
    [rolesQuery.data],
  );

  const donutGradient = useMemo(() => {
    if (slices.length === 0 || total <= 0) {
      return "conic-gradient(#e2e8f0 0deg 360deg)";
    }
    let cursor = 0;
    const stops: string[] = [];
    slices.forEach((slice, index) => {
      const degrees = (slice.count / total) * 360;
      const color = roleChartColor(slice.roleName, index);
      const start = cursor;
      const end = cursor + degrees;
      stops.push(`${color} ${start}deg ${end}deg`);
      cursor = end;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [slices, total]);

  return (
    <aside className="space-y-4">
      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground">Invite Team Member</h3>
        <p className="mt-1 text-xs text-muted">
          Send an invitation to add new members to your team.
        </p>
        <label className="mt-3 block text-sm">
          <span className="sr-only">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter email address"
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="mt-2 block text-sm">
          <span className="sr-only">Role</span>
          <select
            value={roleId}
            onChange={(event) => setRoleId(event.target.value)}
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select Role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-2 block text-sm">
          <span className="sr-only">Department</span>
          <select
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select Dept</option>
            {(departmentsQuery.data?.departments ?? []).map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            onInvite({
              email: email.trim() || undefined,
              roleId: roleId || undefined,
              departmentId: departmentId || undefined,
            });
            setEmail("");
          }}
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <Send className="size-4" aria-hidden="true" />
          Send Invitation
        </button>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground">Team by Role</h3>
        {sidebarQuery.isLoading ? (
          <div className="mt-4 h-28 animate-pulse rounded-full bg-hero-bg" />
        ) : slices.length === 0 ? (
          <p className="mt-4 text-center text-xs text-muted">
            Role distribution appears after members join.
          </p>
        ) : (
          <div className="mt-4 flex items-center gap-4">
            <div
              className="relative size-[7.25rem] shrink-0 rounded-full"
              style={{ background: donutGradient }}
              aria-hidden="true"
            >
              <div className="absolute inset-[1.35rem] flex flex-col items-center justify-center rounded-full bg-surface">
                <span className="text-lg font-bold tabular-nums text-foreground">
                  {total}
                </span>
                <span className="text-[0.6875rem] font-medium text-muted">
                  Total
                </span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-1.5">
              {slices.map((slice, index) => (
                <li
                  key={slice.roleId}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: roleChartColor(slice.roleName, index),
                      }}
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium text-foreground">
                      {slice.roleName}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted">
                    {slice.count} ({slice.percentage}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          type="button"
          className="mt-3 text-xs font-semibold text-primary hover:underline"
          onClick={onOpenRoles}
        >
          View All Roles →
        </button>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
          <button
            type="button"
            className="text-xs font-semibold text-primary hover:underline"
            onClick={onOpenRoles}
          >
            View All
          </button>
        </div>
        {sidebarQuery.isLoading ? (
          <div className="mt-3 space-y-2">
            <div className="h-10 animate-pulse rounded bg-hero-bg" />
            <div className="h-10 animate-pulse rounded bg-hero-bg" />
          </div>
        ) : activities.length === 0 ? (
          <p className="mt-3 text-xs text-muted">
            Activity will appear as you invite and manage members.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {activities.map((activity) => {
              const { Icon, wrap } = activityIcon(activity.type);
              return (
                <li key={activity.id} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full ${wrap}`}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug text-foreground">
                      {activity.message}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatRelativeActivity(activity.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground">Access Control</h3>
        <p className="mt-1 text-xs text-muted">
          Manage permissions and access levels for your team.
        </p>
        <button
          type="button"
          onClick={onOpenRoles}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-surface px-3 text-sm font-semibold text-primary hover:bg-primary-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <Shield className="size-4" aria-hidden="true" />
          Manage Roles & Permissions
        </button>
      </section>
    </aside>
  );
}
