/**
 * Builds MongoDB match fragments for employer Candidates global search.
 * Searches resume snapshot + applied job fields only (no invented schema).
 * Email is omitted: not present on application resume snapshots today.
 */

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Trim and collapse internal whitespace. */
export function normalizeEmployerCandidateSearchQuery(
  value: string | undefined,
): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function regexClause(field: string, pattern: string): Record<string, unknown> {
  return {
    [field]: { $regex: pattern, $options: "i" },
  };
}

function elemMatchStringField(
  arrayField: string,
  pattern: string,
): Record<string, unknown> {
  return {
    [arrayField]: {
      $elemMatch: { $regex: pattern, $options: "i" },
    },
  };
}

/**
 * Digits-only phone matcher that allows separators between digits
 * (e.g. query 9876543210 matches +91 98765-43210).
 */
function buildFlexiblePhonePattern(query: string): string | null {
  const digits = query.replace(/\D/g, "");
  if (digits.length < 4) {
    return null;
  }
  return digits.split("").map(escapeRegex).join("\\D*");
}

export function buildEmployerCandidateSearchMatch(
  rawSearch: string | undefined,
): Record<string, unknown> | null {
  const search = normalizeEmployerCandidateSearchQuery(rawSearch);
  if (!search) {
    return null;
  }

  const pattern = escapeRegex(search);
  const phonePattern = buildFlexiblePhonePattern(search);

  const orClauses: Record<string, unknown>[] = [
    // Identity
    regexClause("resumeSnapshot.resumeJson.header.fullName", pattern),
    regexClause("resumeSnapshot.resumeJson.sections.contact.fullName", pattern),
    regexClause("resumeSnapshot.resumeJson.header.phone", pattern),
    regexClause("resumeSnapshot.resumeJson.sections.contact.phone", pattern),

    // Location
    regexClause("resumeSnapshot.resumeJson.header.city", pattern),
    regexClause("resumeSnapshot.resumeJson.header.state", pattern),
    regexClause("resumeSnapshot.resumeJson.header.location", pattern),
    regexClause("resumeSnapshot.resumeJson.sections.contact.city", pattern),
    regexClause("resumeSnapshot.resumeJson.sections.contact.state", pattern),

    // Headline / summary / objective / availability
    regexClause("resumeSnapshot.resumeJson.header.headline", pattern),
    regexClause(
      "resumeSnapshot.resumeJson.sections.professionalHeadline",
      pattern,
    ),
    regexClause(
      "resumeSnapshot.resumeJson.sections.professionalSummary",
      pattern,
    ),
    regexClause("resumeSnapshot.resumeJson.sections.careerObjective", pattern),
    regexClause("resumeSnapshot.resumeJson.sections.experienceLabel", pattern),
    regexClause("resumeSnapshot.resumeJson.sections.availability", pattern),

    // Skills & languages
    elemMatchStringField("resumeSnapshot.resumeJson.sections.skills", pattern),
    elemMatchStringField(
      "resumeSnapshot.resumeJson.sections.languages",
      pattern,
    ),

    // Experience entries
    {
      "resumeSnapshot.resumeJson.sections.experience": {
        $elemMatch: {
          $or: [
            { jobRole: { $regex: pattern, $options: "i" } },
            { companyName: { $regex: pattern, $options: "i" } },
            { industry: { $regex: pattern, $options: "i" } },
            { location: { $regex: pattern, $options: "i" } },
            { responsibilities: { $regex: pattern, $options: "i" } },
            { duration: { $regex: pattern, $options: "i" } },
          ],
        },
      },
    },

    // Education entries
    {
      "resumeSnapshot.resumeJson.sections.education": {
        $elemMatch: {
          $or: [
            { degree: { $regex: pattern, $options: "i" } },
            { specialization: { $regex: pattern, $options: "i" } },
            { stream: { $regex: pattern, $options: "i" } },
            { trade: { $regex: pattern, $options: "i" } },
            { branch: { $regex: pattern, $options: "i" } },
            { level: { $regex: pattern, $options: "i" } },
            { schoolName: { $regex: pattern, $options: "i" } },
            { collegeName: { $regex: pattern, $options: "i" } },
            { instituteName: { $regex: pattern, $options: "i" } },
            { board: { $regex: pattern, $options: "i" } },
          ],
        },
      },
    },

    // Career preferences
    regexClause(
      "resumeSnapshot.resumeJson.sections.careerPreferences.preferredJobRole",
      pattern,
    ),
    regexClause(
      "resumeSnapshot.resumeJson.sections.careerPreferences.preferredJobLocation",
      pattern,
    ),

    // Applied job + hiring status (employer-scoped match already applied)
    regexClause("publicJobId", pattern),
    regexClause("status", pattern),
    regexClause("job.jobTitle", pattern),
    regexClause("job.companyName", pattern),
  ];

  if (phonePattern) {
    orClauses.push(
      regexClause("resumeSnapshot.resumeJson.header.phone", phonePattern),
      regexClause(
        "resumeSnapshot.resumeJson.sections.contact.phone",
        phonePattern,
      ),
    );
  }

  return { $or: orClauses };
}
