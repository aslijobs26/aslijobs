"use client";

import { SkeletonKpiValue } from "@/components/shared/skeletons/SkeletonBone";
import { useTranslate } from "@/i18n/translate";
import type { EmployerMessageConversationStats } from "@/types/employer-messages";
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
  hint: string;
  value: number | null;
  /** Count within the active list filters; shown only when filters apply. */
  filteredValue: number | null;
  icon: LucideIcon;
  iconClassName: string;
  cardClassName: string;
  valueClassName: string;
};

type MessagesStatsCardsProps = {
  /** Unfiltered KPIs from the conversations API. */
  stats: EmployerMessageConversationStats | null;
  /** Filtered conversation totals; pass null when no list filter is active. */
  filteredTotal?: number | null;
  filteredUnread?: number | null;
  isLoading?: boolean;
};

export function MessagesStatsCards({
  stats,
  filteredTotal = null,
  filteredUnread = null,
  isLoading = false,
}: MessagesStatsCardsProps) {
  const t = useTranslate();
  const cards: MessagesStatCard[] = [
    {
      id: "total",
      title: t("employer.messagesPage.kpi.totalTitle"),
      description: t("employer.messagesPage.kpi.totalDesc"),
      hint: t("employer.messagesPage.kpi.totalHint"),
      value: stats?.totalConversations ?? null,
      filteredValue: filteredTotal,
      icon: MessagesSquare,
      iconClassName: "bg-primary-light text-primary",
      cardClassName:
        "border-primary/20 bg-gradient-to-br from-primary/10 to-white hover:border-primary/35",
      valueClassName: "text-primary",
    },
    {
      id: "unread",
      title: t("employer.messagesPage.kpi.unreadTitle"),
      description: t("employer.messagesPage.kpi.unreadDesc"),
      hint: t("employer.messagesPage.kpi.unreadHint"),
      value: stats?.unreadConversations ?? null,
      filteredValue: filteredUnread,
      icon: MessageSquare,
      iconClassName: "bg-amber-50 text-amber-600",
      cardClassName:
        "border-amber-200/80 bg-gradient-to-br from-amber-50 to-white hover:border-amber-300",
      valueClassName: "text-amber-700",
    },
    {
      id: "active",
      title: t("employer.messagesPage.kpi.activeTitle"),
      description: t("employer.messagesPage.kpi.activeDesc"),
      hint: t("employer.messagesPage.kpi.activeHint"),
      value: stats?.activeHiringConversations ?? null,
      filteredValue: null,
      icon: Briefcase,
      iconClassName: "bg-sky-50 text-sky-600",
      cardClassName:
        "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white hover:border-sky-300",
      valueClassName: "text-sky-700",
    },
    {
      id: "interview",
      title: t("employer.messagesPage.kpi.interviewsTitle"),
      description: t("employer.messagesPage.kpi.interviewsDesc"),
      hint: t("employer.messagesPage.kpi.interviewsHint"),
      value: stats?.interviewEventsLast7Days ?? null,
      filteredValue: null,
      icon: CalendarDays,
      iconClassName: "bg-violet-50 text-violet-600",
      cardClassName:
        "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white hover:border-violet-300",
      valueClassName: "text-violet-700",
    },
  ];

  return (
    <div className="employer-messages-kpi grid gap-3 max-sm:grid-cols-2 max-sm:gap-2.5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-2">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.id}
            title={card.hint}
            className={cn(
              "employer-messages-kpi-card rounded-xl border p-4 shadow-sm transition-[border-color,box-shadow] hover:shadow-md max-sm:p-2.5 lg:rounded-lg lg:p-2",
              card.cardClassName,
            )}
          >
            <div className="flex items-start justify-between gap-3 max-sm:gap-2 lg:gap-1.5">
              <div className="min-w-0">
                <p className="employer-messages-kpi-card__title text-sm font-semibold text-foreground max-sm:text-[11px] max-sm:leading-tight lg:text-[0.6875rem] lg:leading-tight">
                  {card.title}
                </p>
                <p className="employer-messages-kpi-card__desc mt-0.5 text-xs text-muted max-sm:text-[10px] lg:text-[0.625rem]">
                  {card.description}
                </p>
              </div>
              <span
                className={cn(
                  "employer-messages-kpi-card__icon inline-flex size-9 shrink-0 items-center justify-center rounded-lg max-sm:size-7 lg:size-6",
                  card.iconClassName,
                )}
                aria-hidden="true"
              >
                <Icon
                  className="size-4 max-sm:size-3.5 lg:size-3"
                  strokeWidth={2}
                />
              </span>
            </div>
            {isLoading ? (
              <SkeletonKpiValue className="mt-3 max-sm:mt-2 lg:mt-1" />
            ) : (
              <div className="mt-3 flex flex-wrap items-baseline gap-x-2 max-sm:mt-2 lg:mt-1">
                <p
                  className={cn(
                    "employer-messages-kpi-card__value text-2xl font-bold max-sm:text-xl lg:text-base",
                    card.valueClassName,
                  )}
                >
                  {card.value ?? 0}
                </p>
                {card.filteredValue !== null ? (
                  <p className="text-[0.625rem] font-medium text-muted">
                    {t("employer.messagesPage.kpi.matchingFilters", {
                      count: card.filteredValue,
                    })}
                  </p>
                ) : null}
              </div>
            )}
            <span className="sr-only">{card.hint}</span>
          </article>
        );
      })}
    </div>
  );
}
