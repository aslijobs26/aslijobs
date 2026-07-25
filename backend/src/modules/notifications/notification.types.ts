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

export type ApplicationNotificationContext = {
  applicationId: string;
  jobSeekerId: string;
  employerId: string;
  publicJobId: string;
  jobTitle: string;
  companyName: string;
  candidateName?: string;
};
