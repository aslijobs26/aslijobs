import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";

export const EMPLOYER_VERIFICATION_REQUIRED_CODE =
  "EMPLOYER_VERIFICATION_REQUIRED" as const;

export type EmployerJobVerificationAction =
  | "submit"
  | "publish"
  | "resume"
  | "reactivate"
  | "live_edit"
  | "operations_approve"
  | "operations_publish";

export type EmployerVerificationSnapshot = {
  _id?: { toString(): string } | string | null;
  verificationStatus?: string | null;
};

const ACTION_MESSAGES: Record<EmployerJobVerificationAction, string> = {
  submit: "Your employer account must be verified before you can post a job.",
  publish:
    "Your employer account must be verified before this job can be published.",
  resume:
    "Your employer account must be verified before you can resume this job.",
  reactivate:
    "Your employer account must be verified before you can reactivate this job.",
  live_edit:
    "Your employer account must be verified before you can submit live job changes.",
  operations_approve:
    "This job cannot be published because the employer account is not verified.",
  operations_publish:
    "This job cannot be published because the employer account is not verified.",
};

/**
 * Normalize employer account verification for job-publication gates.
 * Null/empty is treated as pending (never inferred from WhatsApp).
 */
export function resolveEmployerVerificationStatus(
  employer: EmployerVerificationSnapshot | null | undefined,
): "pending" | "verified" | "rejected" {
  const raw = String(employer?.verificationStatus ?? "")
    .trim()
    .toLowerCase();

  if (raw === "verified" || raw === "approved") {
    return "verified";
  }
  if (raw === "rejected") {
    return "rejected";
  }
  return "pending";
}

export function isEmployerVerifiedForJobs(
  employer: EmployerVerificationSnapshot | null | undefined,
): boolean {
  return resolveEmployerVerificationStatus(employer) === "verified";
}

/**
 * Central server-side gate: employer account verification is a prerequisite
 * for employer-controlled (and Operations approval) job publication paths.
 *
 * Does NOT replace job approval — verified employers still submit to
 * pending_approval unless an Operations-trusted path intentionally publishes.
 */
export function assertEmployerVerifiedForJobAction(
  employer: EmployerVerificationSnapshot | null | undefined,
  action: EmployerJobVerificationAction,
): void {
  if (isEmployerVerifiedForJobs(employer)) {
    return;
  }

  const verificationStatus = resolveEmployerVerificationStatus(employer);
  const employerId =
    employer?._id != null ? String(employer._id) : undefined;

  console.warn("[jobs] employer verification required", {
    action,
    employerId,
    verificationStatus,
  });

  throw new AppError(ACTION_MESSAGES[action], HTTP_STATUS.FORBIDDEN, {
    code: EMPLOYER_VERIFICATION_REQUIRED_CODE,
    verificationStatus,
  });
}

/**
 * Public visibility: employer-created jobs require a verified employer.
 * Operations-created jobs keep existing trusted publication semantics.
 */
export function isEmployerCreatedJobSource(
  creationSource: string | null | undefined,
): boolean {
  return String(creationSource ?? "employer").trim().toLowerCase() !== "operations";
}
