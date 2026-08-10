"use client";

import { JobSeekerNotificationsSidebar } from "@/components/job-seeker-notifications/JobSeekerNotificationsSidebar";
import {
  formatNotificationTime,
  notificationIcon,
  notificationIconToneClass,
} from "@/components/notifications/notification-utils";
import { ListPagination } from "@/components/shared/ListPagination";
import {
  clearAllNotifications,
  deleteNotification,
  fetchNotificationSummary,
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const PAGE_SIZE = 10;
const RECIPIENT_SCOPE = "job-seeker" as const;

type CategoryFilterTone =
  | "primary"
  | "blue"
  | "orange"
  | "green"
  | "purple";

const CATEGORY_FILTERS: {
  key: NotificationCategoryFilter;
  label: string;
  tone: CategoryFilterTone;
}[] = [
  { key: "all", label: "All", tone: "primary" },
  { key: "application", label: "Application", tone: "blue" },
  { key: "interview", label: "Interview", tone: "orange" },
  { key: "offer", label: "Offer", tone: "green" },
  { key: "system", label: "System", tone: "purple" },
];

const CATEGORY_TONE_CLASSES: Record<
  CategoryFilterTone,
  { idle: string; active: string }
> = {
  primary: {
    idle: "bg-surface text-primary ring-primary/35 hover:bg-primary-light/60",
    active: "bg-primary-light text-primary ring-primary",
  },
  blue: {
    idle: "bg-surface text-resource-salary-icon ring-resource-salary-icon/35 hover:bg-resource-salary-surface",
    active:
      "bg-resource-salary-surface text-resource-salary-icon ring-resource-salary-icon",
  },
  orange: {
    idle: "bg-surface text-resource-interview-icon ring-resource-interview-icon/35 hover:bg-resource-interview-surface",
    active:
      "bg-resource-interview-surface text-resource-interview-icon ring-resource-interview-icon",
  },
  green: {
    idle: "bg-surface text-resource-guide-icon ring-resource-guide-icon/35 hover:bg-resource-guide-surface",
    active:
      "bg-resource-guide-surface text-resource-guide-icon ring-resource-guide-icon",
  },
  purple: {
    idle: "bg-surface text-resource-resume-icon ring-resource-resume-icon/35 hover:bg-resource-resume-surface",
    active:
      "bg-resource-resume-surface text-resource-resume-icon ring-resource-resume-icon",
  },
};

function categoryFilterToneClasses(
  tone: CategoryFilterTone,
  isActive: boolean,
): string {
  const classes = CATEGORY_TONE_CLASSES[tone];
  return isActive ? classes.active : classes.idle;
}

const READ_FILTERS: { key: NotificationReadStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
];

function parseReadStatus(value: string | null): NotificationReadStatusFilter {
  if (value === "unread" || value === "read") {
    return value;
  }
  return "all";
}

function parseCategory(value: string | null): NotificationCategoryFilter {
  if (
    value === "application" ||
    value === "interview" ||
    value === "offer" ||
    value === "system"
  ) {
    return value;
  }
  return "all";
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function JobSeekerNotificationsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();

  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const readStatus = parseReadStatus(searchParams.get("status"));
  const category = parseCategory(searchParams.get("category"));
  const searchFromUrl = searchParams.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  const updateUrl = (patch: {
    page?: number;
    q?: string;
    status?: NotificationReadStatusFilter;
    category?: NotificationCategoryFilter;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    const nextPage = patch.page ?? page;
    const nextQ = patch.q !== undefined ? patch.q : debouncedSearch;
    const nextStatus = patch.status ?? readStatus;
    const nextCategory = patch.category ?? category;

    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    if (!nextQ) {
      params.delete("q");
    } else {
      params.set("q", nextQ);
    }

    if (nextStatus === "all") {
      params.delete("status");
    } else {
      params.set("status", nextStatus);
    }

    if (nextCategory === "all") {
      params.delete("category");
    } else {
      params.set("category", nextCategory);
    }

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  };

  useEffect(() => {
    if (debouncedSearch === searchFromUrl.trim()) {
      return;
    }
    updateUrl({ q: debouncedSearch, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync debounced search to URL only
  }, [debouncedSearch]);

  const invalidateNotificationQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.list(RECIPIENT_SCOPE),
      }),
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.unreadCount(RECIPIENT_SCOPE),
      }),
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.recent(RECIPIENT_SCOPE),
      }),
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.summary(RECIPIENT_SCOPE),
      }),
    ]);
  };

  const listQuery = useQuery({
    queryKey: [
      ...notificationQueryKeys.list(RECIPIENT_SCOPE),
      page,
      debouncedSearch,
      readStatus,
      category,
    ],
    queryFn: () =>
      fetchNotifications({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        readStatus,
        category,
      }),
    placeholderData: (previous) => previous,
  });

  const summaryQuery = useQuery({
    queryKey: notificationQueryKeys.summary(RECIPIENT_SCOPE),
    queryFn: fetchNotificationSummary,
    staleTime: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      void invalidateNotificationQueries();
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      void invalidateNotificationQueries();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: async () => {
      if (notifications.length <= 1 && page > 1) {
        updateUrl({ page: page - 1 });
      }
      await invalidateNotificationQueries();
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => {
      void invalidateNotificationQueries();
    },
  });

  const notifications = listQuery.data?.notifications ?? [];
  const pagination = listQuery.data?.pagination;
  const unreadCount =
    summaryQuery.data?.unread ?? listQuery.data?.unreadCount ?? 0;
  const inboxTotal = summaryQuery.data?.all ?? 0;
  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    readStatus !== "all" ||
    category !== "all";
  const hasInboxItems = inboxTotal > 0 || (pagination?.total ?? 0) > 0;

  const openNotification = async (notification: NotificationListItem) => {
    if (!notification.isRead) {
      try {
        await markReadMutation.mutateAsync(notification.id);
      } catch {
        // Continue navigation even if mark-read fails.
      }
    }
    if (notification.actionPath) {
      router.push(notification.actionPath);
    }
  };

  const handleClearAll = () => {
    if (
      !window.confirm(
        "Clear all notifications from your inbox? This cannot be undone.",
      )
    ) {
      return;
    }
    clearAllMutation.mutate();
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-3xl">
                Notifications
              </h1>
              <p className="mt-1.5 text-xs text-muted sm:text-[0.9375rem]">
                Stay updated on applications, interviews, and offers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
              <button
                type="button"
                disabled={!hasInboxItems || clearAllMutation.isPending}
                onClick={handleClearAll}
                className="text-xs font-semibold text-foreground underline-offset-2 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline sm:text-sm"
              >
                Clear all
              </button>
              <button
                type="button"
                disabled={unreadCount === 0 || markAllMutation.isPending}
                onClick={() => markAllMutation.mutate()}
                className="text-xs font-semibold text-foreground underline-offset-2 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline sm:text-sm"
              >
                Mark all as read
              </button>
            </div>
          </header>

          <div className="mt-5 space-y-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <label htmlFor="job-seeker-notifications-search" className="sr-only">
                Search notifications
              </label>
              <input
                id="job-seeker-notifications-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search notifications"
                className="w-full rounded-xl border border-border-subtle bg-surface py-2.5 pr-3 pl-10 text-sm text-foreground shadow-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>

            <div
              className="flex gap-2 overflow-x-auto pb-0.5 max-lg:scrollbar-hidden"
              role="tablist"
              aria-label="Read status"
            >
              {READ_FILTERS.map((filter) => {
                const isActive = readStatus === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() =>
                      updateUrl({ status: filter.key, page: 1 })
                    }
                    className={cn(
                      "inline-flex min-h-9 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      isActive
                        ? "bg-primary text-surface"
                        : "bg-surface text-foreground ring-1 ring-inset ring-border-subtle hover:bg-primary-light/50",
                    )}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <div
              className="flex gap-2 overflow-x-auto pb-0.5 max-lg:scrollbar-hidden"
              role="tablist"
              aria-label="Notification category"
            >
              {CATEGORY_FILTERS.map((filter) => {
                const isActive = category === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() =>
                      updateUrl({ category: filter.key, page: 1 })
                    }
                    className={cn(
                      "inline-flex min-h-8 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      categoryFilterToneClasses(filter.tone, isActive),
                    )}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {listQuery.isLoading ? (
              <div className="space-y-3" aria-busy="true">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-2xl border border-border-subtle bg-primary-light/30"
                  />
                ))}
              </div>
            ) : listQuery.isError ? (
              <div className="rounded-2xl border border-border-subtle bg-surface px-4 py-12 text-center shadow-sm">
                <p className="text-sm text-muted">
                  Could not load notifications. Please try again.
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  onClick={() => void listQuery.refetch()}
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl border border-border-subtle bg-surface px-4 py-14 text-center shadow-sm">
                <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-primary-light text-primary">
                  <Bell className="size-7" aria-hidden="true" />
                </span>
                <p className="mt-4 text-base font-semibold text-foreground">
                  {hasActiveFilters
                    ? "No notifications found"
                    : "No notifications yet"}
                </p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
                  {hasActiveFilters
                    ? "Try adjusting your search or filters."
                    : "Updates about applications, interviews, and offers will appear here."}
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = notificationIcon(notification.type);
                return (
                  <article
                    key={notification.id}
                    className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      <span
                        className={cn(
                          "inline-flex size-11 shrink-0 items-center justify-center rounded-full",
                          notificationIconToneClass(notification.type),
                        )}
                      >
                        <Icon className="size-5" aria-hidden="true" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="flex min-w-0 items-center gap-2 text-xs font-bold text-foreground sm:text-[0.9375rem]">
                            <span className="truncate">{notification.title}</span>
                            {!notification.isRead ? (
                              <span
                                className="size-2 shrink-0 rounded-full bg-pin-state"
                                aria-label="Unread"
                              />
                            ) : null}
                          </h2>
                          <time className="shrink-0 text-[10px] font-medium text-muted sm:text-xs">
                            {formatNotificationTime(notification.createdAt)}
                          </time>
                        </div>

                        <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
                          {notification.body}
                        </p>

                        <div className="mt-3.5 flex flex-wrap gap-2">
                          {notification.actionPath ? (
                            <button
                              type="button"
                              onClick={() => void openNotification(notification)}
                              className="inline-flex min-h-8 items-center justify-center rounded-lg bg-primary px-3 text-[11px] font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-9 sm:px-3.5 sm:text-xs"
                            >
                              View details
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={deleteMutation.isPending}
                            onClick={() =>
                              deleteMutation.mutate(notification.id)
                            }
                            aria-label={`Delete notification: ${notification.title}`}
                            className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-pin-state/40 bg-surface px-3 text-[11px] font-semibold text-pin-state transition-colors hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9 sm:px-3.5 sm:text-xs"
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

          {pagination ? (
            <ListPagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={(nextPage) => updateUrl({ page: nextPage })}
              isLoading={listQuery.isFetching}
              ariaLabel="Notifications pagination"
              entityLabel="notifications"
            />
          ) : null}
        </div>

        <JobSeekerNotificationsSidebar
          summary={summaryQuery.data}
          isLoading={summaryQuery.isLoading}
        />
      </div>
    </div>
  );
}
