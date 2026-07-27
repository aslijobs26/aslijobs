/**
 * Employer Candidates location filter + autocomplete helpers.
 * Matches Job Seeker profile preferredJobLocation (via $lookup as jobSeekerDoc).
 */

const JOB_SEEKER_PREFERRED_LOCATION_FIELD =
  "jobSeekerDoc.preferredJobLocation";

export const EMPLOYER_LOCATION_AUTOCOMPLETE_MIN_QUERY = 2;
export const EMPLOYER_LOCATION_AUTOCOMPLETE_LIMIT = 20;

export function normalizeEmployerLocationQuery(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

export function escapeEmployerLocationRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildEmployerPreferredLocationMatch(
  location: string | undefined,
): Record<string, unknown> | null {
  const normalized = normalizeEmployerLocationQuery(location);
  if (!normalized) {
    return null;
  }

  return {
    [JOB_SEEKER_PREFERRED_LOCATION_FIELD]: {
      $regex: escapeEmployerLocationRegex(normalized),
      $options: "i",
    },
  };
}

/**
 * Expands stored preferred locations into unique suggestion labels:
 * full value, city segment, and state segment (when "City, State").
 */
export function buildPreferredLocationSuggestions(
  preferredLocations: string[],
  query: string,
  limit = EMPLOYER_LOCATION_AUTOCOMPLETE_LIMIT,
): string[] {
  const normalizedQuery = normalizeEmployerLocationQuery(query).toLowerCase();
  if (normalizedQuery.length < EMPLOYER_LOCATION_AUTOCOMPLETE_MIN_QUERY) {
    return [];
  }

  const unique = new Map<string, string>();

  const consider = (raw: string) => {
    const label = normalizeEmployerLocationQuery(raw);
    if (!label) {
      return;
    }
    if (!label.toLowerCase().includes(normalizedQuery)) {
      return;
    }
    const key = label.toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, label);
    }
  };

  for (const preferred of preferredLocations) {
    const full = normalizeEmployerLocationQuery(preferred);
    if (!full) {
      continue;
    }

    consider(full);

    const commaIndex = full.indexOf(",");
    if (commaIndex > 0) {
      consider(full.slice(0, commaIndex));
      consider(full.slice(commaIndex + 1));
    }
  }

  return Array.from(unique.values())
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .slice(0, limit);
}
