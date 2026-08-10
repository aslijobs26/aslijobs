"use client";

import { SettingsSection } from "@/components/job-seeker-settings/SettingsSection";
import { JOB_SEEKER_NOTIFICATION_RETENTION_POLICY } from "@/constants/job-seeker-settings";
import { ROUTES } from "@/constants/routes";
import {
  clearAllNotifications,
  fetchNotificationUnreadCount,
  markAllNotificationsAsRead,
  notificationQueryKeys,
} from "@/services/notifications.service";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import Link from "next/link";

export function NotificationsSettingsPanel() {
  const queryClient = useQueryClient();
  const recipientScope = "job-seeker" as const;

  const unreadQuery = useQuery({
    queryKey: notificationQueryKeys.unreadCount(recipientScope),
    queryFn: fetchNotificationUnreadCount,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: notificationQueryKeys.unreadCount(recipientScope),
    });
    void queryClient.invalidateQueries({
      queryKey: notificationQueryKeys.list(recipientScope),
    });
    void queryClient.invalidateQueries({
      queryKey: notificationQueryKeys.recent(recipientScope),
    });
  };

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: (updatedCount) => {
      invalidate();
      showAppToast(
        updatedCount > 0
          ? `Marked ${updatedCount} notification${updatedCount === 1 ? "" : "s"} as read`
          : "No unread notifications",
      );
    },
    onError: () => showAppToast("Could not mark notifications as read", "error"),
  });

  const clearAllMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: (clearedCount) => {
      invalidate();
      showAppToast(
        clearedCount > 0
          ? `Cleared ${clearedCount} notification${clearedCount === 1 ? "" : "s"}`
          : "Inbox already empty",
      );
    },
    onError: () => showAppToast("Could not clear notifications", "error"),
  });

  const unreadCount = unreadQuery.data ?? 0;

  return (
    <div className="space-y-4">
      <SettingsSection
        title="In-app Notifications"
        description="Manage your notification inbox. Email and WhatsApp delivery preferences are not configurable yet."
        action={
          <Link
            href={ROUTES.JOB_SEEKER_NOTIFICATIONS}
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle px-3 text-xs font-semibold text-foreground transition-colors hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm"
          >
            Open inbox
          </Link>
        }
      >
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-hero-bg/60 px-4 py-3.5">
          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary-light text-primary">
            <Bell className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground sm:text-sm">
              Unread
            </p>
            <p className="text-[11px] text-muted sm:text-xs">
              {unreadQuery.isLoading
                ? "Loading…"
                : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={unreadCount === 0 || markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border-subtle px-3 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              <CheckCheck className="size-3.5" aria-hidden="true" />
              Mark all read
            </button>
            <button
              type="button"
              disabled={clearAllMutation.isPending}
              onClick={() => {
                if (
                  !window.confirm(
                    "Clear all notifications from your inbox? Application history is not affected.",
                  )
                ) {
                  return;
                }
                clearAllMutation.mutate();
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border-subtle px-3 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Clear all
            </button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Retention policy"
        description="Inbox visibility is managed by AsliJobs platform retention rules."
      >
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border-subtle px-3 py-2.5">
            <dt className="text-[11px] font-medium text-muted sm:text-xs">
              Unread retention
            </dt>
            <dd className="mt-0.5 text-xs font-semibold text-foreground sm:text-sm">
              {JOB_SEEKER_NOTIFICATION_RETENTION_POLICY.unreadDays} days
            </dd>
          </div>
          <div className="rounded-lg border border-border-subtle px-3 py-2.5">
            <dt className="text-[11px] font-medium text-muted sm:text-xs">
              Read retention
            </dt>
            <dd className="mt-0.5 text-xs font-semibold text-foreground sm:text-sm">
              {JOB_SEEKER_NOTIFICATION_RETENTION_POLICY.readDays} days
            </dd>
          </div>
        </dl>
      </SettingsSection>
    </div>
  );
}
