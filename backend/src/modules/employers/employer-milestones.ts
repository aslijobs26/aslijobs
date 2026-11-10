/**
 * Employer milestone timestamps shown in Operations activity.
 *
 * Business rules (mirroring job seeker milestones):
 * - `whatsappVerifiedAt` is set on the first unverified → verified OTP
 *   transition and never overwritten, even if a later re-registration
 *   resets the verified flag.
 * - `profileCompletedAt` is set the first time registration moves from
 *   incomplete to complete. Later edits, resubmissions or a reset followed
 *   by completing again never change it.
 * - Records completed before tracking keep null so Operations shows
 *   "Date not recorded" instead of an invented date.
 */

type EmployerWhatsappMilestone = {
  isWhatsappVerified?: boolean | null;
  whatsappVerifiedAt?: Date | null;
};

type EmployerProfileMilestone = {
  isProfileComplete?: boolean | null;
  profileCompletedAt?: Date | null;
};

export function markEmployerWhatsappVerified(
  employer: EmployerWhatsappMilestone,
  now: Date = new Date(),
): void {
  const wasVerified = employer.isWhatsappVerified === true;
  employer.isWhatsappVerified = true;
  if (!wasVerified && !employer.whatsappVerifiedAt) {
    employer.whatsappVerifiedAt = now;
  }
}

/** Marks registration complete; returns true when the first completion was recorded. */
export function markEmployerProfileComplete(
  employer: EmployerProfileMilestone,
  now: Date = new Date(),
): boolean {
  const wasComplete = employer.isProfileComplete === true;
  employer.isProfileComplete = true;
  if (wasComplete || employer.profileCompletedAt) {
    return false;
  }
  employer.profileCompletedAt = now;
  return true;
}
