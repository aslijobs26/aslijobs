"use client";

import { summaryCategoryIcon } from "@/components/notifications/notification-utils";
import { ROUTES } from "@/constants/routes";
import { useTranslate, type MessageKey } from "@/i18n/translate";
import type { NotificationSummary } from "@/types/notifications";
import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";

type JobSeekerNotificationsSidebarProps = {
  summary: NotificationSummary | undefined;
  isLoading: boolean;
};

const SUMMARY_ROWS: {
  key: keyof NotificationSummary;
  labelKey: MessageKey;
  iconClassName: string;
}[] = [
  {
    key: "all",
    labelKey: "seeker.notifications.summaryAll",
    iconClassName: "bg-primary-light text-primary",
  },
  {
    key: "unread",
    labelKey: "seeker.notifications.unread",
    iconClassName: "bg-primary-light text-pin-state",
  },
  {
    key: "application",
    labelKey: "seeker.notifications.summaryApplications",
    iconClassName: "bg-resource-salary-surface text-resource-salary-icon",
  },
  {
    key: "interview",
    labelKey: "seeker.notifications.summaryInterviews",
    iconClassName: "bg-resource-interview-surface text-resource-interview-icon",
  },
  {
    key: "offer",
    labelKey: "seeker.notifications.summaryOffers",
    iconClassName: "bg-resource-guide-surface text-resource-guide-icon",
  },
  {
    key: "system",
    labelKey: "seeker.notifications.categorySystem",
    iconClassName: "bg-resource-resume-surface text-resource-resume-icon",
  },
];

export function JobSeekerNotificationsSidebar({
  summary,
  isLoading,
}: JobSeekerNotificationsSidebarProps) {
  const t = useTranslate();

  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <section className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
        <h2 className="break-words text-sm font-bold text-foreground sm:text-base">
          {t("seeker.notifications.summaryTitle")}
        </h2>
        <ul className="mt-4 space-y-1">
          {SUMMARY_ROWS.map((row) => {
            const Icon = summaryCategoryIcon(row.key);
            const count = summary?.[row.key] ?? 0;
            return (
              <li key={row.key}>
                <div className="flex items-center gap-3 rounded-xl px-1 py-2.5">
                  <span
                    className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ${row.iconClassName}`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 break-words text-xs font-medium text-foreground sm:text-sm">
                    {t(row.labelKey)}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-foreground sm:text-sm">
                    {isLoading && !summary ? "—" : count}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words text-sm font-bold text-foreground sm:text-base">
              {t("seeker.notifications.preferencesTitle")}
            </h2>
            <p className="mt-1.5 break-words text-xs leading-relaxed text-muted sm:text-sm">
              {t("seeker.notifications.preferencesBody")}
            </p>
          </div>
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
            <Bell className="size-5" aria-hidden="true" />
          </span>
        </div>
        <Link
          href={`${ROUTES.JOB_SEEKER_SETTINGS}?section=notifications`}
          className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-11 sm:text-sm"
        >
          {t("seeker.notifications.managePreferences")}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </aside>
  );
}
