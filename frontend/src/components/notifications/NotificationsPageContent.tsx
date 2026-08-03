"use client";

import {
  formatNotificationTime,
  notificationIcon,
} from "@/components/notifications/notification-utils";
import {
  clearAllNotifications,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  notificationQueryKeys,
} from "@/services/notifications.service";
import type {
  NotificationCategoryFilter,
  NotificationListItem,
  NotificationReadStatusFilter,
} from "@/types/notifications";
import { cn } from "@/utils/cn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Search, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NotificationsPageContentProps = {
  title?: string;
};

const CATEGORY_FILTERS: { key: NotificationCategoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "application", label: "Application" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "system", label: "System" },
];

const READ_FILTERS: { key: NotificationReadStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
];

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function NotificationsPageContent({
  title = "Notifications",
}: NotificationsPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const recipientScope = pathname.startsWith("/employer/")
    ? "employer"
    : "job-seeker";
  const [searchInput, setSearchInput] = useState("");
  const [readStatus, setReadStatus] =
    useState<NotificationReadStatusFilter>("all");
  const [category, setCategory] = useState<NotificationCategoryFilter>("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, readStatus, category]);

  const listQuery = useQuery({
    queryKey: [
      ...notificationQueryKeys.list(recipientScope),
      page,
      debouncedSearch,
      readStatus,
      category,
    ],
    queryFn: () =>
      fetchNotifications({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        readStatus,
        category,
      }),
    placeholderData: (previous) => previous,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.list(recipientScope),
      });
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
        queryKey: notificationQueryKeys.list(recipientScope),
      });
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.unreadCount(recipientScope),
      });
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.recent(recipientScope),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.list(recipientScope),
      });
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.unreadCount(recipientScope),
      });
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.recent(recipientScope),
      });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.list(recipientScope),
      });
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.unreadCount(recipientScope),
      });
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.recent(recipientScope),
      });
    },
  });

  const notifications = listQuery.data?.notifications ?? [];
  const pagination = listQuery.data?.pagination;
  const unreadCount = listQuery.data?.unreadCount ?? 0;
  const hasInboxItems = (pagination?.total ?? notifications.length) > 0;

  const openNotification = async (notification: NotificationListItem) => {
    if (!notification.isRead) {
      try {
        await markReadMutation.mutateAsync(notification.id);
      } catch {
        // Continue navigation.
      }
    }
    if (notification.actionPath) {
      router.push(notification.actionPath);
    }
  };

  const handleClearAll = () => {
    if (
      !window.confirm(
        "Clear all notifications from your inbox? Conversation history is not affected.",
      )
    ) {
      return;
    }
    clearAllMutation.mutate();
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Stay updated on applications, interviews, and offers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!hasInboxItems || clearAllMutation.isPending}
            onClick={handleClearAll}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle px-3 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear all
          </button>
          <button
            type="button"
            disabled={unreadCount === 0 || markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle px-3 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>
      </header>

      <div className="mt-5 flex flex-col gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <label htmlFor="notifications-search" className="sr-only">
            Search notifications
          </label>
          <input
            id="notifications-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search notifications"
            className="w-full rounded-lg border border-border-subtle bg-surface py-2.5 pr-3 pl-10 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {READ_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setReadStatus(filter.key)}
              className={cn(
                "inline-flex shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                readStatus === filter.key
                  ? "bg-primary text-surface ring-primary"
                  : "bg-surface text-foreground ring-border-subtle hover:bg-primary-light/40",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setCategory(filter.key)}
              className={cn(
                "inline-flex shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                category === filter.key
                  ? "bg-primary-light text-primary ring-primary/30"
                  : "bg-surface text-foreground ring-border-subtle hover:bg-primary-light/40",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {listQuery.isLoading ? (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-xl border border-border-subtle bg-primary-light/30"
              />
            ))}
          </div>
        ) : listQuery.isError ? (
          <div className="rounded-xl border border-border-subtle bg-surface px-4 py-10 text-center">
            <p className="text-sm text-muted">
              Could not load notifications. Please try again.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-surface hover:bg-primary-hover"
              onClick={() => void listQuery.refetch()}
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-border-subtle bg-surface px-4 py-14 text-center">
            <Bell className="mx-auto size-10 text-muted" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-foreground">
              No notifications found
            </p>
            <p className="mt-1 text-sm text-muted">
              Updates about your hiring activity will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = notificationIcon(notification.type);
            return (
              <article
                key={notification.id}
                className={cn(
                  "rounded-xl border border-border-subtle bg-surface p-4 transition-colors",
                  !notification.isRead && "border-primary/25 bg-primary-light/20",
                )}
              >
                <div className="flex gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="text-sm font-semibold text-foreground">
                        {notification.title}
                      </h2>
                      <time className="text-xs text-muted">
                        {formatNotificationTime(notification.createdAt)}
                      </time>
                    </div>
                    <p className="mt-1 text-sm text-muted">{notification.body}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void openNotification(notification)}
                        className="inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        View details
                      </button>
                      {!notification.isRead ? (
                        <button
                          type="button"
                          disabled={markReadMutation.isPending}
                          onClick={() =>
                            markReadMutation.mutate(notification.id)
                          }
                          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle px-3 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                          Mark as read
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(notification.id)}
                        aria-label={`Delete notification: ${notification.title}`}
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-border-subtle px-3 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <nav
          className="mt-6 flex flex-wrap items-center justify-between gap-3"
          aria-label="Notifications pagination"
        >
          <p className="text-sm text-muted">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle px-3 text-sm font-semibold text-foreground hover:bg-primary-light/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.totalPages, current + 1),
                )
              }
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle px-3 text-sm font-semibold text-foreground hover:bg-primary-light/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
