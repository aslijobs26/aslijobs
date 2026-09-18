/**
 * Generates AsliJobs-meaningful department codes (slugs).
 * Prefer domain aliases (employer, jobseeker, …); otherwise derive from name.
 */

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "asli",
  "aslijobs",
  "dept",
  "department",
  "for",
  "in",
  "jobs",
  "of",
  "ops",
  "team",
  "the",
  "to",
]);

/** Order matters — more specific patterns first. */
const ASLI_MEANING_ALIASES: Array<{ match: RegExp; code: string; meaning: string }> =
  [
    {
      match: /\bjob\s*seekers?\b|\bjobseekers?\b/i,
      code: "jobseeker",
      meaning: "Job seeker operations",
    },
    {
      match: /\bemployers?\b/i,
      code: "employer",
      meaning: "Employer operations",
    },
    {
      match: /\bjob\s*operations?\b|\bjob\s*ops\b/i,
      code: "job-operations",
      meaning: "Job listing operations",
    },
    {
      match: /\bhiring\s*operations?\b|\bhiring\b/i,
      code: "hiring-operations",
      meaning: "Hiring operations",
    },
    {
      match: /\bplacements?\b/i,
      code: "placements",
      meaning: "Placement operations",
    },
    {
      match: /\bverifications?\b|\bverify\b/i,
      code: "verifications",
      meaning: "Employer verification",
    },
    {
      match: /\bwhatsapp\b|\binbox\b/i,
      code: "whatsapp-ops",
      meaning: "WhatsApp inbox operations",
    },
    {
      match: /\bsupport\b|\bhelp\s*desk\b|\btickets?\b/i,
      code: "support",
      meaning: "Support operations",
    },
    {
      match: /\bcontent\b|\blanguage\b|\blocalization\b/i,
      code: "content-language",
      meaning: "Content & language",
    },
    {
      match: /\btrust\b|\bcompliance\b/i,
      code: "trust-compliance",
      meaning: "Trust & compliance",
    },
    {
      match: /\bmarketing\b|\bpromotions?\b|\bcampaigns?\b/i,
      code: "marketing",
      meaning: "Marketing & campaigns",
    },
    {
      match: /\bsales\b|\bbusiness\s*dev(?:elopment)?\b|\bbd\b/i,
      code: "sales",
      meaning: "Sales & BD",
    },
    {
      match: /\banalytics?\b|\breports?\b/i,
      code: "analytics",
      meaning: "Analytics & reporting",
    },
    {
      match: /\bescalations?\b/i,
      code: "escalations",
      meaning: "Escalations",
    },
    {
      match: /\boperations?\b/i,
      code: "operations",
      meaning: "General operations",
    },
  ];

export function slugifyDepartmentCodePreview(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function deriveFromName(name: string): string {
  const tokens = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token));

  if (tokens.length === 0) {
    return "dept";
  }

  if (tokens.length === 1) {
    return slugifyDepartmentCodePreview(tokens[0]!).slice(0, 24) || "dept";
  }

  // Prefer readable kebab of up to 3 significant words.
  const joined = slugifyDepartmentCodePreview(tokens.slice(0, 3).join("-"));
  if (joined.length >= 2 && joined.length <= 32) {
    return joined;
  }

  // Fall back to compact acronym for long names.
  const acronym = tokens
    .slice(0, 4)
    .map((token) => token[0])
    .join("");
  return slugifyDepartmentCodePreview(acronym) || "dept";
}

function ensureUniqueCode(
  base: string,
  existingCodes: ReadonlySet<string>,
): string {
  const normalized = slugifyDepartmentCodePreview(base) || "dept";
  if (!existingCodes.has(normalized)) {
    return normalized;
  }

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${normalized}-${suffix}`.slice(0, 80);
    if (!existingCodes.has(candidate)) {
      return candidate;
    }
  }

  return `${normalized}-${Date.now().toString(36)}`.slice(0, 80);
}

export type GeneratedDepartmentCode = {
  code: string;
  meaning: string | null;
  fromAlias: boolean;
};

/**
 * Build a unique AsliJobs department code from the department name.
 * Uses known domain aliases when the name matches Operations meanings.
 */
export function generateAsliDepartmentCode(
  name: string,
  existingSlugs: readonly string[] = [],
): GeneratedDepartmentCode {
  const existing = new Set(
    existingSlugs
      .map((slug) => slugifyDepartmentCodePreview(slug))
      .filter(Boolean),
  );

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { code: "", meaning: null, fromAlias: false };
  }

  for (const alias of ASLI_MEANING_ALIASES) {
    if (alias.match.test(trimmed)) {
      return {
        code: ensureUniqueCode(alias.code, existing),
        meaning: alias.meaning,
        fromAlias: true,
      };
    }
  }

  return {
    code: ensureUniqueCode(deriveFromName(trimmed), existing),
    meaning: null,
    fromAlias: false,
  };
}
