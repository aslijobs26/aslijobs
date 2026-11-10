import { apiClient } from "@/services/api-client";
import type {
  EmployerMessageBulkReadStateResult,
  EmployerMessageConversationFlag,
  EmployerMessageConversationListResult,
  EmployerMessageConversationState,
  EmployerMessageConversationView,
  EmployerMessageTimelineResult,
} from "@/types/employer-messages";
import type {
  NotificationCategoryFilter,
  NotificationListItem,
  NotificationListResult,
  NotificationReadStatusFilter,
  NotificationSummary,
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
  summary: (scope: NotificationRecipientScope) =>
    ["notifications", scope, "summary"] as const,
};

export const employerMessageQueryKeys = {
  all: ["employer", "messages"] as const,
  conversations: ["employer", "messages", "conversations"] as const,
  stats: ["employer", "messages", "stats"] as const,
  /** Lightweight newest-thread probe used to detect new Messages activity. */
  activity: ["employer", "messages", "activity"] as const,
  timelines: ["employer", "messages", "timeline"] as const,
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

export type EmployerConversationFilterParams = {
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
  view?: EmployerMessageConversationView;
  /** Drop muted threads (sidebar badge); the Messages page keeps them. */
  excludeMuted?: boolean;
};

function conversationFilterParams(options?: EmployerConversationFilterParams) {
  return {
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
    view: options?.view && options.view !== "inbox" ? options.view : undefined,
    excludeMuted: options?.excludeMuted ? "true" : undefined,
  };
}

export async function fetchNotificationConversations(
  options?: EmployerConversationFilterParams & {
    page?: number;
    limit?: number;
    sort?: string;
    /** Skip unfiltered KPI + job facet aggregation when only the list is needed. */
    includeStats?: boolean;
  },
): Promise<EmployerMessageConversationListResult> {
  const response = await apiClient.get<
    ApiSuccess<EmployerMessageConversationListResult>
  >("/notifications/me/conversations", {
    params: {
      page: options?.page ?? 1,
      limit: options?.limit ?? 20,
      ...conversationFilterParams(options),
      sort: options?.sort ?? "newest",
      includeStats: options?.includeStats === false ? "false" : undefined,
    },
  });

  return response.data.data;
}

export async function setConversationFlag(
  applicationId: string,
  flag: EmployerMessageConversationFlag,
  value: boolean,
): Promise<EmployerMessageConversationState> {
  const url = `/notifications/me/conversations/${applicationId}/${flag}`;
  const response = value
    ? await apiClient.put<ApiSuccess<EmployerMessageConversationState>>(url)
    : await apiClient.delete<ApiSuccess<EmployerMessageConversationState>>(
        url,
      );
  return response.data.data;
}

export async function bulkUpdateConversationReadState(
  applicationIds: string[],
  action: "read" | "unread",
): Promise<EmployerMessageBulkReadStateResult> {
  const response = await apiClient.post<
    ApiSuccess<EmployerMessageBulkReadStateResult>
  >("/notifications/me/conversations/bulk", { applicationIds, action });
  return response.data.data;
}

async function readBlobErrorMessage(error: unknown): Promise<void> {
  const data =
    typeof error === "object" && error !== null && "response" in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined;
  if (!(data instanceof Blob)) {
    return;
  }
  const text = await data.text();
  try {
    const parsed = JSON.parse(text) as { message?: string };
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      throw new Error(parsed.message.trim());
    }
  } catch (parsedError) {
    if (parsedError instanceof Error && parsedError.name !== "SyntaxError") {
      throw parsedError;
    }
  }
}

export async function exportEmployerMessagesCsv(
  options?: EmployerConversationFilterParams,
): Promise<{ blob: Blob; fileName: string }> {
  try {
    const response = await apiClient.get<Blob>(
      "/notifications/me/conversations/export",
      { params: conversationFilterParams(options), responseType: "blob" },
    );

    const disposition = response.headers["content-disposition"];
    let fileName = "Messages_History.csv";
    if (typeof disposition === "string") {
      const matched = /filename="?([^"]+)"?/i.exec(disposition);
      if (matched?.[1]) {
        fileName = matched[1];
      }
    }

    return { blob: response.data, fileName };
  } catch (error) {
    await readBlobErrorMessage(error);
    throw error;
  }
}

/** Newest page first; pass `before` (pagination.olderCursor) for older pages. */
export async function fetchConversationTimeline(
  applicationId: string,
  options?: { limit?: number; before?: string | null },
): Promise<EmployerMessageTimelineResult> {
  const response = await apiClient.get<
    ApiSuccess<EmployerMessageTimelineResult>
  >(`/notifications/me/conversations/${applicationId}/timeline`, {
    params: {
      limit: options?.limit ?? 50,
      before: options?.before || undefined,
    },
  });

  return response.data.data;
}

export async function markConversationNotificationsAsUnread(
  applicationId: string,
): Promise<{ notificationId: string; unreadCount: number }> {
  const response = await apiClient.post<
    ApiSuccess<{ notificationId: string; unreadCount: number }>
  >(`/notifications/me/conversations/${applicationId}/unread`);
  return response.data.data;
}

export async function fetchNotificationUnreadCount(): Promise<number> {
  const response = await apiClient.get<ApiSuccess<{ unreadCount: number }>>(
    "/notifications/me/unread-count",
  );
  return response.data.data.unreadCount;
}

export async function fetchNotificationSummary(): Promise<NotificationSummary> {
  const response = await apiClient.get<ApiSuccess<NotificationSummary>>(
    "/notifications/me/summary",
  );
  return response.data.data;
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

export async function deleteNotification(
  notificationId: string,
): Promise<void> {
  await apiClient.delete<ApiSuccess<{ deleted: true }>>(
    `/notifications/me/${notificationId}`,
  );
}

export async function clearAllNotifications(): Promise<number> {
  const response = await apiClient.post<ApiSuccess<{ clearedCount: number }>>(
    "/notifications/me/clear-all",
  );
  return response.data.data.clearedCount;
}
