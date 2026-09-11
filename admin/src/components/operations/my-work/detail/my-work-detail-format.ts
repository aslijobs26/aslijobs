import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  PauseCircle,
  Play,
  Plus,
  Settings,
  User,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type {
  OperationsWorkDetail,
  OperationsWorkHistoryEntry,
  WorkItemStatus,
} from "../../../../types/operations-work";

export function formatWorkDetailDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatWorkDetailDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatWorkDueControl(iso: string | null | undefined): string {
  if (!iso) return "Set due date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Set due date";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

export function formatHistoryEventLabel(entry: OperationsWorkHistoryEntry): string {
  const action = entry.action.trim() || "work.updated";
  if (entry.toStatus && entry.fromStatus !== entry.toStatus) {
    return `${action} → ${entry.toStatus}`;
  }
  if (entry.toStatus && !entry.fromStatus) {
    return `${action} → ${entry.toStatus}`;
  }
  return action;
}

export function historyEventVisual(action: string): {
  Icon: LucideIcon;
  iconClassName: string;
  iconBgClassName: string;
} {
  const key = action.toLowerCase();
  if (key.includes("created")) {
    return {
      Icon: Plus,
      iconClassName: "text-success",
      iconBgClassName: "bg-success/15",
    };
  }
  if (key.includes("due")) {
    return {
      Icon: Calendar,
      iconClassName: "text-sky-600",
      iconBgClassName: "bg-sky-500/15",
    };
  }
  if (key.includes("claim") || key.includes("assign") || key.includes("reassign")) {
    return {
      Icon: UserPlus,
      iconClassName: "text-violet-600",
      iconBgClassName: "bg-violet-500/15",
    };
  }
  if (key.includes("priority")) {
    return {
      Icon: Flag,
      iconClassName: "text-orange-600",
      iconBgClassName: "bg-orange-500/15",
    };
  }
  if (key.includes("started") || key.includes("resumed")) {
    return {
      Icon: Play,
      iconClassName: "text-sky-600",
      iconBgClassName: "bg-sky-500/15",
    };
  }
  if (key.includes("waiting")) {
    return {
      Icon: PauseCircle,
      iconClassName: "text-muted",
      iconBgClassName: "bg-border-subtle",
    };
  }
  if (key.includes("completed")) {
    return {
      Icon: CheckCircle2,
      iconClassName: "text-success",
      iconBgClassName: "bg-success/15",
    };
  }
  return {
    Icon: Clock,
    iconClassName: "text-muted",
    iconBgClassName: "bg-border-subtle",
  };
}

export function workTypeIcon(type: string): LucideIcon {
  switch (type) {
    case "job_operations":
      return Briefcase;
    case "verification":
    case "employer":
      return Building2;
    default:
      return Briefcase;
  }
}

export function metaFieldIcon(
  field: "type" | "related" | "assignee" | "createdBy" | "due" | "waiting",
): { Icon: LucideIcon; iconClassName: string; iconBgClassName: string } {
  switch (field) {
    case "type":
      return {
        Icon: Briefcase,
        iconClassName: "text-sky-600",
        iconBgClassName: "bg-sky-500/15",
      };
    case "related":
      return {
        Icon: Building2,
        iconClassName: "text-violet-600",
        iconBgClassName: "bg-violet-500/15",
      };
    case "assignee":
      return {
        Icon: User,
        iconClassName: "text-orange-600",
        iconBgClassName: "bg-orange-500/15",
      };
    case "createdBy":
      return {
        Icon: Settings,
        iconClassName: "text-muted",
        iconBgClassName: "bg-border-subtle",
      };
    case "due":
      return {
        Icon: Calendar,
        iconClassName: "text-danger",
        iconBgClassName: "bg-danger/10",
      };
    case "waiting":
      return {
        Icon: Clock,
        iconClassName: "text-muted",
        iconBgClassName: "bg-border-subtle",
      };
  }
}

export interface StatusTimelineStep {
  id: WorkItemStatus | "queued";
  label: string;
  at: string | null;
  done: boolean;
  current: boolean;
}

const TIMELINE_ORDER: Array<{ id: WorkItemStatus; label: string }> = [
  { id: "queued", label: "Queued" },
  { id: "assigned", label: "Assigned" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

function firstHistoryAt(
  history: OperationsWorkHistoryEntry[],
  matcher: (entry: OperationsWorkHistoryEntry) => boolean,
): string | null {
  const match = [...history]
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .find(matcher);
  return match?.at ?? null;
}

export function buildStatusTimeline(
  item: OperationsWorkDetail,
): StatusTimelineStep[] {
  const statusRank: Record<WorkItemStatus, number> = {
    queued: 0,
    assigned: 1,
    in_progress: 2,
    waiting: 2,
    completed: 3,
    cancelled: -1,
  };
  const currentRank = statusRank[item.status] ?? 0;

  const queuedAt =
    firstHistoryAt(
      item.history,
      (entry) =>
        entry.toStatus === "queued" || entry.action.includes("created"),
    ) ?? item.createdAt;
  const assignedAt =
    item.assignedAt ??
    firstHistoryAt(
      item.history,
      (entry) =>
        entry.toStatus === "assigned" ||
        entry.action.includes("claimed") ||
        entry.action.includes("assigned"),
    );
  const inProgressAt = firstHistoryAt(
    item.history,
    (entry) =>
      entry.toStatus === "in_progress" ||
      entry.action.includes("started") ||
      entry.action.includes("resumed"),
  );
  const completedAt =
    item.completedAt ??
    firstHistoryAt(
      item.history,
      (entry) =>
        entry.toStatus === "completed" || entry.action.includes("completed"),
    );

  const times: Record<string, string | null> = {
    queued: queuedAt,
    assigned: assignedAt,
    in_progress: inProgressAt,
    completed: completedAt,
  };

  return TIMELINE_ORDER.map((step) => {
    const stepRank = statusRank[step.id];
    const done =
      item.status === "completed"
        ? true
        : item.status === "cancelled"
          ? false
          : stepRank < currentRank ||
            (stepRank === currentRank && Boolean(times[step.id]));
    const current =
      item.status === "waiting"
        ? step.id === "in_progress"
        : item.status === step.id;
    return {
      id: step.id,
      label: step.label,
      at: times[step.id],
      done: done || current,
      current,
    };
  });
}

export function formatTimelineClock(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function workSubtitleParts(item: OperationsWorkDetail): {
  company: string;
  role: string;
} {
  const description = item.description?.trim() ?? "";
  if (description.includes("·")) {
    const [left, ...rest] = description.split("·");
    return {
      company: left.trim() || item.relatedLabel || "—",
      role: rest.join("·").trim() || metadataString(item.metadata, "jobTitle") || "",
    };
  }
  return {
    company: item.relatedLabel || "—",
    role: metadataString(item.metadata, "jobTitle") || "",
  };
}

export function metadataString(
  metadata: Record<string, unknown>,
  key: string,
): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function primaryStatusAction(
  item: OperationsWorkDetail,
): {
  label: string;
  status: "in_progress" | "completed";
} | null {
  if (item.status === "assigned") {
    return { label: "Mark as In Progress", status: "in_progress" };
  }
  if (item.status === "waiting") {
    return { label: "Mark as In Progress", status: "in_progress" };
  }
  if (item.status === "in_progress") {
    return { label: "Mark as Completed", status: "completed" };
  }
  if (item.status === "queued" && item.assignedToUserId) {
    return { label: "Mark as In Progress", status: "in_progress" };
  }
  return null;
}
