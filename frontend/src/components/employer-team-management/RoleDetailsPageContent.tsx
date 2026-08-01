"use client";

import { RolePermissionMatrix } from "@/components/employer-team-management/RolePermissionMatrix";
import {
  ACCESS_LEVEL_LABELS,
  ACCESS_LEVEL_PILL_CLASS,
  EMPLOYER_TEAM_QUERY_KEYS,
  ROLE_COLOR_ICON_WRAP,
  ROLE_STATUS_PILL_CLASS,
} from "@/constants/employer-team-management";
import { ROUTES } from "@/constants/routes";
import { fetchRoleDetails } from "@/services/employer-team.service";
import { cn } from "@/utils/cn";
import {
  formatDepartmentDate,
  formatRelativeActivity,
  getInitials,
} from "@/utils/employer-team";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Eye,
  Headphones,
  Settings,
  Shield,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const ICON_MAP: Record<string, LucideIcon> = {
  shield: Shield,
  users: Users,
  briefcase: Briefcase,
  settings: Settings,
  eye: Eye,
  star: Star,
  building: Building2,
  headphones: Headphones,
};

type RoleDetailsPageContentProps = {
  roleId: string;
};

export function RoleDetailsPageContent({ roleId }: RoleDetailsPageContentProps) {
  const detailsQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.roleDetails(roleId),
    queryFn: () => fetchRoleDetails(roleId),
  });

  if (detailsQuery.isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-hero-bg" />
        <div className="h-40 animate-pulse rounded-xl bg-hero-bg" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-48 animate-pulse rounded-xl bg-hero-bg" />
          <div className="h-48 animate-pulse rounded-xl bg-hero-bg" />
        </div>
      </div>
    );
  }

  if (detailsQuery.isError || !detailsQuery.data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="text-base font-semibold text-foreground">Role not found</p>
        <p className="text-sm text-muted">
          This role may have been deleted or you may not have access.
        </p>
        <Link
          href={ROUTES.EMPLOYER_TEAM_MANAGEMENT}
          className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover"
        >
          Back to Team Management
        </Link>
      </div>
    );
  }

  const role = detailsQuery.data;
  const Icon = ICON_MAP[role.icon || "shield"] ?? Shield;
  const colorKey =
    role.color && role.color in ROLE_COLOR_ICON_WRAP ? role.color : "primary";

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.EMPLOYER_TEAM_MANAGEMENT}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Link>
      </div>

      <header className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "inline-flex size-12 shrink-0 items-center justify-center rounded-xl",
                ROLE_COLOR_ICON_WRAP[colorKey],
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                  {role.name}
                </h1>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                    ROLE_STATUS_PILL_CLASS[role.status],
                  )}
                >
                  {role.status}
                </span>
                {role.isSystem ? (
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    System
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                    Custom
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {role.description || "No description provided."}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:min-w-[14rem]">
            <div>
              <dt className="text-xs text-muted">Access Level</dt>
              <dd className="mt-1">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    ACCESS_LEVEL_PILL_CLASS[role.accessLevel],
                  )}
                >
                  {ACCESS_LEVEL_LABELS[role.accessLevel]}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Members</dt>
              <dd className="font-semibold text-foreground">
                {role.memberCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Created</dt>
              <dd className="font-semibold text-foreground">
                {formatDepartmentDate(role.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Updated</dt>
              <dd className="font-semibold text-foreground">
                {formatDepartmentDate(role.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Members</h2>
          <p className="mt-0.5 text-xs text-muted">
            Team members currently assigned to this role
          </p>
          <ul className="mt-3 divide-y divide-border-subtle">
            {role.members.length === 0 ? (
              <li className="py-8 text-center text-sm text-muted">
                No members assigned
              </li>
            ) : (
              role.members.map((member) => (
                <li key={member.id} className="flex items-center gap-3 py-2.5">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                    {getInitials(member.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={ROUTES.employerTeamMember(member.id)}
                      className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {member.fullName}
                    </Link>
                    <p className="truncate text-xs text-muted">
                      {member.email}
                      {member.departmentName
                        ? ` · ${member.departmentName}`
                        : ""}
                    </p>
                  </div>
                  <span className="text-xs capitalize text-muted">
                    {member.status}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Recent Changes</h2>
          <p className="mt-0.5 text-xs text-muted">
            Activity related to this role
          </p>
          <ul className="mt-3 space-y-2.5">
            {role.recentChanges.length === 0 ? (
              <li className="py-8 text-center text-sm text-muted">
                No recent changes
              </li>
            ) : (
              role.recentChanges.map((change) => (
                <li
                  key={change.id}
                  className="rounded-lg border border-border-subtle px-3 py-2"
                >
                  <p className="text-sm text-foreground">{change.message}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatRelativeActivity(change.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
        <h2 className="text-sm font-bold text-foreground">Permission Matrix</h2>
        <p className="mt-0.5 text-xs text-muted">
          Module access configured for this role
        </p>
        <div className="mt-3">
          <RolePermissionMatrix permissions={role.permissions} />
        </div>
      </section>
    </div>
  );
}
