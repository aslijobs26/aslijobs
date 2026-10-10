/**
 * Client-side UX gate for the Post Job form. The backend verification guard
 * remains the authority for every job write; this only decides whether the
 * form is worth rendering for the signed-in employer.
 *
 * Only a verified employer account can open Post Job. Pending, rejected, and
 * unknown statuses show the under-review popup instead of the form.
 */
export type EmployerJobPostingAccess = "allowed" | "under_review";

export function resolveEmployerJobPostingAccess(
  verificationStatus: string | null | undefined,
): EmployerJobPostingAccess {
  const normalized = verificationStatus?.trim().toLowerCase() ?? "";

  if (normalized === "verified" || normalized === "approved") {
    return "allowed";
  }

  return "under_review";
}
