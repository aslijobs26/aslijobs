import type {
  OperationsEmployerListItem,
  OperationsEmployerStatus,
  OperationsEmployerVerificationStatus,
} from "../../../types/operations-employers";

const OPERATIONS_DISPLAY_TIMEZONE = "Asia/Kolkata";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: OPERATIONS_DISPLAY_TIMEZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
};

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: OPERATIONS_DISPLAY_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
};

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
    date: new Intl.DateTimeFormat("en-IN", DATE_FORMAT).format(date),
    time: new Intl.DateTimeFormat("en-IN", TIME_FORMAT).format(date),
  };
}

export function formatEmployerRegisteredParts(employer: {
  registeredAt: string | null;
  registeredAtDate?: string;
  registeredAtTime?: string;
}): { date: string; time: string } {
  const formatted = formatEmployerDateTime(employer.registeredAt);
  if (formatted.date !== "—") {
    return formatted;
  }

  return {
    date: employer.registeredAtDate?.trim() || "—",
    time: employer.registeredAtTime?.trim() || "",
  };
}

export function formatEmployerRegisteredLabel(employer: {
  registeredAt: string | null;
  registeredAtDate?: string;
  registeredAtTime?: string;
}): string {
  const parts = formatEmployerRegisteredParts(employer);
  if (!parts.time) {
    return parts.date;
  }
  return `${parts.date} ${parts.time}`;
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

/**
 * Display-only Employer ID for Operations UI.
 * Example: `…08f43a34` → `AJ-EMP-08F43A34`
 */
export function formatEmployerDisplayId(id: string): string {
  if (!id) return "—";
  const cleaned = id.replace(/[^a-fA-F0-9]/g, "");
  const segment =
    cleaned.length >= 8
      ? cleaned.slice(-8).toUpperCase()
      : cleaned.toUpperCase();
  return `AJ-EMP-${segment || "00000000"}`;
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

/** Same industry / account fallback used by the employers table. */
export function industryOrAccountLabel(
  employer: OperationsEmployerListItem,
): string {
  const industry = employer.industry?.trim();
  if (industry && industry !== "—") return industry;

  const accountType = employer.accountType?.toLowerCase().trim() || "";
  if (accountType === "individual") return "Individual account";

  if (accountType === "consultancy" || accountType === "company") {
    const name =
      employer.companyName?.trim() || employer.displayName?.trim() || "";
    if (name && name !== "—") return name;
    return accountType === "consultancy" ? "Consultancy" : "Company";
  }

  const organizationType = employer.organizationType?.trim();
  if (organizationType && organizationType !== "—") return organizationType;

  return "—";
}

