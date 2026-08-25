"use client";

import { SkeletonKpiValue } from "@/components/shared/skeletons/SkeletonBone";
import { cn } from "@/utils/cn";
import {
  Briefcase,
  CalendarDays,
  MessageSquare,
  MessagesSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MessagesStatCard = {
  id: string;
  title: string;
  description: string;
  value: number | null;
  icon: LucideIcon;
  iconClassName: string;
};

type MessagesStatsCardsProps = {
  totalConversations: number | null;
  unreadConversations: number | null;
  /** Optional KPI counts derived from the loaded conversation page / filters. */
  activeHiringConversations?: number | null;
  interviewWeekConversations?: number | null;
  isLoading?: boolean;
};

/**
 * Stats strip for Messages. Does not issue extra API probes — values come from
 * the parent conversation query (and optional derived counts) to avoid burning
 * the shared rate-limit budget.
 */
export function MessagesStatsCards({
  totalConversations,
  unreadConversations,
  activeHiringConversations = null,
  interviewWeekConversations = null,
  isLoading = false,
}: MessagesStatsCardsProps) {
  const cards: MessagesStatCard[] = [
    {
      id: "total",
      title: "Total Conversations",
      description: "All time",
      value: totalConversations,
      icon: MessagesSquare,
      iconClassName: "bg-primary-light text-primary",
    },
    {
      id: "unread",
      title: "Unread Conversations",
      description: "Needs your attention",
      value: unreadConversations,
      icon: MessageSquare,
      iconClassName: "bg-benefit-voice-surface text-benefit-voice-icon",
    },
    {
      id: "active",
      title: "Active Hiring",
      description: "In progress",
      value: activeHiringConversations,
      icon: Briefcase,
      iconClassName: "bg-primary-soft/20 text-primary",
    },
    {
      id: "interview",
      title: "Interviews (7d)",
      description: "This week",
      value: interviewWeekConversations,
      icon: CalendarDays,
      iconClassName: "bg-hero-bg text-muted",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.id}
            className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm sm:p-4"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold leading-tight text-foreground sm:text-sm">
                  {card.title}
                </p>
                <p className="mt-0.5 text-[10px] text-muted sm:text-xs">
                  {card.description}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-9",
                  card.iconClassName,
                )}
                aria-hidden="true"
              >
                <Icon className="size-3.5 sm:size-4" strokeWidth={2} />
              </span>
            </div>
            {isLoading ? (
              <SkeletonKpiValue className="mt-2 sm:mt-3" />
            ) : (
              <p className="mt-2 text-xl font-bold text-foreground sm:mt-3 sm:text-2xl">
                {card.value ?? 0}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
