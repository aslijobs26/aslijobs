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
};

/** Employer Messages timeline bubble alignment. */
export type NotificationConversationDirection = "incoming" | "outgoing";

export type NotificationConversationTimelineItem = NotificationListItem & {
  direction: NotificationConversationDirection;
};

export type NotificationConversationTimelineResult = {
  notifications: NotificationConversationTimelineItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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

/** Employer Messages: one conversation per application. */
export type NotificationConversationListItem = {
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

export type NotificationConversationListResult = {
  conversations: NotificationConversationListItem[];
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
