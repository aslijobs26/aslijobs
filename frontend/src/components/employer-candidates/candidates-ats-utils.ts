import {
  EMPLOYER_APPLICATION_STATUS_LABELS,
  type EmployerApplicationStatus,
} from "@/types/employer-applications";

export function getCandidateInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "C";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function formatCandidateDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatCandidateDateTime(
  value: string | null | undefined,
): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function employerApplicationStatusClass(
  status: EmployerApplicationStatus,
): string {
  switch (status) {
    case "shortlisted":
    case "selected":
    case "offer_sent":
    case "joined":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "interview_scheduled":
    case "interview_completed":
    case "under_review":
    case "viewed":
      return "bg-sky-50 text-sky-800 ring-sky-200";
    case "rejected":
    case "withdrawn":
      return "bg-red-50 text-red-700 ring-red-200";
    default:
      return "bg-primary-light/50 text-muted ring-border-subtle";
  }
}

export function buildWhatsAppHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return null;
  }
  const withCountry =
    digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, "");
  if (withCountry.length < 10) {
    return null;
  }
  return `https://wa.me/${withCountry}`;
}

export function buildTelHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return null;
  }
  return `tel:+${digits.length === 10 ? `91${digits}` : digits}`;
}

export function buildSmsHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return null;
  }
  const withCountry =
    digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, "");
  if (withCountry.length < 10) {
    return null;
  }
  return `sms:+${withCountry}`;
}

export function ageFromDateOfBirth(
  dateOfBirth: string | null | undefined,
): string | null {
  if (!dateOfBirth) {
    return null;
  }
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
    age -= 1;
  }
  if (age < 0 || age > 120) {
    return null;
  }
  return String(age);
}

export function formatExpectedSalary(
  amount: number | null | undefined,
  period: string | null | undefined,
): string {
  if (typeof amount !== "number") {
    return "Not set";
  }
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
  if (period === "per-year") {
    return `${formatted} / year`;
  }
  if (period === "per-day") {
    return `${formatted} / day`;
  }
  return `${formatted} / month`;
}

export function formatTimelineActivityTitle(input: {
  status: EmployerApplicationStatus;
  remark?: string | null;
}): string {
  const remark = input.remark?.trim() ?? "";
  if (remark.startsWith("Interview Cancelled")) {
    return "Interview Cancelled";
  }
  if (
    remark.startsWith("Interview Scheduled") ||
    remark.startsWith("Interview Rescheduled")
  ) {
    return remark;
  }
  return EMPLOYER_APPLICATION_STATUS_LABELS[input.status] ?? input.status;
}

/** Parses cancel remark: `Interview Cancelled by {name}. Reason: {reason}` */
export function parseInterviewCancelledRemark(remark: string | null | undefined): {
  byName: string;
  reason: string;
} | null {
  const value = remark?.trim() ?? "";
  if (!value.startsWith("Interview Cancelled")) {
    return null;
  }
  const byMatch = /^Interview Cancelled by\s+(.+?)\.\s*Reason:\s*(.+)$/i.exec(
    value,
  );
  if (byMatch) {
    return {
      byName: byMatch[1].trim(),
      reason: byMatch[2].trim(),
    };
  }
  return { byName: "", reason: value };
}
