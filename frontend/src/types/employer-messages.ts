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
  /** Oldest → newest within the page; the first page holds the newest activity. */
  notifications: EmployerMessageTimelineItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasOlder: boolean;
    olderCursor: string | null;
  };
};

/** `job` threads are Operations notices keyed by job id, not an application. */
export type EmployerMessageConversationReferenceType = "application" | "job";

export type EmployerMessageConversation = {
  /** Thread reference id: application id, or job id for `job` threads. */
  applicationId: string;
  referenceType: EmployerMessageConversationReferenceType;
  publicJobId: string;
  jobTitle: string;
  candidateName: string;
  candidatePhone: string;
  candidateVerified: boolean;
  applicationStatus: string;
  latestNotification: NotificationListItem;
  unreadCount: number;
  messageCount: number;
  lastActivityAt: string;
  /** Employer-workspace thread state; never alters notification history. */
  starred: boolean;
  archived: boolean;
  muted: boolean;
};

export type EmployerMessageConversationView = "inbox" | "starred" | "archived";

export type EmployerMessageConversationFlag = "star" | "archive" | "mute";

export type EmployerMessageConversationState = {
  applicationId: string;
  starred: boolean;
  archived: boolean;
  muted: boolean;
};

export type EmployerMessageConversationStats = {
  /** Inbox threads (archived excluded). */
  totalConversations: number;
  /** Inbox threads with unread notifications (archived excluded). */
  unreadConversations: number;
  starredConversations: number;
  archivedConversations: number;
  activeHiringConversations: number;
  interviewEventsLast7Days: number;
};

/** Tab counts under the current filters (read status / view ignored). */
export type EmployerMessageConversationViewCounts = {
  inbox: number;
  unread: number;
  starred: number;
  archived: number;
};

export type EmployerMessageBulkReadStateResult = {
  action: "read" | "unread";
  updated: Array<{ applicationId: string; unreadCount: number }>;
  notFound: string[];
  skipped: string[];
  updatedNotificationCount: number;
};

export type EmployerMessageConversationListResult = {
  conversations: EmployerMessageConversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** Unfiltered KPIs; null when requested with includeStats=false. */
  stats: EmployerMessageConversationStats | null;
  /** Null when requested with includeStats=false. */
  viewCounts: EmployerMessageConversationViewCounts | null;
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
