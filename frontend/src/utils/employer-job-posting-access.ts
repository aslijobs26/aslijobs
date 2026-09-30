/**
 * Client-side UX gate for the Post Job form. The backend verification guard
 * remains the authority for every job write; this only decides whether the
 * form is worth rendering for the signed-in employer.
 *
 * Mirrors backend `resolveEmployerVerificationStatus`: a missing or unknown
 * status is pending. Rejected employers keep their existing flow (form +
 * resubmission prompt on publish), so only "under_review" blocks the form.
 */
export type EmployerJobPostingAccess = "allowed" | "under_review";

export function resolveEmployerJobPostingAccess(
  verificationStatus: string | null | undefined,
): EmployerJobPostingAccess {
  const normalized = verificationStatus?.trim().toLowerCase() ?? "";

  if (
    normalized === "verified" ||
    normalized === "approved" ||
    normalized === "rejected"
  ) {
    return "allowed";
  }

  return "under_review";
}
