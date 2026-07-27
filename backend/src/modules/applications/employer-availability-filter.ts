/**
 * Maps employer Candidates "availability" query values to MongoDB match fragments.
 * Matches job seeker profile availabilityStatus (via $lookup as jobSeekerDoc).
 */

export const EMPLOYER_AVAILABILITY_FILTERS = [
  "immediate",
  "within_7",
  "within_15",
  "within_30",
  "currently_working",
] as const;

export type EmployerAvailabilityFilter =
  (typeof EMPLOYER_AVAILABILITY_FILTERS)[number];

const JOB_SEEKER_AVAILABILITY_FIELD = "jobSeekerDoc.availabilityStatus";

export function parseEmployerAvailabilityFilter(
  value: string | undefined,
): EmployerAvailabilityFilter | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return null;
  }
  if (
    (EMPLOYER_AVAILABILITY_FILTERS as readonly string[]).includes(trimmed)
  ) {
    return trimmed as EmployerAvailabilityFilter;
  }
  return null;
}

export function buildEmployerAvailabilityMatch(
  filter: EmployerAvailabilityFilter | null,
): Record<string, unknown> | null {
  if (!filter) {
    return null;
  }

  return {
    [JOB_SEEKER_AVAILABILITY_FIELD]: filter,
  };
}
