import type { SiteLanguageCode } from "../constants/site-language";

/**
 * State and union-territory language map for the six languages AsliJobs
 * already supports. Hindi entries are places where Hindi is an official
 * language. States whose official language is not one of the six stay
 * unmapped and fall back to English.
 *
 * Edit this table to change automatic language selection. Matching uses
 * normalized names and ISO 3166-2:IN codes (including retired aliases).
 */
const REGION_LANGUAGES: readonly {
  language: SiteLanguageCode;
  codes: readonly string[];
  names: readonly string[];
}[] = [
  {
    language: "te",
    codes: ["AP", "TS", "TG"],
    names: ["andhra pradesh", "andhra", "telangana", "telengana"],
  },
  {
    language: "ta",
    codes: ["TN", "PY"],
    names: ["tamil nadu", "tamilnadu", "puducherry", "pondicherry", "puduchery"],
  },
  {
    language: "kn",
    codes: ["KA"],
    names: ["karnataka"],
  },
  {
    language: "ml",
    codes: ["KL", "LD"],
    names: ["kerala", "lakshadweep"],
  },
  {
    language: "hi",
    codes: [
      "UP",
      "BR",
      "MP",
      "RJ",
      "HR",
      "HP",
      "UT",
      "UK",
      "JH",
      "CT",
      "CG",
      "DL",
      "CH",
      "JK",
      "LA",
      "AN",
      "DH",
      "DN",
      "DD",
    ],
    names: [
      "uttar pradesh",
      "bihar",
      "madhya pradesh",
      "rajasthan",
      "haryana",
      "himachal pradesh",
      "uttarakhand",
      "uttaranchal",
      "jharkhand",
      "chhattisgarh",
      "chattisgarh",
      "delhi",
      "new delhi",
      "nct of delhi",
      "national capital territory of delhi",
      "chandigarh",
      "jammu and kashmir",
      "jammu kashmir",
      "ladakh",
      "andaman and nicobar islands",
      "andaman and nicobar",
      "andaman",
      "dadra and nagar haveli and daman and diu",
      "dadra and nagar haveli",
      "daman and diu",
    ],
  },
];

export type LocationLanguageRegion = {
  countryCode?: string | null;
  country?: string | null;
  state?: string | null;
  stateCode?: string | null;
};

function normalizePlaceName(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(state of|union territory of|ut of)\s+/, "")
    .replace(/\s+(state|union territory|ut)$/, "");
}

function normalizeStateCode(value: string | null | undefined): string {
  const raw = (value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
  if (!raw) {
    return "";
  }
  const parts = raw.split("-").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

const CODE_TO_LANGUAGE = new Map<string, SiteLanguageCode>();
const NAME_TO_LANGUAGE = new Map<string, SiteLanguageCode>();

for (const region of REGION_LANGUAGES) {
  for (const code of region.codes) {
    CODE_TO_LANGUAGE.set(code, region.language);
  }
  for (const name of region.names) {
    const normalized = normalizePlaceName(name);
    if (!normalized) {
      continue;
    }
    NAME_TO_LANGUAGE.set(normalized, region.language);
    NAME_TO_LANGUAGE.set(normalized.replace(/ /g, ""), region.language);
  }
}

function languageForState(
  state: string | null | undefined,
  stateCode: string | null | undefined,
): SiteLanguageCode | null {
  const code = normalizeStateCode(stateCode);
  const fromCode = code ? CODE_TO_LANGUAGE.get(code) : undefined;
  if (fromCode) {
    return fromCode;
  }

  const name = normalizePlaceName(state);
  if (!name) {
    return null;
  }
  const fromName =
    NAME_TO_LANGUAGE.get(name) ?? NAME_TO_LANGUAGE.get(name.replace(/ /g, ""));
  if (fromName) {
    return fromName;
  }

  const compact = name.replace(/ /g, "");
  if (compact.length >= 2 && compact.length <= 3) {
    return CODE_TO_LANGUAGE.get(compact.toUpperCase()) ?? null;
  }
  return null;
}

/**
 * Returns a supported language for an Indian state, or null when the
 * visitor should stay on the English fallback. Locations outside India
 * are always null.
 */
export function languageCodeForRegion(
  region: LocationLanguageRegion,
): SiteLanguageCode | null {
  const countryCode = (region.countryCode ?? "").trim().toUpperCase();
  const countryName = normalizePlaceName(region.country);
  const isIndia =
    countryCode === "IN" ||
    countryName === "india" ||
    countryName === "republic of india" ||
    countryName === "bharat";
  const hasCountry = Boolean(countryCode || countryName);
  if (hasCountry && !isIndia) {
    return null;
  }
  return languageForState(region.state, region.stateCode);
}
