"use client";

import {
  employerMessageQueryKeys,
  fetchNotificationConversations,
} from "@/services/notifications.service";
import { cn } from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";
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
};

export function MessagesStatsCards({
  totalConversations,
  unreadConversations,
}: MessagesStatsCardsProps) {
  const activeQuery = useQuery({
    queryKey: [...employerMessageQueryKeys.stats, "active"],
    queryFn: () =>
      fetchNotificationConversations({
        page: 1,
        limit: 1,
        conversationType: "active",
      }),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const interviewQuery = useQuery({
    queryKey: [...employerMessageQueryKeys.stats, "interview-week"],
    queryFn: () =>
      fetchNotificationConversations({
        page: 1,
        limit: 1,
        category: "interview",
        quickDate: "last_7_days",
      }),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

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
      value: activeQuery.data?.pagination.total ?? null,
      icon: Briefcase,
      iconClassName: "bg-benefit-verified-surface text-benefit-verified-icon",
    },
    {
      id: "interview",
      title: "Interview Conversations",
      description: "This week",
      value: interviewQuery.data?.pagination.total ?? null,
      icon: CalendarDays,
      iconClassName: "bg-resource-resume-surface text-resource-resume-icon",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2 sm:gap-2.5 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.id}
            className="flex h-full min-w-0 items-center gap-2 rounded-xl border border-border-subtle bg-surface px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:gap-2.5 sm:px-3 sm:py-2.5"
          >
            <span
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9",
                card.iconClassName,
              )}
            >
              <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[0.625rem] font-medium text-muted sm:text-[0.6875rem]">
                {card.title}
              </p>
              <p className="mt-0.5 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {card.value === null ? "—" : card.value}
              </p>
              <p className="mt-0.5 truncate text-[0.5625rem] text-muted sm:text-[0.625rem]">
                {card.description}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
