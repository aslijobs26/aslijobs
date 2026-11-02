import { EMPLOYER_INDUSTRY_LABELS } from "../verifications/operations-verifications-industry.js";

export type CategoryMatchConfidence = "exact" | "alias" | "unclassified";

export type CanonicalCategory = {
  id: string;
  label: string;
  confidence: CategoryMatchConfidence;
  raw: string;
};

const CANONICAL = Object.entries(EMPLOYER_INDUSTRY_LABELS).map(([id, label]) => ({
  id,
  label,
}));

const ALIASES: Record<string, string> = {
  driver: "logistics-transportation",
  "delivery boy": "logistics-transportation",
  "delivery executive": "logistics-transportation",
  logistics: "logistics-transportation",
  electrician: "manufacturing",
  welder: "manufacturing",
  "cnc operator": "manufacturing",
  "cnc machine operator": "manufacturing",
  nurse: "healthcare",
  teacher: "education",
  "security guard": "security-services",
  "security officer": "security-services",
  housekeeping: "facility-management",
  "housekeeping staff": "facility-management",
  sales: "retail-ecommerce",
  "sales executive": "retail-ecommerce",
  software: "it-software",
  developer: "it-software",
  "software developer": "it-software",
  accountant: "banking-financial-services",
  cook: "hospitality",
  chef: "hospitality",
};

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function byId(id: string, raw: string, confidence: CategoryMatchConfidence): CanonicalCategory {
  const known = CANONICAL.find((row) => row.id === id);
  return {
    id,
    label: known?.label ?? "Unclassified",
    confidence,
    raw,
  };
}

/**
 * Map a job industry/category or a jobseeker role onto one employer industry.
 * Ambiguous text stays unclassified. The original value is always preserved.
 */
export function canonicalCategory(raw: string | null | undefined): CanonicalCategory {
  const original = String(raw ?? "").trim();
  if (!original) {
    return { id: "unclassified", label: "Unclassified", confidence: "unclassified", raw: "" };
  }
  const key = normalize(original);
  const exact = CANONICAL.find(
    (row) => row.id === key.replace(/ /g, "-") || normalize(row.label) === key,
  );
  if (exact) return byId(exact.id, original, "exact");

  const alias = ALIASES[key];
  if (alias) return byId(alias, original, "alias");

  const hits = new Set<string>();
  for (const [aliasKey, id] of Object.entries(ALIASES)) {
    if (key === aliasKey || key.includes(` ${aliasKey}`) || key.startsWith(`${aliasKey} `)) {
      hits.add(id);
    }
  }
  for (const row of CANONICAL) {
    const label = normalize(row.label);
    if (label.length >= 5 && (key === label || key.includes(label))) hits.add(row.id);
  }
  if (hits.size === 1) {
    return byId([...hits][0]!, original, "alias");
  }
  return {
    id: "unclassified",
    label: "Unclassified",
    confidence: "unclassified",
    raw: original,
  };
}

export function categoryCoverage(rows: CanonicalCategory[]): {
  mapped: number;
  unmapped: number;
  coveragePercent: number | null;
} {
  const mapped = rows.filter((row) => row.confidence !== "unclassified").length;
  const unmapped = rows.length - mapped;
  const total = rows.length;
  return {
    mapped,
    unmapped,
    coveragePercent: total === 0 ? null : Math.round((mapped / total) * 1000) / 10,
  };
}
