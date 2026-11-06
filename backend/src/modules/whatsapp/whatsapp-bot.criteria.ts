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
  // Telugu/romanized quantity & existence fillers — never job titles
  // ("Hyderabad lo enni jobs…" must stay open city search, not role=Enni).
  "enni",
  "entha",
  "enta",
  "ennni",
  "unnayi",
  "vunnayi",
  "vunnaya",
  "vundi",
  "vundhi",
  "unnai",
  "unnaayi",
  "ga",
  "lo",
  "kosam",
  "ledu",
  "levu",
  "available",
  "avail",
  "there",
  "are",
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
        /^(?:a|an|the|any|some|my|me|i|please|show|find|need|want|wnat|looking|for|available|are|there|what|which|how|do|can|is|matching|suitable|only|just|sirf|fresher|freshers|experienced|enni|entha|enta|unnayi|vunnayi|vunnaya|unnaya|unnai|unnaayi|vundi|vundhi|ga|lo)\s+/i,
        "",
      )
      .replace(
        /\s+(?:job|jobs|work|role|position|resume|cv|only|just|sirf|fresher|freshers|experienced|available|enni|entha|enta|unnayi|vunnayi|vunnaya|unnaya|ga)$/i,
        "",
      )
      .replace(
        /^(?:only|just|sirf|fresher|freshers|experienced|enni|entha|enta|unnayi|vunnayi|available)$/i,
        "",
      )
      .trim();
    const locative = phrase.match(/^(.+?)\s+(?:lo|mein|me|in|at|la)\s+(.+)$/i);
    if (locative?.[1] && locative[2] && isKnownPlace(locative[1].trim())) {
      phrase = locative[2].trim();
    }
  }
  if (!phrase || phrase.length < 3 || phrase.length > 40) return "";
  const tokens = phrase.toLowerCase().split(/\s+/);
  if (tokens.every((token) => ROLE_REJECT.has(token))) return "";
  // Single filler/question token after stripping must never become a role.
  if (tokens.length === 1 && ROLE_REJECT.has(tokens[0] ?? "")) return "";
  if (isKnownPlace(phrase) || extractIndianState(phrase)) return "";
  return titleCase(phrase);
}

/** Title mentioned in the message when it is not one of the fixed role names. */
export function extractFreeJobTitle(
  text: string,
  isKnownPlace: (place: string) => boolean,
): string {
  // "interior designer in bhubaneswar" — role before a *known* place only.
  // Do not treat "job in accounts" as role=job / place=accounts.
  const roleInPlace = text.match(
    /\b([a-z][a-z\s\-']{1,40}?)\s+(?:in|at|@|lo)\s+([a-z][a-z\s\-']{2,40})\b/i,
  );
  if (roleInPlace?.[1] && roleInPlace[2]) {
    const rolePart = roleInPlace[1].trim();
    const placePart = roleInPlace[2].trim();
    if (!isKnownPlace(rolePart) && isKnownPlace(placePart)) {
      const title = cleanRolePhrase(rolePart, isKnownPlace);
      if (title && !/^(jobs?|work|role|near|near me|fresher)$/i.test(title)) return title;
    }
  }
  const patterns = [
    /\b([a-z][a-z\s]{1,40}?)\s+vacanc(?:y|ies)\b/i,
    /\b([a-z][a-z\s]{1,40}?)\s+openings?\b/i,
    /\b(?:looking for|searching for)\s+(?:a\s+|an\s+)?([a-z][a-z\s]{2,40}?)\s+jobs?\b/i,
    /\b([a-z][a-z\s]{2,40}?)\s+jobs?\b/i,
    /\b(?:need|want|wnat)\s+(?:a\s+|an\s+)?(?:fresher\s+)?(?:job|jobs)\s+in\s+([a-z][a-z\s]{2,40})\b/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (!match?.[1]) continue;
    const title = cleanRolePhrase(match[1], isKnownPlace);
    if (title) return title;
  }
  return "";
}

/** Non-fresher levels the public job API can match together. */
export const EXPERIENCED_SEARCH_LEVEL =
  "6_month,1_year,2_year,3_year,4_year,5_year,6_year,10_year";

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
  const yearUnit = "years?|yrs?|saal|varsham|varsha|varudam|varusham";
  const range = folded.match(
    new RegExp(`\\b(${amount})\\s*(?:to|-|–)\\s*(${amount})\\s*(?:${yearUnit})\\b`),
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
  const nativeYears = text.match(
    /(?:^|\D)(\d{1,2})\s*(?:సంవత్సరాలు|సంవత్సరం|సంవత్సరాల|ఏళ్లు|ఏళ్ళు|साल|वर्ष|வருடங்கள்|வருடம்|வருஷம்|ஆண்டுகள்|ஆண்டு|ವರ್ಷಗಳು|ವರ್ಷ|വർഷങ്ങൾ|വർഷം)/,
  );
  if (nativeYears?.[1]) {
    const years = Number(nativeYears[1]);
    if (Number.isFinite(years)) {
      return { level: experienceSearchLevel(years), years, rangeLabel: "" };
    }
  }
  const numeric = folded.match(new RegExp(`\\b(${amount})\\s*(?:${yearUnit})\\b`));
  if (numeric?.[1]) {
    const years = Number(words[numeric[1]] ?? numeric[1]);
    if (!Number.isFinite(years)) return { level: "", years: null, rangeLabel: "" };
    return { level: experienceSearchLevel(years), years, rangeLabel: "" };
  }
  if (/\b6\s*months?\b/.test(folded)) return { level: "6_month", years: null, rangeLabel: "" };
  if (
    /\bfreshers?\b|\bno experience\b|ఫ్రెషర్|అనుభవం\s*లేదు|फ्रेशर|अनुभव\s*नहीं|बिना\s*अनुभव|புதிய|அனுபவம்\s*இல்லை|ಫ್ರೆಶರ್|ಅನುಭವವಿಲ್ಲ|ഫ്രഷർ|പരിചയമില്ല/i.test(
      text,
    )
  ) {
    return { level: "fresher", years: 0, rangeLabel: "" };
  }
  if (
    /\bexperienced\b|అనుభవం\s*ఉన్న|अनुभवी|அனுபவம்\s*உள்ள|ಅನುಭವವಿರುವ|പരിചയമുള്ള/i.test(
      text,
    )
  ) {
    return { level: EXPERIENCED_SEARCH_LEVEL, years: null, rangeLabel: "experienced" };
  }
  return { level: "", years: null, rangeLabel: "" };
}

export function extractExperienceLevel(text: string): string {
  return extractExperienceDetail(text).level;
}

/** Recognized education words. The public job search API does not filter on this. */
export function extractEducationHint(text: string): string {
  if (/intermediate|ఇంటర్మీడియట్|ఇంటర్|इंटरमीडिएट|\binter\b|\b12th\b|twelfth/i.test(text)) {
    return "intermediate";
  }
  if (/\b10th\b|\bssc\b|tenth|పదవ తరగతి/i.test(text)) return "10th";
  if (/\b(degree|graduate|graduation|గ్రాడ్యుయేషన్|स्नातक)\b/i.test(text)) return "degree";
  return "";
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
    /salary|జీతం|వేతనం|वेतन|सैलरी|सैलेरी|तनख्वाह|சம்பளம்|ಸಂಬಳ|ശമ്പളം|minimum|min\.?|at\s+least|above|over|upto|up\s+to|from|between|₹|\brs\.?\b|\binr\b|kavali/i.test(
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
    /(?:salary|minimum|min|between|from|सैलरी|జీతం|वेतन)?[^\d]{0,24}(\d{4,7})\s*(?:to|-|–|से)\s*(\d{4,7})\b/i,
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

/**
 * Compare jobs already shown. Does not include "higher salary", which still
 * raises the previous minimum and searches again.
 */
export function looksLikeShownSalaryComparison(text: string): boolean {
  if (looksLikeRelativeHigherSalary(text)) return false;
  return /which\s+(one|job|of these|of them)\s+pays|who\s+pays\s+more|pays\s+(more|the most)|highest\s+(salary|pay)|better\s+pay|ekkuva\s+salary\s+edi|which\s+pays\s+more/i.test(
    text,
  );
}

/** Highest listed amount. Empty and "not disclosed" stay unknown — never zero. */
export function parseSalaryLabelCeiling(label: string): number | null {
  const cleaned = label.replace(/,/g, "");
  if (!cleaned.trim() || /not\s+disclosed|undisclosed|salary\s+not/i.test(cleaned)) return null;
  const range = cleaned.match(/(\d{4,7})\s*[–\-to]+\s*(\d{4,7})/i);
  if (range?.[2]) {
    const max = Number(range[2]);
    return Number.isFinite(max) ? max : null;
  }
  const one = cleaned.match(/(\d{4,7})/);
  if (!one?.[1]) return null;
  const amount = Number(one[1]);
  return Number.isFinite(amount) ? amount : null;
}

export function compareShownJobSalaries(
  jobs: Array<{ jobTitle: string; companyName?: string; salaryLabel: string }>,
  language: "en" | "hi" | "te" | "ta" | "kn" | "ml" = "en",
): string {
  const ranked = jobs
    .map((job, index) => ({
      index: index + 1,
      title: job.jobTitle || "Job",
      company: job.companyName || "",
      amount: parseSalaryLabelCeiling(job.salaryLabel),
      label: job.salaryLabel.trim(),
    }))
    .filter((job) => job.title);
  const known = ranked.filter((job) => job.amount != null);
  if (ranked.length === 0) {
    return language === "te"
      ? "Mundu jobs chupinchandi. Appudu e list lo ekkuva salary edi cheptha."
      : "Show me a job list first. Then I can compare the pay on those jobs.";
  }
  if (known.length === 0) {
    return language === "te"
      ? "Ee jobs lo salary mention cheyyaledhu, so ekkuva pay edi cheppalenu."
      : "Pay was not listed on these jobs, so I cannot say which one pays more.";
  }
  const top = Math.max(...known.map((job) => job.amount ?? 0));
  const winners = known.filter((job) => job.amount === top);
  const lines = winners.map((job) => {
    const who = job.company ? `${job.title} — ${job.company}` : job.title;
    return `${job.index}. ${who} (${job.label})`;
  });
  const hidden = ranked.length - known.length;
  const hiddenNote =
    hidden > 0
      ? language === "te"
        ? `\n${hidden} job(s) lo salary ledu, avi compare cheyyaledhu.`
        : `\n${hidden} job(s) had no salary listed, so they were left out.`
      : "";
  if (language === "te") {
    return `Ee list lo ekkuva salary:\n${lines.join("\n")}${hiddenNote}`;
  }
  if (language === "hi") {
    return `इस लिस्ट में ज़्यादा सैलरी:\n${lines.join("\n")}${hiddenNote}`;
  }
  return `Highest pay in the jobs I just showed:\n${lines.join("\n")}${hiddenNote}`;
}

/** Explicit salary preference / correction without requiring the word "salary". */
/** Drop a saved experience filter. "No experience" stays a fresher request, not a clear. */
export function looksLikeClearExperience(text: string): boolean {
  return /remove\s+experience|experience\s+(?:filter\s+)?(?:remove|clear|hatao|vaddu)|any\s+experience|అనుభవం\s*వద్దు|experience\s+vaddu|अनुभव\s*हटा|experience\s+hatao|அனுபவம்\s*வேண்டாம்|ಅನುಭವ\s*ಬೇಡ|പരിചയം\s*വേണ്ട/i.test(
    text,
  );
}

export function looksLikeSalaryPreferenceUpdate(text: string): boolean {
  const normalized = text.replace(/,/g, "");
  if (extractSalaryBand(text).min == null) return false;
  return (
    /salary|జీతం|వేతనం|वेतन|सैलरी|சம்பளம்|ಸಂಬಳ|ശമ്പളം|minimum|at\s+least|above|₹|\brs\.?\b/i.test(text) ||
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
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  "1st": 1,
  "2nd": 2,
  "3rd": 3,
  "4th": 4,
  "5th": 5,
  "6th": 6,
  "7th": 7,
  "8th": 8,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
};

const ORDINAL_TOKEN =
  "first|second|third|fourth|fifth|sixth|seventh|eighth|1st|2nd|3rd|4th|5th|6th|7th|8th|[1-8]";

/**
 * Map "apply for 5" / "the second job" / bare "5" onto the last shown WhatsApp results.
 * Supports 1–8 to match JOBS_FOR_AI_LIMIT. Returns null when the message is not a selection.
 */
export function jobOrdinalFromText(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const bare = trimmed.match(new RegExp(`^(${ORDINAL_TOKEN})$`, "i"));
  if (bare?.[1]) {
    return ORDINALS[bare[1].toLowerCase()] ?? null;
  }

  if (!/\b(?:jobs?|apply|select|choose|open|show)\b/i.test(trimmed)) return null;

  const patterns = [
    new RegExp(
      `\\b(?:apply(?:\\s+for)?|select|choose|show|open)\\s+(?:the\\s+)?(${ORDINAL_TOKEN})(?:\\s*(?:st|nd|rd|th))?\\s*(?:jobs?)?\\b`,
      "i",
    ),
    new RegExp(`\\b(?:the\\s+)?(${ORDINAL_TOKEN})\\s+jobs?\\b`, "i"),
    new RegExp(`\\bjobs?\\s+(?:number\\s+|#\\s*)?(${ORDINAL_TOKEN})\\b`, "i"),
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return ORDINALS[match[1].toLowerCase()] ?? null;
    }
  }
  return null;
}

/** True when the user tried to pick a listed job by number, including invalid numbers. */
export function looksLikeJobOrdinalSelection(text: string): boolean {
  if (jobOrdinalFromText(text) != null) return true;
  const trimmed = text.trim();
  if (/^(0|-?\d+)$/.test(trimmed)) return true;
  return /\b(?:apply(?:\s+for)?|select|choose|show|open|job)\s+(?:the\s+)?(?:-?\d+|ninth|tenth|0th)\b/i.test(
    trimmed,
  );
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
