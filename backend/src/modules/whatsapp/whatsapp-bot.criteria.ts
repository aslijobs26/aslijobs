/**
 * Extra search slots for the existing WhatsApp bot.
 * Cities stay in the bot logic list. States, free-text titles, experience,
 * and salary are read here and merged into that same understanding.
 */

const STATES: Array<{ canonical: string; forms: string[] }> = [
  { canonical: "Andhra Pradesh", forms: ["andhra pradesh"] },
  { canonical: "Arunachal Pradesh", forms: ["arunachal pradesh"] },
  { canonical: "Assam", forms: ["assam"] },
  { canonical: "Bihar", forms: ["bihar", "बिहार", "బీహార్", "பீகார்", "ಬಿಹಾರ", "ബീഹാർ"] },
  { canonical: "Chhattisgarh", forms: ["chhattisgarh", "chattisgarh"] },
  { canonical: "Goa", forms: ["goa"] },
  { canonical: "Gujarat", forms: ["gujarat"] },
  { canonical: "Haryana", forms: ["haryana"] },
  { canonical: "Himachal Pradesh", forms: ["himachal pradesh", "himachal"] },
  { canonical: "Jharkhand", forms: ["jharkhand"] },
  { canonical: "Karnataka", forms: ["karnataka", "कर्नाटक", "కర్ణాటక", "கர்நாடகா", "ಕರ್ನಾಟಕ", "കർണാടക"] },
  { canonical: "Kerala", forms: ["kerala", "केरल", "కేరళ", "கேரளா", "ಕೇರಳ", "കേരളം"] },
  { canonical: "Madhya Pradesh", forms: ["madhya pradesh"] },
  { canonical: "Maharashtra", forms: ["maharashtra", "महाराष्ट्र", "మహారాష్ట్ర", "மகாராஷ்டிரா", "ಮಹಾರಾಷ್ಟ್ರ", "മഹാരാഷ്ട്ര"] },
  { canonical: "Manipur", forms: ["manipur"] },
  { canonical: "Meghalaya", forms: ["meghalaya"] },
  { canonical: "Mizoram", forms: ["mizoram"] },
  { canonical: "Nagaland", forms: ["nagaland"] },
  { canonical: "Odisha", forms: ["odisha", "orissa"] },
  { canonical: "Punjab", forms: ["punjab"] },
  { canonical: "Rajasthan", forms: ["rajasthan"] },
  { canonical: "Sikkim", forms: ["sikkim"] },
  { canonical: "Tamil Nadu", forms: ["tamil nadu", "tamilnadu", "तमिलनाडु", "తమిళనాడు", "தமிழ்நாடு", "ತಮಿಳುನಾಡು", "തമിഴ്നാട്"] },
  { canonical: "Telangana", forms: ["telangana", "तेलंगाना", "తెలంగాణ", "தெலங்கானா", "ತೆಲಂಗಾಣ", "തെലങ്കാന"] },
  { canonical: "Tripura", forms: ["tripura"] },
  { canonical: "Uttar Pradesh", forms: ["uttar pradesh"] },
  { canonical: "Uttarakhand", forms: ["uttarakhand", "uttaranchal"] },
  { canonical: "West Bengal", forms: ["west bengal"] },
];

const STATE_NAMES = new Set(STATES.map((state) => state.canonical));

const ROLE_REJECT = new Set([
  "a",
  "an",
  "the",
  "any",
  "some",
  "my",
  "me",
  "find",
  "matching",
  "match",
  "resume",
  "cv",
  "suitable",
  "job",
  "jobs",
  "work",
  "vacancy",
  "vacancies",
  "opening",
  "openings",
  "role",
  "fresher",
  "experienced",
  "near",
  "in",
  "for",
  "with",
  "and",
  "available",
  "need",
  "want",
  "looking",
  "please",
  "show",
  "i",
  // Conversation / status noise — never treat as a job title
  "nenu",
  "naaku",
  "naku",
  "naa",
  "post",
  "posted",
  "posting",
  "chesina",
  "cheyya",
  "status",
  "profile",
  "verify",
  "verified",
  "verification",
  "account",
  "company",
  "people",
  "person",
  "candidates",
  "candidate",
  "applicants",
  "applicant",
  "applications",
  "application",
  "applied",
  "many",
  "how",
  "what",
  "which",
  "kavali",
  "chahiye",
  "undhi",
  "undi",
  "elu",
  "ela",
  "enti",
  "more",
  "next",
  "other",
  "others",
  "any",
  "inka",
  "inkaa",
  "vere",
  "chuinu",
  "chupinchu",
  "chupinchi",
  "unnaya",
]);

const EXPERIENCE_LABELS: Record<string, string> = {
  fresher: "fresher",
  "6_month": "6 months experience",
  "1_year": "1 year experience",
  "2_year": "2 years experience",
  "3_year": "3 years experience",
  "4_year": "4 years experience",
  "5_year": "5 years experience",
  "6_year": "6 or more years experience",
  "10_year": "10 or more years experience",
};

function hasWord(text: string, form: string): boolean {
  const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z])${escaped}(?:[^a-z]|$)`, "i").test(text);
}

export function extractIndianState(text: string): string {
  const hit = STATES.find((state) => state.forms.some((form) => hasWord(text, form)));
  return hit?.canonical ?? "";
}

export function placeKind(location: string): "city" | "state" | "" {
  if (!location) return "";
  return STATE_NAMES.has(location) ? "state" : "city";
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function cleanRolePhrase(value: string, isKnownPlace: (place: string) => boolean): string {
  let phrase = value.replace(/\s+/g, " ").trim();
  let previous = "";
  while (phrase && phrase !== previous) {
    previous = phrase;
    phrase = phrase
      .replace(
        /^(?:a|an|the|any|some|my|me|i|please|show|find|need|want|wnat|looking|for|available|are|there|what|which|how|do|can|is|matching)\s+/i,
        "",
      )
      .trim();
  }
  phrase = phrase
    .replace(/\s+(?:job|jobs|work|role|position|resume|cv)$/i, "")
    .replace(/^(?:matching|suitable)\s+/i, "")
    .trim();
  if (!phrase || phrase.length < 3 || phrase.length > 40) return "";
  const tokens = phrase.toLowerCase().split(/\s+/);
  if (tokens.every((token) => ROLE_REJECT.has(token))) return "";
  if (isKnownPlace(phrase) || extractIndianState(phrase)) return "";
  return titleCase(phrase);
}

/** Title mentioned in the message when it is not one of the fixed role names. */
export function extractFreeJobTitle(
  text: string,
  isKnownPlace: (place: string) => boolean,
): string {
  const patterns = [
    /\b([a-z][a-z\s]{1,40}?)\s+vacanc(?:y|ies)\b/i,
    /\b([a-z][a-z\s]{1,40}?)\s+openings?\b/i,
    /\bjobs?\s+in\s+([a-z][a-z\s]{2,30})/i,
    /\b(?:looking for|searching for)\s+(?:a\s+|an\s+)?([a-z][a-z\s]{2,40}?)\s+jobs?\b/i,
    /\b([a-z][a-z\s]{2,40}?)\s+jobs?\b/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (!match?.[1]) continue;
    const title = cleanRolePhrase(match[1], isKnownPlace);
    if (title) return title;
  }
  return "";
}

/** Map a stated year count onto the public job API's experience levels. */
export function experienceSearchLevel(years: number): string {
  if (years <= 0) return "fresher";
  if (years === 1) return "1_year";
  if (years === 2) return "2_year";
  if (years === 3) return "3_year";
  if (years === 4) return "4_year";
  if (years === 5) return "5_year";
  if (years <= 7) return "6_year";
  return "10_year";
}

export function extractExperienceDetail(text: string): {
  level: string;
  years: number | null;
  rangeLabel: string;
} {
  const folded = text.toLowerCase();
  const words: Record<string, string> = {
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    ten: "10",
  };
  const amount = "\\d+|one|two|three|four|five|six|seven|eight|nine|ten";
  const range = folded.match(
    new RegExp(`\\b(${amount})\\s*(?:to|-|–)\\s*(${amount})\\s*(?:years?|yrs?)\\b`),
  );
  if (range?.[1] && range[2]) {
    const low = Number(words[range[1]] ?? range[1]);
    const high = Number(words[range[2]] ?? range[2]);
    if (Number.isFinite(low) && Number.isFinite(high) && high >= low) {
      return {
        level: experienceSearchLevel(low),
        years: low,
        rangeLabel: `${low} to ${high}`,
      };
    }
  }
  const numeric = folded.match(new RegExp(`\\b(${amount})\\s*(?:years?|yrs?)\\b`));
  if (numeric?.[1]) {
    const years = Number(words[numeric[1]] ?? numeric[1]);
    if (!Number.isFinite(years)) return { level: "", years: null, rangeLabel: "" };
    return { level: experienceSearchLevel(years), years, rangeLabel: "" };
  }
  if (/\b6\s*months?\b/.test(folded)) return { level: "6_month", years: null, rangeLabel: "" };
  if (/\bfreshers?\b|\bno experience\b/.test(folded)) return { level: "fresher", years: 0, rangeLabel: "" };
  return { level: "", years: null, rangeLabel: "" };
}

export function extractExperienceLevel(text: string): string {
  return extractExperienceDetail(text).level;
}

function lpaToMonthly(lpa: number): number {
  return Math.round((lpa * 100000) / 12);
}

export function extractSalaryBand(text: string): {
  min: number | null;
  max: number | null;
  basis: "monthly" | "annual";
} {
  const empty = { min: null, max: null, basis: "monthly" as const };
  const normalized = text.replace(/,/g, "");
  // Telugu "20000 lo chudu/chunchandi" = show jobs at that salary preference.
  const teluguSalaryShow =
    /\b\d{4,7}\b|\b\d+(?:\.\d+)?\s*k\b/i.test(normalized) &&
    /\blo\s+(chudu|chunchandi|chupin\w*|chupu)|chunchandi|chudu\b|change\s+salary|salary\s+\w+\s+vaddu|\b\d+\s*k\s+vaddu/i.test(
      text,
    );
  const salaryCue =
    teluguSalaryShow ||
    /salary|జీతం|వేతనం|वेतन|तनख्वाह|சம்பளம்|ಸಂಬಳ|ശമ്പളം|minimum|min\.?|at\s+least|above|over|upto|up\s+to|from|between|₹|\brs\.?\b|\binr\b|kavali/i.test(
      text,
    );

  const lpaRange = normalized.match(/(\d+(?:\.\d+)?)\s*(?:to|-|–)\s*(\d+(?:\.\d+)?)\s*lpa\b/i);
  if (lpaRange?.[1] && lpaRange[2]) {
    const min = lpaToMonthly(Number(lpaRange[1]));
    const max = lpaToMonthly(Number(lpaRange[2]));
    if (min > 0 && max >= min) return { min, max, basis: "annual" };
  }
  const lpa = normalized.match(/(\d+(?:\.\d+)?)\s*lpa\b/i);
  if (lpa?.[1]) {
    const min = lpaToMonthly(Number(lpa[1]));
    if (min > 0) return { min, max: null, basis: "annual" };
  }
  const rupee = normalized.match(/₹\s*(\d{4,7})/);
  if (rupee?.[1]) {
    const amount = Number(rupee[1]);
    if (Number.isFinite(amount) && amount > 0) {
      if (/\b(?:per\s*year|a year|annually|p\.?a\.?)\b/i.test(text)) {
        return { min: Math.round(amount / 12), max: null, basis: "annual" };
      }
      return { min: amount, max: null, basis: "monthly" };
    }
  }
  const rangeK = normalized.match(/(\d+(?:\.\d+)?)\s*k\s*(?:to|-|–)\s*(\d+(?:\.\d+)?)\s*k/i);
  if (rangeK?.[1] && rangeK[2]) {
    const min = Math.round(Number(rangeK[1]) * 1000);
    const max = Math.round(Number(rangeK[2]) * 1000);
    if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min) {
      return { min, max, basis: "monthly" };
    }
  }
  // "40k vaddu, 20k chudu" / "40000 vaddu 20000" — prefer the replacement amount.
  const rejectThenK = normalized.match(
    /(\d+(?:\.\d+)?)\s*k\b[^\d]{0,48}?\bvaddu\b[^\d]{0,48}?(\d+(?:\.\d+)?)\s*k\b/i,
  );
  if (rejectThenK?.[2] && salaryCue) {
    const min = Math.round(Number(rejectThenK[2]) * 1000);
    if (Number.isFinite(min) && min > 0) return { min, max: null, basis: "monthly" };
  }
  const rejectThenPlain = normalized.match(
    /(\d{4,7})\b[^\d]{0,48}?\bvaddu\b[^\d]{0,48}?(\d{4,7})\b/i,
  );
  if (rejectThenPlain?.[2] && salaryCue) {
    const min = Number(rejectThenPlain[2]);
    if (Number.isFinite(min) && min >= 1000 && min <= 500000) {
      return { min, max: null, basis: "monthly" };
    }
  }
  const changeToK = normalized.match(
    /(?:change\s+salary\s+to|salary\s+(?:to|is)|update\s+salary\s+to)\s*(\d+(?:\.\d+)?)\s*k\b/i,
  );
  if (changeToK?.[1]) {
    const min = Math.round(Number(changeToK[1]) * 1000);
    if (Number.isFinite(min) && min > 0) return { min, max: null, basis: "monthly" };
  }
  const changeToPlain = normalized.match(
    /(?:change\s+salary\s+to|salary\s+(?:to|is)|update\s+salary\s+to)\s*(\d{4,7})\b/i,
  );
  if (changeToPlain?.[1]) {
    const min = Number(changeToPlain[1]);
    if (Number.isFinite(min) && min >= 1000 && min <= 500000) {
      return { min, max: null, basis: "monthly" };
    }
  }
  const oneK = normalized.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (oneK?.[1] && (/salary|₹|\brs\.?\b|\binr\b|\d\s*k\b/i.test(text) || salaryCue)) {
    // Prefer the last k-amount when the message is a salary update with multiple figures.
    const allK = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*k\b/gi)];
    const pick = salaryCue && allK.length > 1 ? allK[allK.length - 1] : oneK;
    const min = Math.round(Number(pick?.[1]) * 1000);
    if (Number.isFinite(min) && min > 0) return { min, max: null, basis: "monthly" };
  }
  // Plain monthly amounts: "salary 40000", "minimum 40000", "Naku salary 40,000 kavali"
  const rangePlain = normalized.match(
    /(?:salary|minimum|min|between|from)?[^\d]{0,24}(\d{4,7})\s*(?:to|-|–)\s*(\d{4,7})\b/i,
  );
  if (rangePlain?.[1] && rangePlain[2] && salaryCue) {
    const min = Number(rangePlain[1]);
    const max = Number(rangePlain[2]);
    if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min && min <= 500000) {
      if (/\b(?:per\s*year|a year|annually|p\.?a\.?)\b/i.test(text)) {
        return { min: Math.round(min / 12), max: Math.round(max / 12), basis: "annual" };
      }
      return { min, max, basis: "monthly" };
    }
  }
  const plain = salaryCue
    ? normalized.match(
        /(?:salary|minimum|min\.?|at\s+least|above|over|upto|up\s+to|from)?[^\d]{0,24}(\d{4,7})\b/i,
      )
    : null;
  if (plain?.[1]) {
    const amount = Number(plain[1]);
    if (Number.isFinite(amount) && amount >= 1000 && amount <= 500000) {
      if (/\b(?:per\s*year|a year|annually|p\.?a\.?)\b/i.test(text)) {
        return { min: Math.round(amount / 12), max: null, basis: "annual" };
      }
      return { min: amount, max: null, basis: "monthly" };
    }
  }
  return empty;
}

/** Relative salary bump without a number ("konchem ekkuva", "low salary vaddu"). */
export function looksLikeRelativeHigherSalary(text: string): boolean {
  return /konchem\s+ekkuva|salary\s+ekkuva|ekkuva\s+salary|low\s+salary\s+vaddu|takkuva\s+salary\s+vaddu|higher\s+salary|more\s+salary|salary\s+increase/i.test(
    text,
  );
}

/** Explicit salary preference / correction without requiring the word "salary". */
export function looksLikeSalaryPreferenceUpdate(text: string): boolean {
  const normalized = text.replace(/,/g, "");
  if (extractSalaryBand(text).min == null) return false;
  return (
    /salary|జీతం|వేతనం|वेतन|minimum|at\s+least|above|₹|\brs\.?\b/i.test(text) ||
    /\blo\s+(chudu|chunchandi|chupin\w*|chupu)|chunchandi|change\s+salary|\b\d+\s*k\s+vaddu|\b\d{4,7}\s+vaddu/i.test(
      normalized,
    )
  );
}

export function wantsAnyLocation(text: string): boolean {
  return /\b(anywhere|any city|any location|any place)\b/i.test(text);
}

export function recallsEarlierLocation(text: string): boolean {
  return /\b(already told|i told you|same location|same place|same city|that location)\b/i.test(text);
}

const ORDINALS: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  "1st": 1,
  "2nd": 2,
  "3rd": 3,
  "1": 1,
  "2": 2,
  "3": 3,
};

/** "the second job" / "apply for the 2nd job" against the last shown results. */
export function jobOrdinalFromText(text: string): number | null {
  if (!/\b(?:jobs?|apply)\b/i.test(text)) return null;
  const match = text.match(
    /\b(?:apply(?:\s+for)?|show|open|the)\s+(?:the\s+)?(first|second|third|1st|2nd|3rd|[123])\b/i,
  );
  if (!match?.[1]) return null;
  return ORDINALS[match[1].toLowerCase()] ?? null;
}

export function formatAppliedFilters(input: {
  experienceLevel?: string;
  originalExperienceYears?: number | null;
  experienceRangeLabel?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  salaryBasis?: "monthly" | "annual";
}): string {
  const parts: string[] = [];
  const bucket = input.experienceLevel ? EXPERIENCE_LABELS[input.experienceLevel] : "";
  const years = input.originalExperienceYears;
  const exact =
    years == null ||
    (input.experienceLevel === "fresher" && years === 0) ||
    (input.experienceLevel === "1_year" && years === 1) ||
    (input.experienceLevel === "2_year" && years === 2) ||
    (input.experienceLevel === "3_year" && years === 3) ||
    (input.experienceLevel === "4_year" && years === 4) ||
    (input.experienceLevel === "5_year" && years === 5) ||
    (input.experienceLevel === "6_year" && years === 6) ||
    (input.experienceLevel === "10_year" && years >= 10);
  if (input.experienceRangeLabel && bucket) {
    parts.push(`${input.experienceRangeLabel} years (searched as ${bucket})`);
  } else if (bucket && years != null && !exact) {
    parts.push(`${years} years (searched as ${bucket})`);
  } else if (bucket) {
    parts.push(bucket);
  }
  const perMonth = input.salaryBasis === "annual" ? " per month" : "";
  if (input.minSalary != null && input.maxSalary != null) {
    parts.push(
      `salary ₹${input.minSalary.toLocaleString("en-IN")}–₹${input.maxSalary.toLocaleString("en-IN")}${perMonth}`,
    );
  } else if (input.minSalary != null) {
    parts.push(`salary from ₹${input.minSalary.toLocaleString("en-IN")}${perMonth}`);
  }
  return parts.join(", ");
}
