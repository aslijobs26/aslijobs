"use client";

import {
  DEPARTMENT_COLOR_ICON_WRAP,
  DEPARTMENT_STATUS_PILL_CLASS,
  EMPLOYER_TEAM_QUERY_KEYS,
} from "@/constants/employer-team-management";
import { ROUTES } from "@/constants/routes";
import { fetchDepartmentDetails } from "@/services/employer-team.service";
import { cn } from "@/utils/cn";
import {
  formatDepartmentDate,
  getInitials,
} from "@/utils/employer-team";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";

type DepartmentDetailsPageContentProps = {
  departmentId: string;
};

export function DepartmentDetailsPageContent({
  departmentId,
}: DepartmentDetailsPageContentProps) {
  const detailsQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.departmentDetails(departmentId),
    queryFn: () => fetchDepartmentDetails(departmentId),
  });

  if (detailsQuery.isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-hero-bg" />
        <div className="h-40 animate-pulse rounded-xl bg-hero-bg" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-32 animate-pulse rounded-xl bg-hero-bg" />
          <div className="h-32 animate-pulse rounded-xl bg-hero-bg" />
          <div className="h-32 animate-pulse rounded-xl bg-hero-bg" />
        </div>
      </div>
    );
  }

  if (detailsQuery.isError || !detailsQuery.data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="text-base font-semibold text-foreground">
          Department not found
        </p>
        <p className="text-sm text-muted">
          This department may have been deleted or you may not have access.
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

  const department = detailsQuery.data;
  const colorKey =
    department.color && department.color in DEPARTMENT_COLOR_ICON_WRAP
      ? department.color
      : "primary";

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
                DEPARTMENT_COLOR_ICON_WRAP[colorKey],
              )}
            >
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                  {department.name}
                </h1>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                    DEPARTMENT_STATUS_PILL_CLASS[department.status],
                  )}
                >
                  {department.status}
                </span>
              </div>
              {department.code ? (
                <p className="mt-1 text-sm text-muted">Code: {department.code}</p>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {department.description || "No description provided."}
              </p>
            </div>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailStat label="Members" value={String(department.memberCount)} />
          <DetailStat
            label="Active Members"
            value={String(department.activeMemberCount)}
          />
          <DetailStat
            label="Pending Invitations"
            value={String(department.pendingInvitationCount)}
          />
          <DetailStat
            label="Created"
            value={formatDepartmentDate(department.createdAt)}
          />
        </dl>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-foreground">
            Department Information
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <InfoRow label="Email" value={department.email || "—"} />
            <InfoRow label="Phone" value={department.phone || "—"} />
            <InfoRow
              label="Updated"
              value={formatDepartmentDate(department.updatedAt)}
            />
            <div>
              <dt className="text-muted">Department Head</dt>
              <dd className="mt-1.5">
                {department.head ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary-light text-[0.6875rem] font-bold text-primary">
                      {getInitials(department.head.fullName)}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">
                        {department.head.fullName}
                      </p>
                      <p className="text-xs text-muted">
                        {department.head.email || "Active member"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="font-medium text-muted">No Head Assigned</p>
                )}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-hero-bg/40 px-3 py-2.5">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-bold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3 last:border-b-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
