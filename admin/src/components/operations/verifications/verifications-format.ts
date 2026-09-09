import type { OperationsVerificationOperationalStatus } from "../../../types/operations-verifications";

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
