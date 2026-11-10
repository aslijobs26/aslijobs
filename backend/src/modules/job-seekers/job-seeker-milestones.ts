import {
  evaluateJobSeekerProfileCompletion,
  type JobSeekerProfileCompletionSource,
} from "./job-seeker-profile-completion.js";

type WhatsappVerificationTarget = {
  isWhatsappVerified?: boolean | null;
  whatsappVerifiedAt?: Date | null;
};

type ProfileCompletionTarget = JobSeekerProfileCompletionSource & {
  profileCompletedAt?: Date | null;
};

/**
 * Marks the WhatsApp number verified. The timestamp is written only on the
 * unverified → verified transition, so a repeated verification keeps the
 * original date and accounts verified before tracking stay "not recorded".
 */
export function markJobSeekerWhatsappVerified(
  seeker: WhatsappVerificationTarget,
  now: Date = new Date(),
): void {
  const wasVerified = seeker.isWhatsappVerified === true;
  seeker.isWhatsappVerified = true;
  if (!wasVerified && !seeker.whatsappVerifiedAt) {
    seeker.whatsappVerifiedAt = now;
  }
}

export function isJobSeekerProfileComplete(
  seeker: JobSeekerProfileCompletionSource,
): boolean {
  return evaluateJobSeekerProfileCompletion(seeker).isComplete;
}

/**
 * Business rule: `profileCompletedAt` is the first observed incomplete →
 * complete transition of the required apply sections. Once set it is never
 * changed, so later edits — or becoming incomplete and complete again — keep
 * the original date. Profiles already complete before tracking stay null.
 *
 * `wasComplete` must be evaluated before the caller applies its changes.
 */
export function recordJobSeekerProfileCompletion(
  seeker: ProfileCompletionTarget,
  wasComplete: boolean,
  now: Date = new Date(),
): boolean {
  if (seeker.profileCompletedAt || wasComplete) {
    return false;
  }
  if (!isJobSeekerProfileComplete(seeker)) {
    return false;
  }
  seeker.profileCompletedAt = now;
  return true;
}
