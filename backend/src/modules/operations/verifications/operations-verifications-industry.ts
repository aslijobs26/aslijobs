import { EMPLOYER_INDUSTRIES } from "../../../constants/employer.constants.js";

/**
 * Canonical display labels for employer industry slugs.
 * Only covers values in EMPLOYER_INDUSTRIES — never invents unknown categories.
 */
export const EMPLOYER_INDUSTRY_LABELS: Readonly<Record<string, string>> = {
  "construction-infrastructure": "Construction & Infrastructure",
  manufacturing: "Manufacturing",
  "logistics-transportation": "Logistics & Delivery",
  "retail-ecommerce": "Retail & Sales",
  hospitality: "Hospitality & Food Services",
  healthcare: "Healthcare",
  education: "Education",
  "security-services": "Security Services",
  "facility-management": "Facilities Management",
  "it-software": "IT & Software",
  telecom: "Telecom",
  agriculture: "Agriculture",
  "banking-financial-services": "Finance & Accounting",
  "media-entertainment": "Media & Entertainment",
  "beauty-wellness": "Beauty & Wellness",
  "domestic-home-services": "Domestic & Home Services",
};

const EMPLOYER_INDUSTRY_SET = new Set<string>(EMPLOYER_INDUSTRIES);

export function resolveEmployerIndustryLabel(
  raw: string | null | undefined,
): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed || trimmed.toLowerCase() === "unspecified") {
    return "Unspecified";
  }

  const slug = trimmed.toLowerCase();
  if (EMPLOYER_INDUSTRY_LABELS[slug]) {
    return EMPLOYER_INDUSTRY_LABELS[slug];
  }

  if (EMPLOYER_INDUSTRY_SET.has(slug as (typeof EMPLOYER_INDUSTRIES)[number])) {
    return EMPLOYER_INDUSTRY_LABELS[slug] ?? trimmed;
  }

  return trimmed
    .split(/[_\s/-]+/)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === "it") return "IT";
      if (lower === "hr") return "HR";
      if (lower === "ai") return "AI";
      if (lower === "bpo") return "BPO";
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ")
    .replace(/\bAnd\b/g, "&");
}
