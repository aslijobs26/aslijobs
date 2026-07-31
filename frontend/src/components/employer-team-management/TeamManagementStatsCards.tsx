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
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {EMPLOYER_TEAM_STAT_CARDS.map((card) => {
        const Icon = card.icon;
        const value = values[card.key];

        return (
          <article
            key={card.key}
            className="flex min-h-[5.5rem] items-center gap-3 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm"
          >
            <div
              className={cn(
                "inline-flex size-11 shrink-0 items-center justify-center rounded-full",
                card.iconWrapClassName,
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted">{card.label}</p>
              {isLoading ? (
                <div className="mt-1 h-7 w-12 animate-pulse rounded bg-hero-bg" />
              ) : (
                <p className="mt-0.5 text-2xl font-bold tabular-nums leading-tight text-foreground">
                  {value}
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted">
                {card.subtitle(value, isLoading ? EMPTY_STATS : values)}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
