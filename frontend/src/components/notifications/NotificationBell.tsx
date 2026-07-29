"use client";

import {
  formatNotificationTime,
  notificationIcon,
} from "@/components/notifications/notification-utils";
import {
  fetchNotificationUnreadCount,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  notificationQueryKeys,
} from "@/services/notifications.service";
import type { NotificationListItem } from "@/types/notifications";
import { cn } from "@/utils/cn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type NotificationBellProps = {
  viewAllHref: string;
  className?: string;
};

export function NotificationBell({
  viewAllHref,
  className,
}: NotificationBellProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const recipientScope = viewAllHref.startsWith("/employer/")
    ? "employer"
    : "job-seeker";
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const unreadQuery = useQuery({
    queryKey: notificationQueryKeys.unreadCount(recipientScope),
    queryFn: fetchNotificationUnreadCount,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const recentQuery = useQuery({
    queryKey: notificationQueryKeys.recent(recipientScope),
    queryFn: () =>
      fetchNotifications({
        page: 1,
        limit: 8,
        readStatus: "all",
      }),
    enabled: isOpen,
    staleTime: 15_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.unreadCount(recipientScope),
      });
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.recent(recipientScope),
      });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.unreadCount(recipientScope),
      });
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.recent(recipientScope),
      });
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const unreadCount = unreadQuery.data ?? 0;
  const notifications = recentQuery.data?.notifications ?? [];

  const openNotification = async (notification: NotificationListItem) => {
    if (!notification.isRead) {
      try {
        await markReadMutation.mutateAsync(notification.id);
      } catch {
        // Navigation should still proceed.
      }
    }
    setIsOpen(false);
    router.push(notification.actionPath || viewAllHref);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className="relative inline-flex size-10 items-center justify-center rounded-lg text-nav transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Bell className="size-5" strokeWidth={2} aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute top-1.5 right-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-pin-state px-1 text-[10px] font-bold leading-4 text-surface">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_8px_24px_rgba(26,43,60,0.12)]"
        >
          <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2.5">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <button
              type="button"
              disabled={unreadCount === 0 || markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
              className="text-xs font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto scrollbar-hidden">
            {recentQuery.isLoading ? (
              <p className="px-3 py-8 text-center text-sm text-muted">
                Loading…
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted">
                No notifications yet.
              </p>
            ) : (
              <ul>
                {notifications.map((notification) => {
                  const Icon = notificationIcon(notification.type);
                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void openNotification(notification)}
                        className={cn(
                          "flex w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                          !notification.isRead && "bg-primary-light/25",
                        )}
                      >
                        <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {notification.title}
                          </span>
                          <span className="mt-0.5 line-clamp-2 text-xs text-muted">
                            {notification.body}
                          </span>
                          <span className="mt-1 block text-[11px] text-muted">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border-subtle p-2">
            <Link
              href={viewAllHref}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
