"use client";

import { summaryCategoryIcon } from "@/components/notifications/notification-utils";
import { ROUTES } from "@/constants/routes";
import type { NotificationSummary } from "@/types/notifications";
import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";

type JobSeekerNotificationsSidebarProps = {
  summary: NotificationSummary | undefined;
  isLoading: boolean;
};

const SUMMARY_ROWS: {
  key: keyof NotificationSummary;
  label: string;
  iconClassName: string;
}[] = [
  {
    key: "all",
    label: "All Notifications",
    iconClassName: "bg-primary-light text-primary",
  },
  {
    key: "unread",
    label: "Unread",
    iconClassName: "bg-primary-light text-pin-state",
  },
  {
    key: "application",
    label: "Applications",
    iconClassName: "bg-resource-salary-surface text-resource-salary-icon",
  },
  {
    key: "interview",
    label: "Interviews",
    iconClassName: "bg-resource-interview-surface text-resource-interview-icon",
  },
  {
    key: "offer",
    label: "Offers",
    iconClassName: "bg-resource-guide-surface text-resource-guide-icon",
  },
  {
    key: "system",
    label: "System",
    iconClassName: "bg-resource-resume-surface text-resource-resume-icon",
  },
];

export function JobSeekerNotificationsSidebar({
  summary,
  isLoading,
}: JobSeekerNotificationsSidebarProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <section className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-bold text-foreground sm:text-base">
          Notification Summary
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
                  <span className="min-w-0 flex-1 text-xs font-medium text-foreground sm:text-sm">
                    {row.label}
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
            <h2 className="text-sm font-bold text-foreground sm:text-base">
              Notification Preferences
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted sm:text-sm">
              Manage what notifications you receive and how.
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
          Manage Preferences
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </aside>
  );
}
