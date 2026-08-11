"use client";

import {
  EMPLOYER_TEAM_STAT_CARDS,
  type TeamStatKey,
} from "@/constants/employer-team-management";
import type { TeamStats } from "@/types/employer-team";
import { cn } from "@/utils/cn";

type TeamManagementStatsCardsProps = {
  stats?: TeamStats;
  isLoading?: boolean;
};

const EMPTY_STATS: Record<TeamStatKey, number> = {
  totalMembers: 0,
  activeMembers: 0,
  roles: 0,
  pendingInvitations: 0,
  departments: 0,
};

export function TeamManagementStatsCards({
  stats,
  isLoading = false,
}: TeamManagementStatsCardsProps) {
  const values: Record<TeamStatKey, number> = {
    totalMembers: stats?.totalMembers ?? 0,
    activeMembers: stats?.activeMembers ?? 0,
    roles: stats?.roles ?? 0,
    pendingInvitations: stats?.pendingInvitations ?? 0,
    departments: stats?.departments ?? 0,
  };

  return (
    <section
      aria-label="Team management statistics"
      className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4"
    >
      {EMPLOYER_TEAM_STAT_CARDS.map((card) => {
        const Icon = card.icon;
        const value = values[card.key];
        const subtitle = card.subtitle(
          value,
          isLoading ? EMPTY_STATS : values,
        );

        return (
          <article
            key={card.key}
            className={cn(
              // Mobile: bordered surface KPI tile (readable on hero-bg pages)
              "flex h-full min-h-[5.25rem] flex-col rounded-xl border border-border-subtle bg-surface px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
              // sm+: horizontal employer stats card
              "sm:min-h-[5.5rem] sm:flex-row sm:items-center sm:gap-3 sm:p-4 sm:shadow-sm",
            )}
          >
            <div
              className={cn(
                "inline-flex size-6 shrink-0 items-center justify-center rounded-lg sm:size-11 sm:rounded-full",
                card.iconWrapClassName,
              )}
              aria-hidden="true"
            >
              <Icon className="size-3 sm:size-5" strokeWidth={2} />
            </div>

            <div className="mt-1.5 flex min-w-0 flex-1 flex-col sm:mt-0">
              <p className="text-[10px] font-medium leading-tight text-muted sm:text-sm">
                {card.label}
              </p>

              {isLoading ? (
                <div
                  className="mt-auto h-5 w-9 animate-pulse rounded bg-border-subtle/80 sm:mt-1 sm:h-7 sm:w-12"
                  aria-hidden="true"
                />
              ) : (
                <p className="mt-auto pt-1 text-lg font-bold tabular-nums leading-none tracking-tight text-foreground sm:mt-0.5 sm:pt-0 sm:text-2xl sm:leading-tight">
                  {value}
                </p>
              )}

              <p className="mt-0.5 hidden text-xs text-muted sm:block">
                {subtitle}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
