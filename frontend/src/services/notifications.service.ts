import { apiClient } from "@/services/api-client";
import type {
  EmployerMessageConversationListResult,
  EmployerMessageTimelineResult,
} from "@/types/employer-messages";
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

export type NotificationRecipientScope = "employer" | "job-seeker";

export const notificationQueryKeys = {
  unreadCount: (scope: NotificationRecipientScope) =>
    ["notifications", scope, "unread-count"] as const,
  recent: (scope: NotificationRecipientScope) =>
    ["notifications", scope, "recent"] as const,
  list: (scope: NotificationRecipientScope) =>
    ["notifications", scope, "list"] as const,
};

export const employerMessageQueryKeys = {
  all: ["employer", "messages"] as const,
  conversations: ["employer", "messages", "conversations"] as const,
  stats: ["employer", "messages", "stats"] as const,
  timeline: (applicationId: string | null) =>
    ["employer", "messages", "timeline", applicationId] as const,
};

export async function fetchNotifications(options?: {
  page?: number;
  limit?: number;
  search?: string;
  readStatus?: NotificationReadStatusFilter;
  category?: NotificationCategoryFilter;
  referenceId?: string;
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
        referenceId: options?.referenceId || undefined,
      },
    },
  );

  return response.data.data;
}

export async function fetchNotificationConversations(options?: {
  page?: number;
  limit?: number;
  search?: string;
  readStatus?: NotificationReadStatusFilter;
  category?: NotificationCategoryFilter;
  publicJobId?: string;
  applicationStatus?: string;
  hasType?: string;
  employerAction?: string;
  candidateAction?: string;
  conversationType?: string;
  quickDate?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
}): Promise<EmployerMessageConversationListResult> {
  const response = await apiClient.get<
    ApiSuccess<EmployerMessageConversationListResult>
  >("/notifications/me/conversations", {
    params: {
      page: options?.page ?? 1,
      limit: options?.limit ?? 20,
      search: options?.search || undefined,
      readStatus: options?.readStatus ?? "all",
      category: options?.category ?? "all",
      publicJobId: options?.publicJobId || undefined,
      applicationStatus: options?.applicationStatus ?? "all",
      hasType: options?.hasType ?? "all",
      employerAction: options?.employerAction ?? "all",
      candidateAction: options?.candidateAction ?? "all",
      conversationType: options?.conversationType ?? "all",
      quickDate: options?.quickDate ?? "all",
      dateFrom: options?.dateFrom || undefined,
      dateTo: options?.dateTo || undefined,
      sort: options?.sort ?? "newest",
    },
  });

  return response.data.data;
}

export async function fetchConversationTimeline(
  applicationId: string,
  options?: { page?: number; limit?: number },
): Promise<EmployerMessageTimelineResult> {
  const response = await apiClient.get<
    ApiSuccess<EmployerMessageTimelineResult>
  >(`/notifications/me/conversations/${applicationId}/timeline`, {
    params: {
      page: options?.page ?? 1,
      limit: options?.limit ?? 50,
    },
  });

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

export async function markConversationNotificationsAsRead(
  applicationId: string,
): Promise<number> {
  const response = await apiClient.post<ApiSuccess<{ updatedCount: number }>>(
    `/notifications/me/conversations/${applicationId}/read`,
  );
  return response.data.data.updatedCount;
}

export async function markAllNotificationsAsRead(): Promise<number> {
  const response = await apiClient.post<ApiSuccess<{ updatedCount: number }>>(
    "/notifications/me/read-all",
  );
  return response.data.data.updatedCount;
}
