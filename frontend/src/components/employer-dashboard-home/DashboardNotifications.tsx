"use client";

import { ROUTES } from "@/constants/routes";
import type { NotificationListItem } from "@/types/notifications";
import { cn } from "@/utils/cn";
import { formatEmployerDashboardRelativeTime } from "@/utils/employer-dashboard-home";
import {
  Bell,
  Briefcase,
  CalendarDays,
  Gift,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type DashboardNotificationsProps = {
  notifications: NotificationListItem[];
  unreadCount: number;
  isLoading?: boolean;
};

function getNotificationIcon(category: NotificationListItem["category"]): LucideIcon {
  switch (category) {
    case "application":
      return Briefcase;
    case "interview":
      return CalendarDays;
    case "offer":
      return Gift;
    default:
      return MessageSquare;
  }
}

const DASHBOARD_NOTIFICATIONS_PREVIEW_LIMIT = 4;

export function DashboardNotifications({
  notifications,
  unreadCount,
  isLoading = false,
}: DashboardNotificationsProps) {
  const latestNotifications = notifications.slice(
    0,
    DASHBOARD_NOTIFICATIONS_PREVIEW_LIMIT,
  );

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-foreground">Notifications</h2>
          {unreadCount > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-pin-state px-1.5 py-0.5 text-[0.625rem] font-bold text-surface">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </div>
        <Link
          href={ROUTES.EMPLOYER_NOTIFICATIONS}
          className="text-xs font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          View All
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2.5 p-4">
          {Array.from({ length: DASHBOARD_NOTIFICATIONS_PREVIEW_LIMIT }).map(
            (_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-lg bg-hero-bg"
                aria-hidden="true"
              />
            ),
          )}
        </div>
      ) : null}

      {!isLoading && latestNotifications.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-8 text-center">
          <Bell className="size-5 text-muted" aria-hidden="true" />
          <p className="mt-2 text-sm text-muted">No notifications yet</p>
        </div>
      ) : null}

      {!isLoading && latestNotifications.length > 0 ? (
        <ul className="divide-y divide-border-subtle">
          {latestNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.category);
            const href =
              notification.actionPath?.trim() || ROUTES.EMPLOYER_NOTIFICATIONS;

            return (
              <li key={notification.id}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-start gap-2.5 px-4 py-3 transition-colors hover:bg-hero-bg/50 focus-visible:bg-hero-bg/50 focus-visible:outline-none",
                    !notification.isRead && "bg-primary-light/30",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                      !notification.isRead
                        ? "bg-primary-light text-primary"
                        : "bg-hero-bg text-muted",
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {notification.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[0.6875rem] leading-relaxed text-muted">
                      {notification.body}
                    </p>
                    <p className="mt-1 text-[0.625rem] font-medium text-muted">
                      {formatEmployerDashboardRelativeTime(
                        notification.createdAt,
                      )}
                    </p>
                  </div>
                  {!notification.isRead ? (
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                      aria-label="Unread"
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
