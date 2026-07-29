import type {
  NotificationCategory,
  NotificationListItem,
  NotificationListResult,
  NotificationReadStatusFilter,
  NotificationCategoryFilter,
} from "@/types/notifications";

export type EmployerMessageConversationDirection = "incoming" | "outgoing";

export type EmployerMessageTimelineItem = NotificationListItem & {
  direction: EmployerMessageConversationDirection;
};

export type EmployerMessageTimelineResult = {
  notifications: EmployerMessageTimelineItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type EmployerMessageConversation = {
  applicationId: string;
  publicJobId: string;
  jobTitle: string;
  candidateName: string;
  candidatePhone: string;
  applicationStatus: string;
  latestNotification: NotificationListItem;
  unreadCount: number;
  messageCount: number;
  lastActivityAt: string;
};

export type EmployerMessageConversationListResult = {
  conversations: EmployerMessageConversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
  jobFacets: Array<{
    publicJobId: string;
    jobTitle: string;
    count: number;
  }>;
};

export type EmployerMessagesFilter =
  | "all"
  | "unread"
  | "starred"
  | NotificationCategory;

export type { NotificationListItem, NotificationListResult };
export type {
  NotificationCategory,
  NotificationCategoryFilter,
  NotificationReadStatusFilter,
};
