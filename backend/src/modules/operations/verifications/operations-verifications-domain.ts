import {
  isBeyondSla,
  resolveOperationalVerificationStatus,
  SLA_TARGET_DAYS,
} from "./operations-verifications-analytics.js";
import { resolveEmployerIndustryLabel } from "./operations-verifications-industry.js";
import type { OperationsVerificationOperationalStatus } from "./operations-verifications.types.js";

export { resolveEmployerIndustryLabel, SLA_TARGET_DAYS };

export function formatSlaAgeLabel(
  startIso: string | null | undefined,
  endIso: string | null | undefined = null,
  now: Date = new Date(),
): string {
  if (!startIso) {
    return "—";
  }
  const startMs = Date.parse(startIso);
  if (Number.isNaN(startMs)) {
    return "—";
  }
  const endMs = endIso ? Date.parse(endIso) : now.getTime();
  if (Number.isNaN(endMs)) {
    return "—";
  }
  const days = Math.max(
    0,
    Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24)),
  );
  return days === 1 ? "1 day" : `${days} days`;
}

export function resolveVerificationListStatus(input: {
  verificationStatus?: string | null;
  registrationStatus?: string | null;
  verificationSubmittedAt?: Date | string | null;
  createdAt?: Date | string | null;
  documentsCount: number;
  verifiedAt?: Date | string | null;
  rejectedAt?: Date | string | null;
  now?: Date;
}): {
  operationalStatus: OperationsVerificationOperationalStatus;
  statusLabel: string;
  needsAttention: boolean;
  slaBreach: boolean;
  slaLabel: string;
} {
  const resolved = resolveOperationalVerificationStatus({
    verificationStatus: input.verificationStatus,
    registrationStatus: input.registrationStatus,
    verificationSubmittedAt: input.verificationSubmittedAt,
    createdAt: input.createdAt,
    documentsCount: input.documentsCount,
    now: input.now,
  });

  const submittedAt = input.verificationSubmittedAt ?? input.createdAt ?? null;
  const decidedAt =
    resolved.status === "verified"
      ? (input.verifiedAt ?? null)
      : resolved.status === "rejected"
        ? (input.rejectedAt ?? null)
        : null;

  const decidedBeyondSla =
    Boolean(decidedAt) &&
    isBeyondSla(
      submittedAt ? new Date(submittedAt) : null,
      decidedAt ? new Date(decidedAt) : null,
    );

  const slaBreach = resolved.slaBreach || decidedBeyondSla;
  const needsAttention = resolved.needsAttention;

  let operationalStatus: OperationsVerificationOperationalStatus =
    resolved.status;
  if (
    slaBreach &&
    resolved.status !== "verified" &&
    resolved.status !== "rejected"
  ) {
    operationalStatus = "sla_breach";
  } else if (needsAttention && resolved.status === "pending") {
    operationalStatus = "needs_attention";
  }

  const statusLabel =
    resolved.status === "under_review"
      ? "Under Review"
      : resolved.status === "verified"
        ? "Verified"
        : resolved.status === "rejected"
          ? "Rejected"
          : "Pending";

  return {
    operationalStatus,
    statusLabel,
    needsAttention,
    slaBreach,
    slaLabel: formatSlaAgeLabel(
      submittedAt ? new Date(submittedAt).toISOString() : null,
      decidedAt ? new Date(decidedAt).toISOString() : null,
      input.now,
    ),
  };
}

export function resolveVerificationAllowedActions(input: {
  verificationStatus: "pending" | "verified" | "rejected" | "under_review";
  canVerify: boolean;
  canReject: boolean;
  canViewDocuments: boolean;
  canDownloadDocuments: boolean;
}): {
  canReview: boolean;
  canApprove: boolean;
  canReject: boolean;
  canRequestDocuments: boolean;
  canViewDocuments: boolean;
  canDownloadDocuments: boolean;
} {
  const isOpen =
    input.verificationStatus === "pending" ||
    input.verificationStatus === "under_review";

  return {
    canReview: isOpen,
    canApprove: isOpen && input.canVerify,
    canReject: isOpen && input.canReject,
    canRequestDocuments: isOpen && input.canReject,
    canViewDocuments: input.canViewDocuments,
    canDownloadDocuments: input.canDownloadDocuments,
  };
}
