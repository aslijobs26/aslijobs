import type { OperationsApplicationStatus } from "../../../types/operations-candidates";

export function formatCandidateDateTime(iso: string | null): {
  date: string;
  time: string;
} {
  if (!iso) {
    return { date: "—", time: "" };
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { date: "—", time: "" };
  }

  return {
    date: new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date),
  };
}

export function formatCandidateDateTimeFull(iso: string | null): string {
  const parts = formatCandidateDateTime(iso);
  if (!parts.time) {
    return parts.date;
  }
  return `${parts.date}, ${parts.time}`;
}

export function candidateAvatarInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function applicationStatusBadgeVariant(
  status: OperationsApplicationStatus | string | null,
): "default" | "candidate" | "job" | "high" | "medium" | "low" {
  if (!status) {
    return "low";
  }

  switch (status) {
    case "submitted":
    case "viewed":
      return "candidate";
    case "under_review":
      return "job";
    case "shortlisted":
    case "selected":
    case "joined":
      return "default";
    case "rejected":
    case "withdrawn":
      return "high";
    case "interview_scheduled":
    case "interview_completed":
    case "offer_sent":
      return "medium";
    default:
      return "low";
  }
}

/** Last 8 hex chars of a Mongo ObjectId (uppercase). */
export function shortApplicationId(id: string): string {
  if (!id) return "—";
  return id.slice(-8).toUpperCase();
}

/**
 * Display-only Candidate ID for Operations UI.
 * Underlying storage/API IDs are unchanged; this formats the short unique suffix.
 * Example: `…08f43a34` → `AJ-CAN-08F43A34`
 */
export function formatCandidateDisplayId(id: string): string {
  if (!id) return "—";
  return `AJ-CAN-${shortApplicationId(id)}`;
}
