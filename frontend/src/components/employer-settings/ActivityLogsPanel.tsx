"use client";

import { SettingsSection } from "@/components/employer-settings/SettingsSection";
import { EMPLOYER_TEAM_QUERY_KEYS } from "@/constants/employer-team-management";
import { ROUTES } from "@/constants/routes";
import { fetchTeamSidebar } from "@/services/employer-team.service";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import Link from "next/link";

function formatActivityTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActivityLogsPanel() {
  const sidebarQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.sidebar(),
    queryFn: fetchTeamSidebar,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const activities = sidebarQuery.data?.recentActivity ?? [];

  return (
    <SettingsSection
      title="Activity Logs"
      description="Recent team activity from Team Management. A dedicated full audit-log API is not available yet."
      action={
        <Link
          href={ROUTES.EMPLOYER_TEAM_MANAGEMENT}
          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle px-3 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Team Management
        </Link>
      }
    >
      {sidebarQuery.isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-14 animate-pulse rounded-lg bg-hero-bg"
            />
          ))}
        </div>
      ) : sidebarQuery.isError ? (
        <p className="text-sm text-muted">
          Unable to load activity. Check Team Management permissions and try
          again.
        </p>
      ) : activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-subtle px-4 py-8 text-center">
          <Activity className="mx-auto size-8 text-muted" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            No recent activity
          </p>
          <p className="mt-1 text-sm text-muted">
            Team invitations, role changes, and member updates will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border-subtle" role="list">
          {activities.map((item) => (
            <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                <Activity className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {item.message}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  <span className="capitalize">
                    {item.type.replaceAll("_", " ")}
                  </span>
                  {" · "}
                  {formatActivityTime(item.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SettingsSection>
  );
}
