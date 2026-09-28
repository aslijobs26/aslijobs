import { EMPLOYER_VERIFICATION_REQUIRED_CODE } from "../constants/post-job";
import { normalizeApiError } from "./normalize-api-error";
import { isAxiosError } from "axios";

export type EmployerVerificationGateStatus = "pending" | "rejected";

export type EmployerVerificationRequiredDetails = {
  isVerificationRequired: boolean;
  draftSaved: boolean;
  draftJobId: string | null;
  jobPublicId: string | null;
  verificationStatus: EmployerVerificationGateStatus | null;
  jobStatus: "draft" | null;
};

function readTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readDetailsRecord(error: unknown): Record<string, unknown> | null {
  if (!isAxiosError(error)) {
    return null;
  }

  const details = error.response?.data?.details;
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return null;
  }

  return details as Record<string, unknown>;
}

function resolveVerificationStatus(
  value: unknown,
): EmployerVerificationGateStatus | null {
  const raw = readTrimmedString(value)?.toLowerCase();
  if (raw === "rejected") {
    return "rejected";
  }
  if (raw === "pending" || raw === "verified" || raw === "approved") {
    return raw === "verified" || raw === "approved" ? null : "pending";
  }
  return raw ? "pending" : null;
}

export function readEmployerVerificationRequiredDetails(
  error: unknown,
): EmployerVerificationRequiredDetails {
  const details = readDetailsRecord(error);
  const draftJobId = readTrimmedString(details?.jobId);
  const jobPublicId = readTrimmedString(details?.jobPublicId);
  const jobStatus = readTrimmedString(details?.status);
  const detailsCode = readTrimmedString(details?.code);
  const normalizedCode = normalizeApiError(error).code;

  return {
    isVerificationRequired:
      detailsCode === EMPLOYER_VERIFICATION_REQUIRED_CODE ||
      normalizedCode === EMPLOYER_VERIFICATION_REQUIRED_CODE,
    draftSaved: details?.draftSaved === true,
    draftJobId,
    jobPublicId,
    verificationStatus: resolveVerificationStatus(details?.verificationStatus),
    jobStatus: jobStatus === "draft" ? "draft" : null,
  };
}
