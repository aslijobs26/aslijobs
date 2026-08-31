import type {
  OperationsEmployerStatus,
  OperationsEmployerVerificationStatus,
} from "../../../types/operations-employers";

export function formatEmployerDateTime(iso: string | null | undefined): {
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
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date),
  };
}

export function formatEmployerDateTimeFull(iso: string | null | undefined): string {
  const parts = formatEmployerDateTime(iso);
  if (!parts.time) {
    return parts.date;
  }
  return `${parts.date}, ${parts.time}`;
}

export function employerAvatarInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "EM";
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

/** Last 8 hex chars of a Mongo ObjectId formatted as EMP-XXXXXXXX. */
export function formatEmployerDisplayId(id: string): string {
  if (!id) return "—";
  const cleaned = id.replace(/[^a-fA-F0-9]/g, "");
  const segment = cleaned.length >= 8 ? cleaned.slice(-8).toUpperCase() : cleaned.toUpperCase();
  return `EMP-${segment || "00000000"}`;
}

export function verificationStatusBadgeVariant(
  status: OperationsEmployerVerificationStatus | string | null | undefined,
): "default" | "medium" | "high" | "low" {
  switch (status) {
    case "verified":
      return "default";
    case "pending":
      return "medium";
    case "rejected":
      return "high";
    default:
      return "low";
  }
}

export function employerStatusBadgeVariant(
  status: OperationsEmployerStatus | string | null | undefined,
): "default" | "medium" | "high" | "low" {
  switch (status) {
    case "active":
      return "default";
    case "suspended":
      return "high";
    case "inactive":
      return "low";
    default:
      return "low";
  }
}

export function formatIndustryOrCategory(val: string | null | undefined): string {
  if (!val) return "";
  const trimmed = val.trim();
  if (!trimmed || trimmed === "—") return "";
  return trimmed
    .replace(/[_-]+/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
    .replace(/\bAnd\b/g, "&")
    .replace(/\bIt\b/g, "IT")
    .replace(/\bHr\b/g, "HR")
    .replace(/\bAi\b/g, "AI")
    .replace(/\bBpo\b/g, "BPO")
    .replace(/\bKpo\b/g, "KPO");
}

