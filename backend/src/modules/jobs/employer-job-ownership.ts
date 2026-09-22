import mongoose from "mongoose";

/**
 * Canonical employer ownership match for Job documents.
 *
 * Historical and Ops-assigned jobs may store the employer on `employerId`,
 * `companyId`, or both — and some legacy rows store the id as a string.
 * Operations lists are unscoped (or broadly filtered), so those jobs remain
 * visible there even when a strict `{ employerId: ObjectId }` employer query
 * returns nothing.
 *
 * Always derive the employer id from authenticated context — never from the
 * client query string.
 */
export function buildEmployerOwnedJobMatch(
  employerId: string,
): Record<string, unknown> {
  if (!mongoose.Types.ObjectId.isValid(employerId)) {
    return { _id: { $exists: false } };
  }

  const employerObjectId = new mongoose.Types.ObjectId(employerId);

  return {
    $or: [
      { employerId: employerObjectId },
      { employerId: employerId },
      { companyId: employerObjectId },
      { companyId: employerId },
    ],
  };
}

/**
 * Employer "My Jobs" / dashboard recency sort.
 *
 * Pending approval jobs always have `publishedAt: null`. Sorting primarily by
 * `publishedAt: -1` pushes those rows behind every live job (MongoDB treats
 * null as lowest), so newly submitted jobs disappear from page 1 / dashboard
 * overview even though Ops Pending Approval still shows them.
 *
 * Prefer last edit / submission activity, then createdAt.
 */
export const EMPLOYER_JOBS_LIST_SORT = {
  lastEditedAt: -1,
  submittedForApprovalAt: -1,
  createdAt: -1,
} as const;
