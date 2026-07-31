"use client";

import {
  ACCESS_LEVEL_LABELS,
  EMPLOYER_TEAM_QUERY_KEYS,
  MEMBER_STATUS_PILL_CLASS,
} from "@/constants/employer-team-management";
import { ROUTES } from "@/constants/routes";
import { fetchTeamMember } from "@/services/employer-team.service";
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

type MemberDetailsPageContentProps = {
  memberId: string;
};

export function MemberDetailsPageContent({
  memberId,
}: MemberDetailsPageContentProps) {
  const memberQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.member(memberId),
    queryFn: () => fetchTeamMember(memberId),
  });

  if (memberQuery.isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="h-8 w-40 animate-pulse rounded bg-hero-bg" />
        <div className="h-40 animate-pulse rounded-xl bg-hero-bg" />
      </div>
    );
  }

  if (memberQuery.isError || !memberQuery.data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="text-base font-semibold text-foreground">
          Member not found
        </p>
        <Link
          href={ROUTES.EMPLOYER_TEAM_MANAGEMENT}
          className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-surface"
        >
          Back to Team Management
        </Link>
      </div>
    );
  }

  const member = memberQuery.data;

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <Link
        href={ROUTES.EMPLOYER_TEAM_MANAGEMENT}
        className="inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 text-sm font-semibold text-foreground hover:bg-primary-light/40"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Link>

      <header className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary">
            {getInitials(member.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                {member.fullName}
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
            <p className="mt-1 text-sm text-muted">{member.email}</p>
            {member.designation ? (
              <p className="mt-1 text-sm text-muted">{member.designation}</p>
            ) : null}
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Department"
            value={member.department?.name ?? "Unassigned"}
          />
          <Stat
            label="Role"
            value={member.role?.name ?? "Unassigned"}
            badgeClass={
              member.role ? roleBadgeClass(member.role.name) : undefined
            }
          />
          <Stat
            label="Access Level"
            value={ACCESS_LEVEL_LABELS[member.accessLevel]}
          />
          <Stat
            label="Last Active"
            value={formatLastActive(member.lastActiveAt)}
          />
        </dl>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-foreground">
            Basic Information
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Phone" value={member.phone || "—"} />
            <Row
              label="Joined"
              value={
                member.joinedAt ? formatDepartmentDate(member.joinedAt) : "—"
              }
            />
            <Row
              label="Accepted"
              value={
                member.acceptedAt
                  ? formatDepartmentDate(member.acceptedAt)
                  : "—"
              }
            />
            <Row
              label="Invitation Status"
              value={member.invitationStatus || "—"}
            />
          </dl>
        </section>

        <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-foreground">
            Invitation History
          </h2>
          {member.invitationHistory.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No invitation history.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {member.invitationHistory.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-border-subtle px-3 py-2 text-sm"
                >
                  <p className="font-semibold capitalize text-foreground">
                    {item.status}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Sent {formatDepartmentDate(item.invitedAt)} · Expires{" "}
                    {formatDepartmentDate(item.expiresAt)}
                    {item.resendCount > 0
                      ? ` · Resent ${item.resendCount}×`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  badgeClass,
}: {
  label: string;
  value: string;
  badgeClass?: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-hero-bg/40 px-3 py-2.5">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-1">
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
          <span className="text-sm font-bold text-foreground">{value}</span>
        )}
      </dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3 last:border-b-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium capitalize text-foreground">
        {value}
      </dd>
    </div>
  );
}

