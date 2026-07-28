export const NOTIFICATION_CATEGORIES = [
  "application",
  "interview",
  "offer",
  "system",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type NotificationPriority = "low" | "normal" | "high";

export type NotificationType =
  | "application_submitted"
  | "application_received"
  | "application_viewed"
  | "application_under_review"
  | "application_shortlisted"
  | "interview_scheduled"
  | "interview_updated"
  | "interview_completed"
  | "interview_cancelled"
  | "offer_sent"
  | "application_selected"
  | "application_joined"
  | "application_rejected"
  | "application_withdrawn"
  | "candidate_withdrawn";

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

export type NotificationReadStatusFilter = "all" | "unread" | "read";

export type NotificationCategoryFilter = "all" | NotificationCategory;
