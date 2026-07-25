import { apiClient } from "@/services/api-client";
import type {
  NotificationCategoryFilter,
  NotificationListItem,
  NotificationListResult,
  NotificationReadStatusFilter,
} from "@/types/notifications";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export async function fetchNotifications(options?: {
  page?: number;
  limit?: number;
  search?: string;
  readStatus?: NotificationReadStatusFilter;
  category?: NotificationCategoryFilter;
}): Promise<NotificationListResult> {
  const response = await apiClient.get<ApiSuccess<NotificationListResult>>(
    "/notifications/me",
    {
      params: {
        page: options?.page ?? 1,
        limit: options?.limit ?? 20,
        search: options?.search || undefined,
        readStatus: options?.readStatus ?? "all",
        category: options?.category ?? "all",
      },
    },
  );

  return response.data.data;
}

export async function fetchNotificationUnreadCount(): Promise<number> {
  const response = await apiClient.get<ApiSuccess<{ unreadCount: number }>>(
    "/notifications/me/unread-count",
  );
  return response.data.data.unreadCount;
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<NotificationListItem> {
  const response = await apiClient.post<
    ApiSuccess<{ notification: NotificationListItem }>
  >(`/notifications/me/${notificationId}/read`);

  return response.data.data.notification;
}

export async function markAllNotificationsAsRead(): Promise<number> {
  const response = await apiClient.post<ApiSuccess<{ updatedCount: number }>>(
    "/notifications/me/read-all",
  );
  return response.data.data.updatedCount;
}
