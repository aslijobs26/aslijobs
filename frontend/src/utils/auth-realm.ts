import { getEmployerAccessToken } from "@/utils/employer-auth-storage";
import { getJobSeekerAccessToken } from "@/utils/job-seeker-auth-storage";

export type AuthRealm = "employer" | "job-seeker";

export function hasEmployerSession(): boolean {
  return Boolean(getEmployerAccessToken());
}

export function hasJobSeekerSession(): boolean {
  return Boolean(getJobSeekerAccessToken());
}

export function hasConflictingAuthSessions(): boolean {
  return hasEmployerSession() && hasJobSeekerSession();
}

/**
 * Single canonical active realm for UI and routing.
 * Employer wins when legacy dual-token state is detected so recovery is deterministic.
 */
export function getActiveAuthRealm(): AuthRealm | null {
  if (hasEmployerSession()) {
    return "employer";
  }

  if (hasJobSeekerSession()) {
    return "job-seeker";
  }

  return null;
}

export function isEmployerAuthActive(): boolean {
  return getActiveAuthRealm() === "employer";
}

export function isJobSeekerAuthActive(): boolean {
  return getActiveAuthRealm() === "job-seeker";
}
