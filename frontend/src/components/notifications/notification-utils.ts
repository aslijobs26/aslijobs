import type { NotificationType } from "@/types/notifications";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  Gift,
  UserMinus,
  XCircle,
  type LucideIcon,
} from "lucide-react";

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
