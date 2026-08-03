"use client";

import {
  ACCESS_LEVEL_LABELS,
  EMPLOYER_TEAM_QUERY_KEYS,
  MEMBER_STATUS_PILL_CLASS,
} from "@/constants/employer-team-management";
import { ROUTES } from "@/constants/routes";
import { usePermissionContext } from "@/providers/employer-permission-provider";
import { fetchTeamMemberMe } from "@/services/employer-team.service";
import { cn } from "@/utils/cn";
import {
  formatDepartmentDate,
  formatLastActive,
  getInitials,
  roleBadgeClass,
} from "@/utils/employer-team";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Read-only My Profile for the authenticated team member.
 * Data always comes from GET /team/members/me (session), never from a URL ID.
 */
export function TeamMemberMyProfilePageContent() {
  const router = useRouter();
  const { session, isLoading: sessionLoading } = usePermissionContext();

  const isTeamMember = session?.principalType === "member";

  useEffect(() => {
    if (sessionLoading || !session) {
      return;
    }
    if (session.principalType !== "member") {
      router.replace(ROUTES.EMPLOYER_COMPANY_PROFILE);
    }
  }, [router, session, sessionLoading]);

  const profileQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.memberMe(),
    queryFn: fetchTeamMemberMe,
    enabled: isTeamMember,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (sessionLoading || !isTeamMember) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <p className="text-sm text-muted">Loading profile...</p>
      </div>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="h-8 w-40 animate-pulse rounded bg-hero-bg" />
        <div className="h-40 animate-pulse rounded-xl bg-hero-bg" />
        <div className="h-56 animate-pulse rounded-xl bg-hero-bg" />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="text-base font-semibold text-foreground">
          Unable to load your profile
        </p>
        <Link
          href={ROUTES.EMPLOYER_DASHBOARD}
          className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-surface"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const member = profileQuery.data;
  const companyName =
    member.companyName.trim() ||
    session.actor?.companyName.trim() ||
    "Organization";

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <Link
        href={ROUTES.EMPLOYER_DASHBOARD}
        className="inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 text-sm font-semibold text-foreground hover:bg-primary-light/40"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Link>

      <header className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span
            className="inline-flex size-14 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary"
            aria-hidden="true"
          >
            {getInitials(member.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                My Profile
              </h1>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                  MEMBER_STATUS_PILL_CLASS[member.status],
                )}
              >
                {member.status}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {member.fullName}
            </p>
            <p className="mt-0.5 text-sm text-muted">{companyName}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-foreground">
            Basic Information
          </h2>
          <div className="mt-4 flex items-center gap-3 border-b border-border-subtle pb-3">
            <span
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary"
              aria-hidden="true"
            >
              {getInitials(member.fullName)}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted">Profile Photo</p>
              <p className="text-sm font-medium text-foreground">
                Initials avatar
              </p>
            </div>
          </div>
          <dl className="mt-3 space-y-3 text-sm">
            <Row label="Full Name" value={member.fullName} />
            <Row label="Email" value={member.email} />
            <Row label="Phone" value={member.phone || "—"} />
            <Row label="Designation" value={member.designation || "—"} />
          </dl>
        </section>

        <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-foreground">Organization</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Company Name" value={companyName} />
            <Row
              label="Department"
              value={member.department?.name ?? "Unassigned"}
            />
            <Row
              label="Role"
              value={member.role?.name ?? "Unassigned"}
              badgeClass={
                member.role ? roleBadgeClass(member.role.name) : undefined
              }
            />
            <Row
              label="Access Level"
              value={ACCESS_LEVEL_LABELS[member.accessLevel]}
            />
            <Row label="Status" value={member.status} capitalize />
            <Row
              label="Joined Date"
              value={
                member.joinedAt ? formatDepartmentDate(member.joinedAt) : "—"
              }
            />
          </dl>
        </section>

        <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5 lg:col-span-2">
          <h2 className="text-base font-bold text-foreground">Account</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
            <Row
              label="Last Login"
              value={formatLastActive(member.lastActiveAt)}
            />
            <Row
              label="Invitation Accepted Date"
              value={
                member.acceptedAt
                  ? formatDepartmentDate(member.acceptedAt)
                  : "—"
              }
            />
            <Row label="Created By" value={member.createdByLabel || "—"} />
          </dl>
        </section>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  badgeClass,
  capitalize = false,
}: {
  label: string;
  value: string;
  badgeClass?: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3 last:border-b-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd
        className={cn(
          "text-right font-medium text-foreground",
          capitalize && "capitalize",
        )}
      >
        {badgeClass ? (
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
              badgeClass,
            )}
          >
            {value}
          </span>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
