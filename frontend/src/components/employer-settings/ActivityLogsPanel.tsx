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
          className="inline-flex min-h-8 items-center justify-center rounded-lg border border-border-subtle px-2.5 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-9 sm:px-3 sm:text-sm"
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
              className="h-12 animate-pulse rounded-lg bg-hero-bg sm:h-14"
            />
          ))}
        </div>
      ) : sidebarQuery.isError ? (
        <p className="text-xs text-muted sm:text-sm">
          Unable to load activity. Check Team Management permissions and try
          again.
        </p>
      ) : activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-subtle px-3 py-6 text-center sm:px-4 sm:py-8">
          <Activity
            className="mx-auto size-6 text-muted sm:size-8"
            aria-hidden="true"
          />
          <p className="mt-2.5 text-xs font-semibold text-foreground sm:mt-3 sm:text-sm">
            No recent activity
          </p>
          <p className="mt-1 text-[11px] text-muted sm:text-sm">
            Team invitations, role changes, and member updates will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border-subtle" role="list">
          {activities.map((item) => (
            <li
              key={item.id}
              className="flex gap-2.5 py-2.5 first:pt-0 last:pb-0 sm:gap-3 sm:py-3"
            >
              <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary sm:size-8">
                <Activity className="size-3 sm:size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground sm:text-sm">
                  {item.message}
                </p>
                <p className="mt-0.5 text-[11px] text-muted sm:text-xs">
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
