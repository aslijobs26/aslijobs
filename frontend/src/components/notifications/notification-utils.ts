import type {
  NotificationCategory,
  NotificationType,
} from "@/types/notifications";
import {
  Bell,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  Gift,
  Inbox,
  Layers,
  MailOpen,
  UserCheck,
  UserMinus,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export type NotificationIconTone =
  | "teal"
  | "blue"
  | "purple"
  | "amber"
  | "rose"
  | "emerald"
  | "slate";

const ICON_TONE_CLASS: Record<NotificationIconTone, string> = {
  teal: "bg-primary-light text-primary",
  blue: "bg-resource-salary-surface text-resource-salary-icon",
  purple: "bg-resource-resume-surface text-resource-resume-icon",
  amber: "bg-resource-interview-surface text-resource-interview-icon",
  rose: "bg-primary-light text-pin-state",
  emerald: "bg-resource-guide-surface text-resource-guide-icon",
  slate: "bg-primary-light/70 text-nav",
};

export function formatNotificationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function notificationIcon(type: NotificationType): LucideIcon {
  switch (type) {
    case "application_viewed":
      return Eye;
    case "application_shortlisted":
    case "application_under_review":
      return UserCheck;
    case "interview_scheduled":
    case "interview_updated":
    case "interview_completed":
    case "interview_cancelled":
      return CalendarDays;
    case "offer_sent":
    case "application_selected":
      return Gift;
    case "application_rejected":
      return XCircle;
    case "application_joined":
      return CheckCircle2;
    case "application_withdrawn":
    case "candidate_withdrawn":
      return UserMinus;
    case "application_received":
      return Briefcase;
    default:
      return FileText;
  }
}

export function notificationIconTone(type: NotificationType): NotificationIconTone {
  switch (type) {
    case "application_viewed":
      return "blue";
    case "application_shortlisted":
    case "application_under_review":
      return "purple";
    case "interview_scheduled":
    case "interview_updated":
    case "interview_completed":
    case "interview_cancelled":
      return "amber";
    case "offer_sent":
    case "application_selected":
      return "emerald";
    case "application_rejected":
      return "rose";
    case "application_joined":
      return "teal";
    default:
      return "teal";
  }
}

export function notificationIconToneClass(type: NotificationType): string {
  return ICON_TONE_CLASS[notificationIconTone(type)];
}

export function summaryCategoryIcon(
  key: "all" | "unread" | NotificationCategory,
): LucideIcon {
  switch (key) {
    case "all":
      return Inbox;
    case "unread":
      return MailOpen;
    case "application":
      return Briefcase;
    case "interview":
      return CalendarDays;
    case "offer":
      return Gift;
    case "system":
      return Bell;
    default:
      return Layers;
  }
}
