import type {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_RECIPIENT_TYPES,
  NOTIFICATION_TYPES,
} from "./notification.constants.js";

export type NotificationRecipientType =
  (typeof NOTIFICATION_RECIPIENT_TYPES)[number];

export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationChannels = {
  inApp: boolean;
  whatsapp: boolean;
  email: boolean;
  push: boolean;
};

/**
 * Key + dynamic values for translating a notification at render time.
 * `params` is null when the row predates recorded params (keep stored body).
 */
export type NotificationTemplate = {
  key: string;
  params: Record<string, string> | null;
};

export type NotificationListItem = {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  priority: NotificationPriority;
  referenceType: string;
  referenceId: string;
  actionPath: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  template: NotificationTemplate;
};

/** Employer Messages timeline bubble alignment. */
export type NotificationConversationDirection = "incoming" | "outgoing";

export type NotificationConversationTimelineItem = NotificationListItem & {
  direction: NotificationConversationDirection;
};

export type NotificationConversationTimelineResult = {
  /** Oldest → newest within the page; page 1 holds the newest activity. */
  notifications: NotificationConversationTimelineItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasOlder: boolean;
    olderCursor: string | null;
  };
};

export type NotificationListResult = {
  notifications: NotificationListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
};

/** Inbox totals for Notification Summary widgets (unfiltered by search). */
export type NotificationSummary = {
  all: number;
  unread: number;
  application: number;
  interview: number;
  offer: number;
  system: number;
};

/**
 * `application` threads belong to one candidate application; `job` threads are
 * Operations notices about a job listing (referenceId is the job id).
 */
export type NotificationConversationReferenceType = "application" | "job";

/** Employer Messages: one conversation per application. */
export type NotificationConversationListItem = {
  /** Thread reference id: application id, or job id for `job` threads. */
  applicationId: string;
  referenceType: NotificationConversationReferenceType;
  publicJobId: string;
  jobTitle: string;
  candidateName: string;
  candidatePhone: string;
  /** Job seeker WhatsApp verification; always false for `job` threads. */
  candidateVerified: boolean;
  applicationStatus: string;
  latestNotification: NotificationListItem;
  unreadCount: number;
  messageCount: number;
  lastActivityAt: string;
  /** Per-employer thread state; never changes the notifications themselves. */
  starred: boolean;
  archived: boolean;
  muted: boolean;
};

/** Which slice of threads to list. Inbox hides archived threads. */
export type NotificationConversationView = "inbox" | "starred" | "archived";

export type NotificationConversationFlag = "starred" | "archived" | "muted";

export type NotificationConversationState = {
  applicationId: string;
  starred: boolean;
  archived: boolean;
  muted: boolean;
};

/** Unfiltered Messages KPIs for the employer (independent of list filters). */
export type NotificationConversationStats = {
  /** Inbox threads (archived excluded). */
  totalConversations: number;
  /** Inbox threads with unread notifications (archived excluded). */
  unreadConversations: number;
  starredConversations: number;
  archivedConversations: number;
  /** Application threads whose application is not joined/did_not_join/rejected/withdrawn. */
  activeHiringConversations: number;
  /** Interview scheduled/updated/completed/cancelled events in the last 7 days. */
  interviewEventsLast7Days: number;
};

export type NotificationConversationViewCounts = {
  inbox: number;
  unread: number;
  starred: number;
  archived: number;
};

/** Filters shared by the Messages list, tab counts and CSV export. */
export type NotificationConversationFilters = {
  employerId: string;
  search: string;
  readStatus: "all" | "unread" | "read";
  category: "all" | NotificationCategory;
  publicJobId?: string;
  applicationStatus?: string;
  hasType?: string;
  employerAction?: string;
  candidateAction?: string;
  conversationType?: string;
  dateFrom?: string;
  dateTo?: string;
  quickDate?: string;
  view?: NotificationConversationView;
  /** Drop muted threads (sidebar badge); the Messages list keeps them. */
  excludeMuted?: boolean;
};

export type NotificationConversationListResult = {
  conversations: NotificationConversationListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** Null when the request opted out with includeStats=false. */
  stats: NotificationConversationStats | null;
  /**
   * Tab counts under the current filters (read status / view ignored).
   * Null when the request opted out with includeStats=false.
   */
  viewCounts: NotificationConversationViewCounts | null;
  /** Empty when the request opted out with includeStats=false. */
  jobFacets: Array<{
    publicJobId: string;
    jobTitle: string;
    count: number;
  }>;
};

export type CreateNotificationInput = {
  recipientType: NotificationRecipientType;
  recipientId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  priority?: NotificationPriority;
  referenceType?: string;
  referenceId?: string;
  actionPath?: string;
  channels?: Partial<NotificationChannels>;
  metadata?: Record<string, unknown>;
};

export type ApplicationNotificationInterviewSummary = {
  date?: string;
  time?: string;
  mode?: string;
  meetingLink?: string;
  venue?: string;
};

export type ApplicationNotificationContext = {
  applicationId: string;
  jobSeekerId: string;
  employerId: string;
  publicJobId: string;
  jobTitle: string;
  companyName: string;
  candidateName?: string;
  interview?: ApplicationNotificationInterviewSummary;
  cancellationReason?: string;
};
