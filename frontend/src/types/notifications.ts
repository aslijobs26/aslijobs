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
  | "offer_accepted"
  | "offer_declined"
  | "application_selected"
  | "application_joined"
  | "application_did_not_join"
  | "application_rejected"
  | "application_withdrawn"
  | "candidate_withdrawn"
  | "job_closed"
  | "job_approved"
  | "job_rejected"
  | "job_live_changes_approved"
  | "job_live_changes_rejected"
  | "employer_verification_approved"
  | "employer_verification_rejected"
  | "employer_verification_documents_requested";

/**
 * Render-time translation hint. `key` points into the notification i18n
 * bundle; stored title/body stay the English source of truth.
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
  template?: NotificationTemplate | null;
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

export type NotificationSummary = {
  all: number;
  unread: number;
  application: number;
  interview: number;
  offer: number;
  system: number;
};

export type NotificationReadStatusFilter = "all" | "unread" | "read";

export type NotificationCategoryFilter = "all" | NotificationCategory;
