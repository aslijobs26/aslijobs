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
import type {
  NotificationListItem,
  NotificationListResult,
} from "@/types/notifications";
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
  const markedReadOnOpenRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  const unreadQuery = useQuery({
    queryKey: notificationQueryKeys.unreadCount(recipientScope),
    queryFn: fetchNotificationUnreadCount,
    staleTime: 60_000,
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
    staleTime: 60_000,
    refetchOnWindowFocus: false,
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
    onMutate: async () => {
      const unreadKey = notificationQueryKeys.unreadCount(recipientScope);
      const recentKey = notificationQueryKeys.recent(recipientScope);

      await queryClient.cancelQueries({ queryKey: unreadKey });
      await queryClient.cancelQueries({ queryKey: recentKey });

      const previousUnread = queryClient.getQueryData<number>(unreadKey);
      const previousRecent =
        queryClient.getQueryData<NotificationListResult>(recentKey);

      queryClient.setQueryData(unreadKey, 0);
      if (previousRecent) {
        queryClient.setQueryData<NotificationListResult>(recentKey, {
          ...previousRecent,
          unreadCount: 0,
          notifications: previousRecent.notifications.map((item) =>
            item.isRead ? item : { ...item, isRead: true, readAt: item.readAt },
          ),
        });
      }

      return { previousUnread, previousRecent };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousUnread !== undefined) {
        queryClient.setQueryData(
          notificationQueryKeys.unreadCount(recipientScope),
          context.previousUnread,
        );
      }
      if (context?.previousRecent !== undefined) {
        queryClient.setQueryData(
          notificationQueryKeys.recent(recipientScope),
          context.previousRecent,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.unreadCount(recipientScope),
      });
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.recent(recipientScope),
      });
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.list(recipientScope),
      });
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.summary(recipientScope),
      });
    },
  });

  useEffect(() => {
    if (!isOpen) {
      markedReadOnOpenRef.current = false;
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

  const markAllAsRead = markAllMutation.mutate;
  const isMarkingAllAsRead = markAllMutation.isPending;

  // Job seeker: clear the red badge as soon as the inbox panel is opened.
  useEffect(() => {
    if (!isOpen || recipientScope !== "job-seeker") {
      return;
    }
    if (markedReadOnOpenRef.current) {
      return;
    }
    if ((unreadQuery.data ?? 0) <= 0 || isMarkingAllAsRead) {
      return;
    }

    markedReadOnOpenRef.current = true;
    markAllAsRead();
  }, [
    isMarkingAllAsRead,
    isOpen,
    markAllAsRead,
    recipientScope,
    unreadQuery.data,
  ]);

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
          className={cn(
            "absolute right-0 z-50 mt-2 overflow-hidden rounded-xl border border-border-subtle bg-surface",
            "shadow-[0_8px_24px_rgba(26,43,60,0.12)]",
            // Mobile: compact panel that stays inside the viewport
            "w-[min(14rem,calc(100vw-3rem))]",
            "sm:w-[min(22rem,calc(100vw-1.5rem))]",
          )}
        >
          <div className="flex items-center justify-between border-b border-border-subtle px-2 py-1.5 sm:px-3 sm:py-2.5">
            <p className="text-[11px] font-semibold text-foreground sm:text-sm">
              Notifications
            </p>
            <button
              type="button"
              disabled={unreadCount === 0 || markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
              className="text-[10px] font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto scrollbar-hidden sm:max-h-80">
            {recentQuery.isLoading ? (
              <p className="px-2.5 py-5 text-center text-[11px] text-muted sm:px-3 sm:py-8 sm:text-sm">
                Loading…
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-2.5 py-5 text-center text-[11px] text-muted sm:px-3 sm:py-8 sm:text-sm">
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
                          "flex w-full gap-2 px-2 py-2 text-left transition-colors hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 sm:gap-3 sm:px-3 sm:py-3",
                          !notification.isRead && "bg-primary-light/25",
                        )}
                      >
                        <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary sm:size-8 sm:rounded-lg">
                          <Icon className="size-3 sm:size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-semibold leading-snug text-foreground sm:text-sm">
                            {notification.title}
                          </span>
                          <span className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-muted sm:line-clamp-2 sm:text-xs">
                            {notification.body}
                          </span>
                          <span className="mt-0.5 block text-[9px] text-muted sm:mt-1 sm:text-[11px]">
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

          <div className="border-t border-border-subtle p-1 sm:p-2">
            <Link
              href={viewAllHref}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-center rounded-lg px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:px-3 sm:py-2 sm:text-sm"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
