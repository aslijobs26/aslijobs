import type { OperationsVerificationOperationalStatus } from "../../../types/operations-verifications";

const ACCOUNT_TYPE_LABELS: Readonly<Record<string, string>> = {
  individual: "Individual",
  company: "Company",
  consultancy: "Consultancy",
};

function isMissingIndustry(industry: string): boolean {
  const normalized = industry.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized === "—" ||
    normalized === "-" ||
    normalized === "unspecified"
  );
}

/** Industry when set; otherwise the employer account type (Individual, Company, Consultancy). */
export function verificationIndustryOrAccountLabel(item: {
  industry?: string | null;
  accountType?: string | null;
}): string {
  const industry = item.industry?.trim() ?? "";
  if (!isMissingIndustry(industry)) {
    return industry;
  }

  const accountType = item.accountType?.trim().toLowerCase() ?? "";
  if (!accountType) return "—";
  return (
    ACCOUNT_TYPE_LABELS[accountType] ??
    accountType.charAt(0).toUpperCase() + accountType.slice(1)
  );
}

/** Badge variants aligned to Verifications Overview screenshot colors. */
export function verificationOperationalStatusBadgeVariant(
  status: OperationsVerificationOperationalStatus | string | null | undefined,
): "default" | "medium" | "high" | "low" | "candidate" | "verification" {
  switch (status) {
    case "pending":
    case "needs_attention":
      return "medium"; // orange
    case "under_review":
      return "verification"; // blue/teal
    case "verified":
      return "candidate"; // green
    case "rejected":
    case "sla_breach":
      return "high"; // red
    default:
      return "low";
  }
}
