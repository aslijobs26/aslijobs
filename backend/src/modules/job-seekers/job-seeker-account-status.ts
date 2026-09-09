import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import type { JobSeekerAccountStatus } from "../../constants/job-seeker.constants.js";

export function normalizeJobSeekerAccountStatus(
  value: string | null | undefined,
): JobSeekerAccountStatus {
  if (value === "blocked" || value === "suspended") {
    return value;
  }
  return "active";
}

export function assertJobSeekerAccountActive(
  accountStatus: string | null | undefined,
): void {
  const status = normalizeJobSeekerAccountStatus(accountStatus);
  if (status === "blocked") {
    throw new AppError(
      "This account has been blocked. Contact support for help.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
  if (status === "suspended") {
    throw new AppError(
      "This account is temporarily suspended. Contact support for help.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
}

export function isJobSeekerAccountActive(
  accountStatus: string | null | undefined,
): boolean {
  return normalizeJobSeekerAccountStatus(accountStatus) === "active";
}
