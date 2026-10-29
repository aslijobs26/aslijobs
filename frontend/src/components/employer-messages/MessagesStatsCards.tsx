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
    <div className="grid gap-3 max-sm:grid-cols-2 max-sm:gap-2.5 sm:grid-cols-2 lg:gap-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.id}
            className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm max-sm:p-2.5 lg:rounded-lg lg:p-2.5"
          >
            <div className="flex items-start justify-between gap-3 max-sm:gap-2 lg:gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground max-sm:text-[11px] max-sm:leading-tight lg:text-xs lg:leading-tight">
                  {card.title}
                </p>
                <p className="mt-0.5 text-xs text-muted max-sm:text-[10px] lg:text-[10px]">
                  {card.description}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg max-sm:size-7 lg:size-7",
                  card.iconClassName,
                )}
                aria-hidden="true"
              >
                <Icon
                  className="size-4 max-sm:size-3.5 lg:size-3.5"
                  strokeWidth={2}
                />
              </span>
            </div>
            {isLoading ? (
              <SkeletonKpiValue className="mt-3 max-sm:mt-2 lg:mt-1.5" />
            ) : (
              <p className="mt-3 text-2xl font-bold text-foreground max-sm:mt-2 max-sm:text-xl lg:mt-1.5 lg:text-xl">
                {card.value ?? 0}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
