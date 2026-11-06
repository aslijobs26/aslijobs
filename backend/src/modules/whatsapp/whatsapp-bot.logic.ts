import { z } from "zod";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUSES,
} from "../applications/application.constants.js";
import { getLocalizedWebsiteUrl } from "../../utils/site-language-url.js";
import {
  extractExperienceDetail,
  extractFreeJobTitle,
  looksLikeClearExperience,
  extractIndianState,
  extractSalaryBand,
  jobOrdinalFromText,
  looksLikeJobOrdinalSelection,
  looksLikeRelativeHigherSalary,
  looksLikeShownSalaryComparison,
  looksLikeSalaryPreferenceUpdate,
  placeKind,
  recallsEarlierLocation,
  wantsAnyLocation,
} from "./whatsapp-bot.criteria.js";
import {
  acceptRankedLabel,
  alignKnownRole,
  ambiguousRoleOptions,
  withinOneEdit,
  closestSupportedLabel,
  currentSearchCatalog,
  matchCatalogCityInText,
  matchCatalogRole,
  rankLabels,
} from "./whatsapp-search-catalog.js";

export const BOT_INTENTS = [
  "GREETING",
  "JOB_SEARCH",
  "JOB_DETAILS",
  "JOB_COUNT",
  "PROFILE_MATCH",
  "PROFILE_JOBS",
  "MY_SKILLS",
  "MY_APPLICATIONS",
  "APPLICATION_COUNT",
  "APPLICATION_STATUS",
  "APPLIED_COVERAGE",
  "HOW_TO_APPLY",
  "EMPLOYER_JOBS",
  "EMPLOYER_JOB_STATUS",
  "EMPLOYER_APPLICATION_COUNT",
  "POST_JOB",
  "ACCOUNT_STATUS",
  "PLATFORM_KNOWLEDGE",
  "HELP",
  "CLARIFY",
  "UNRELATED",
  "UNKNOWN",
] as const;

export type BotIntent = (typeof BOT_INTENTS)[number];
export type BotLanguage = "en" | "hi" | "te" | "ta" | "kn" | "ml";

export type BotScope = "PUBLIC_JOBS" | "OWN_DATA" | "OWN_EMPLOYER_DATA" | "NONE";

export type BotUnderstanding = {
  intent: BotIntent;
  language: BotLanguage;
  location: string;
  category: string;
  jobQuery: string;
  /** Search jobs in a place without a specific title. */
  openSearch: boolean;
  scope: BotScope;
  requiresAuth: boolean;
  confidence: number;
  focus: "" | "salary" | "company" | "about" | "find_jobs" | "register" | "contact_employer";
  /** City search, or a state with no city invented from it. */
  locationKind?: "city" | "state" | "";
  experienceLevel?: string;
  /** Years the user stated, kept even when the search API uses a nearby level. */
  originalExperienceYears?: number | null;
  /** Set when the user gave a range the public API cannot filter exactly. */
  experienceRangeLabel?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  /** "annual" means an LPA figure already converted to a monthly filter. */
  salaryBasis?: "monthly" | "annual";
  /** Set only when this account's role cannot perform the understood intent. */
  crossRole?: "" | "seeker" | "employer";
  anyLocation?: boolean;
  reuseLocation?: boolean;
  /** 1-based index into the last jobs shown on WhatsApp. */
  jobOrdinal?: number | null;
  /** Continue prior JOB_SEARCH and exclude previously shown jobs when practical. */
  showMore?: boolean;
  /** Explicit "remove experience filter" — empty experience must not inherit the previous one. */
  clearExperience?: boolean;
  /** Set when two roles or cities are plausible and the bot should ask. */
  clarifyField?: "" | "which_role" | "which_city" | "which_intent";
  clarifyOptions?: string[];
  /** Compare lastJobs salaries instead of raising the minimum and searching again. */
  compareShownSalaries?: boolean;
};

export type PublicJobFact = {
  jobTitle: string;
  companyName: string;
  cityName: string;
  stateName: string;
  jobId: string;
  salaryLabel: string;
};

/** Website public job page: frontend/src/app/(site)/jobs/[jobId]/page.tsx and ROUTES.jobPublic. */
export function sanitizePublicJobId(jobId: string): string {
  const id = jobId.trim();
  if (!id || id.length > 64) return "";
  if (/[/?#\s]/.test(id) || /^https?:/i.test(id)) return "";
  return id;
}

export function buildPublicJobApplyUrl(
  jobId: string,
  frontendOrigin: string,
  language?: string | null,
): string {
  const id = sanitizePublicJobId(jobId);
  const origin = frontendOrigin.trim().replace(/\/+$/, "");
  if (!id || !origin) return "";
  const url = `${origin}/jobs/${encodeURIComponent(id)}`;
  // Chatbot replies always pass a conversation language; omit only for
  // callers that intentionally want a language-neutral absolute path.
  if (language == null || String(language).trim() === "") {
    return url;
  }
  return getLocalizedWebsiteUrl(url, language);
}

const TELUGU_SCRIPT = /[\u0C00-\u0C7F]/;
const HINDI_SCRIPT = /[\u0900-\u097F]/;
const TAMIL_SCRIPT = /[\u0B80-\u0BFF]/;
const KANNADA_SCRIPT = /[\u0C80-\u0CFF]/;
const MALAYALAM_SCRIPT = /[\u0D00-\u0D7F]/;

const ROMAN_TELUGU =
  /\b(undha|unda|undi|undhi|vundha|vunda|vundi|vundhi|yundha|yunda|unnaya|unnayi|unnai|unnara|unnaru|kavali|kaavali|kavala|cheppu|cheppandi|cheyyandi|cheyandi|cheyyali|chudandi|chudali|chupinchu|naaku|naku|nenu|meeru|miru|enti|emiti|ela|enni|vachayi|chesina|pani|ledu|ledhu|levu|undali|ekkuva|takkuva|ippudu)\b|\blo\b/i;
const ROMAN_HINDI =
  /\b(kya|hain|mujhe|muje|muze|mujhko|chahiye|chaahiye|chahie|dikhao|dikha|batao|bataiye|naukri|mereko|mein|kitne|kitna|kitni|kaam|zarurat|zaroorat|milega|milegi)\b/i;
/** English verbs that sit immediately before "me" and are not the Hindi locative. */
const ENGLISH_ME_PREDECESSOR =
  /^(show|help|tell|give|ask|call|contact|for|with|to|let|pay|find|text|message|email|ping|send|get)$/i;
const ROMAN_TAMIL = /\b(venum|irukka|irukku|enakku|velai)\b|\bla\b/i;
const ROMAN_KANNADA = /\b(beku|ideya|nanage|kelasa)\b/i;
const ROMAN_MALAYALAM = /\b(venam|undo|enikku|joli)\b/i;

const PLACES: Array<{ canonical: string; forms: string[] }> = [
  { canonical: "Madhapur", forms: ["madhapur", "మాధాపూర్", "మాదాపూర్", "माधापुर"] },
  { canonical: "Gachibowli", forms: ["gachibowli", "గచ్చిబౌలి", "गच्चीबोवली"] },
  { canonical: "Kukatpally", forms: ["kukatpally", "kukatpalli", "కూకట్‌పల్లి", "కూకట్పల్లి", "కూకట్‌పల్లి"] },
  { canonical: "Hyderabad", forms: ["hyderabad", "హైదరాబాద్", "హైదరాబాదు", "हैदराबाद", "ஹைதராபாத்", "ஹைதராபாத்தில்", "ಹೈದರಾಬಾದ್", "ಹೈದರಾಬಾದ್‌ನಲ್ಲಿ", "ഹൈദരാബാദ്", "ഹൈദരാബാദിൽ"] },
  { canonical: "Secunderabad", forms: ["secunderabad", "సికింద్రాబాద్", "सिकंदराबाद"] },
  { canonical: "Bangalore", forms: ["bangalore", "bengaluru", "బెంగళూరు", "बैंगलोर", "बेंगलुरु", "பெங்களூ", "ಬೆಂಗಳೂರು", "ബെംഗളൂരു", "ബാംഗ്ലൂർ"] },
  { canonical: "Chennai", forms: ["chennai", "చెన్నై", "चेन्नई", "சென்னை", "ಚೆನ್ನೈ", "ചെന്നൈ"] },
  { canonical: "Coimbatore", forms: ["coimbatore", "కోయంబత్తూరు", "कोयंबटूर", "கோயம்புத்தூர்", "கோவை", "ಕೊಯಮತ್ತೂರು", "കോയമ്പത്തൂർ"] },
  { canonical: "Madurai", forms: ["madurai", "మదురై", "मदुरै", "மதுரை"] },
  { canonical: "Mumbai", forms: ["mumbai", "ముంబై", "मुंबई", "மும்பை", "ಮುಂಬೈ", "മുംബൈ"] },
  { canonical: "Delhi", forms: ["delhi", "ఢిల్లీ", "दिल्ली", "டெல்லி", "ದೆಹಲಿ", "ഡൽഹി"] },
  { canonical: "Pune", forms: ["pune", "పూణె", "पुणे"] },
  { canonical: "Kochi", forms: ["kochi", "cochin", "కొచ్చి", "कोच्चि", "கொச்சி", "ಕೊಚ್ಚಿ", "കൊച്ചി"] },
  { canonical: "Mysore", forms: ["mysore", "mysuru", "మైసూరు", "मैसूर", "ಮೈಸೂರು"] },
  { canonical: "Vijayawada", forms: ["vijayawada", "విజయవాడ", "विजयवाड़ा"] },
  { canonical: "Visakhapatnam", forms: ["visakhapatnam", "vizag", "vishakapatnam", "విశాఖపట్నం", "వైజాగ్", "विशाखापत्तनम"] },
  { canonical: "Warangal", forms: ["warangal", "వరంగల్"] },
  { canonical: "Guntur", forms: ["guntur", "గుంటూరు"] },
  { canonical: "Tirupati", forms: ["tirupati", "tirupathi", "తిరుపతి", "तिरुपति"] },
  { canonical: "Nellore", forms: ["nellore", "నెల్లూరు"] },
  { canonical: "Kakinada", forms: ["kakinada", "కాకినాడ"] },
  { canonical: "Rajahmundry", forms: ["rajahmundry", "rajamundry", "rajamahendravaram", "రాజమండ్రి", "రాజమహేంద్రవరం"] },
  { canonical: "Bhimavaram", forms: ["bhimavaram", "భీమవరం"] },
  { canonical: "Tadepalligudem", forms: ["tadepalligudem", "tadepallegudem", "తాడేపల్లిగూడెం"] },
  { canonical: "Eluru", forms: ["eluru", "ఏలూరు"] },
  { canonical: "Karimnagar", forms: ["karimnagar", "కరీంనగర్"] },
  { canonical: "Nizamabad", forms: ["nizamabad", "నిజామాబాద్"] },
  { canonical: "Khammam", forms: ["khammam", "ఖమ్మం"] },
  { canonical: "Bhubaneswar", forms: ["bhubaneswar", "bhubaneshwar", "bhubaneswar", "భువనేశ్వర్", "भुवनेश्वर"] },
  { canonical: "Cuttack", forms: ["cuttack", "కటక్", "कटक"] },
  { canonical: "Bhopal", forms: ["bhopal", "భోపాల్", "भोपाल"] },
  { canonical: "Indore", forms: ["indore", "ఇండోర్", "इंदौर"] },
  { canonical: "Jaipur", forms: ["jaipur", "జైపూర్", "जयपुर"] },
  { canonical: "Ahmedabad", forms: ["ahmedabad", "amdavad", "అహ్మదాబాద్", "अहमदाबाद"] },
  { canonical: "Kolkata", forms: ["kolkata", "calcutta", "కోల్‌కతా", "कोलकाता"] },
  { canonical: "Lucknow", forms: ["lucknow", "లక్నో", "लखनऊ"] },
  { canonical: "Chandigarh", forms: ["chandigarh", "చండీగఢ్", "चंडीगढ़"] },
];

/** Neighbourhoods searched again at city level when they have no results. */
const PLACE_PARENT_CITY: Record<string, string> = {
  Madhapur: "Hyderabad",
  Gachibowli: "Hyderabad",
  Kukatpally: "Hyderabad",
};

const ROLES: Array<{ canonical: string; forms: string[] }> = [
  { canonical: "Safety Supervisor", forms: ["safety supervisor", "saftey supervisor", "safety superviser"] },
  { canonical: "Interior Designer", forms: ["interior designer", "interior design", "ఇంటీరియర్ డిజైనర్"] },
  { canonical: "Software Developer", forms: ["software developer", "software engineer", "web developer", "programmer", "developer", "డెవలపర్", "సాఫ్ట్వేర్ డెవలపర్", "डेवलपर", "सॉफ्टवेयर डेवलपर", "டெவலப்பர்", "ಡೆವಲಪರ್", "ഡെവലപ്പർ"] },
  { canonical: "Accountant", forms: ["accountant", "अकाउंटेंट", "అకౌంటెంట్", "அக்கவுண்டன்ட்", "ಅಕೌಂಟೆಂಟ್", "അക്കൗണ്ടന്റ്"] },
  { canonical: "Car Driver", forms: ["car driver", "car drivers"] },
  { canonical: "Driver", forms: ["driver", "డ్రైవర్", "డ్రైవరు", "ड्राइवर", "டிரைவர்", "ಡ್ರೈವರ್", "ഡ്രൈവർ"] },
  { canonical: "Delivery Executive", forms: ["delivery executive", "delivery boy", "delivery agent", "డెలివరీ బాయ్", "डिलीवरी बॉय", "டெலிவரி பாய்", "ಡೆಲಿವರಿ ಬಾಯ್", "ഡെലിവറി ബോയ്"] },
  { canonical: "Delivery", forms: ["delivery", "డెలివరీ", "డెలివరి", "डिलीवरी"] },
  { canonical: "Security Guard", forms: ["security guard", "security guards", "security officer"] },
  { canonical: "Watchman", forms: ["watchman", "వాచ్‌మన్", "వాచ్మన్", "वॉचमैन"] },
  { canonical: "Electrician", forms: ["electrician", "electrian", "electrcian", "electrical", "ఎలక్ట్రీషియన్", "ఎలక్ట్రిషియన్", "ఎలెక్ట్రీషియన్", "ఎలెక్ట్రిషియన్", "इलेक्ट्रीशियन", "इलेक्ट्रिशियन", "बिजली मिस्त्री", "எலக்ட்ரீஷியன்", "எலக்ட்ரிஷியன்", "எலக்ட்ரீஷியனாக", "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್", "ಎಲೆಕ್ಟ್ರೀಷಿಯನ್", "ഇലക്ട്രീഷ്യൻ", "ഇലക്ട്രിഷ്യൻ"] },
  { canonical: "Carpenter", forms: ["carpenter", "కార్పెంటర్", "कारपेंटर"] },
  { canonical: "Plumber", forms: ["plumber", "ప్లంబర్", "प्लंबर"] },
  { canonical: "Cook", forms: ["cook", "వంటవాడు", "रसोइया"] },
  { canonical: "Sales Executive", forms: ["sales executive", "sales executives", "sales boy", "sales girl", "salesgirl", "సేల్స్ ఎగ్జిక్యూటివ్", "सेल्स एग्जीक्यूटिव", "सेल्स एक्जीक्यूटिव", "சேல்ஸ் எக்சிகியூட்டிவ்", "ಸೇಲ್ಸ್ ಎಕ್ಸಿಕ್ಯೂಟಿವ್", "സെയിൽസ് എക്സിക്യൂട്ടീവ്"] },
  { canonical: "Sales", forms: ["sales", "సేల్స్", "सेल्स"] },
  { canonical: "Helper", forms: ["helper", "హెల్పర్", "हेल्पर"] },
  { canonical: "Mason", forms: ["mason", "మేసన్", "मेसन", "రాయి పని"] },
  { canonical: "Housekeeping", forms: ["housekeeping staff", "house keeping", "housekeeping", "హౌస్ కీపింగ్", "हाउसकीपिंग"] },
  { canonical: "Warehouse", forms: ["warehouse", "వేర్‌హౌస్", "वेयरहाउस"] },
  { canonical: "Painter", forms: ["painter", "పెయింటర్", "पेंटर"] },
  { canonical: "Welder", forms: ["welder", "వెల్డర్", "वेल्डर"] },
  { canonical: "Mechanic", forms: ["mechanic", "మెకానిక్", "मैकेनिक"] },
  { canonical: "Cleaner", forms: ["cleaner", "క్లీనర్", "क्लीनर"] },
  { canonical: "Labour", forms: ["labour", "labor", "లేబర్", "मजदूर", "కూలీ"] },
];

const JOB_WORDS = [
  "job",
  "jobs",
  "vacancy",
  "vacancies",
  "opening",
  "openings",
  "ఉద్యోగం",
  "ఉద్యోగాలు",
  "జాబ్",
  "జాబ్స్",
  "పని",
  "नौकरी",
  "नौकरियां",
  "जॉब",
  "जॉब्स",
  "வேலை",
  "ಕೆಲಸ",
  "ಉದ್ಯೋಗ",
  "ജോലി",
  "naukri",
  "udyog",
  "velai",
  "kelasa",
  "joli",
];

const REQUEST_WORDS = [
  "undha",
  "unda",
  "vundha",
  "vunda",
  "yundha",
  "yunda",
  "unnaya",
  "unnayi",
  "kavali",
  "chudandi",
  "ఉందా",
  "ఉన్నాయా",
  "ఉన్నాయి",
  "కావాలి",
  "చూపించు",
  "వెతుకు",
  "है",
  "हैं",
  "चाहिए",
  "दिखाओ",
  "வேண்டும்",
  "இருக்கா",
  "ಬೇಕು",
  "വേണം",
  "undo",
  "chahiye",
  "beku",
  "venum",
  "venam",
];

const TE_PLACE: Record<string, string> = {
  Madhapur: "మాధాపూర్",
  Gachibowli: "గచ్చిబౌలి",
  Kukatpally: "కూకట్‌పల్లి",
  Hyderabad: "హైదరాబాద్",
  Secunderabad: "సికింద్రాబాద్",
  Chennai: "చెన్నై",
  Bangalore: "బెంగళూరు",
  Vijayawada: "విజయవాడ",
  Visakhapatnam: "విశాఖపట్నం",
};
const HI_PLACE: Record<string, string> = {
  Madhapur: "माधापुर",
  Hyderabad: "हैदराबाद",
  Gachibowli: "गच्चीबोवली",
  Kukatpally: "कुकटपल्ली",
  Chennai: "चेन्नई",
};
const TE_ROLE: Record<string, string> = {
  Driver: "డ్రైవర్",
  Delivery: "డెలివరీ",
  Watchman: "వాచ్‌మన్",
  Electrician: "ఎలక్ట్రీషియన్",
  Carpenter: "కార్పెంటర్",
  Plumber: "ప్లంబర్",
};
const HI_ROLE: Record<string, string> = {
  Driver: "ड्राइवर",
  Delivery: "डिलीवरी",
  Watchman: "वॉचमैन",
  Electrician: "इलेक्ट्रीशियन",
};

export function languageFromHint(hint: string | null | undefined): BotLanguage | null {
  const code = hint?.trim().toLowerCase() ?? "";
  if (code.startsWith("te")) return "te";
  if (code.startsWith("hi")) return "hi";
  if (code.startsWith("ta")) return "ta";
  if (code.startsWith("kn")) return "kn";
  if (code.startsWith("ml")) return "ml";
  if (code.startsWith("en")) return "en";
  return null;
}

/** Short acks, names-as-digits, and yes/no must not flip a saved language. */
export function isAmbiguousLanguageSignal(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return true;
  }
  if (
    /^(yes|no|yeah|yep|y|n|ok|okay|k|hmm|oh|hi|hello|hey|hai|avunu|kadu|haan|han|ha|nahi|nahin|sare|sari)[.!?]*$/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  if (/^\+?\d[\d\s-]{5,}$/.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * "hyderabad me driver" is Hindi. "show me jobs" is English.
 * Bare "hai" is not included: it collides with the greeting "Hai".
 */
function hasHindiLocativeMe(text: string): boolean {
  const match = text.match(/\b([A-Za-z]{3,})\s+me\s+[A-Za-z]{3,}/i);
  if (!match?.[1]) return false;
  return !ENGLISH_ME_PREDECESSOR.test(match[1]);
}

function explicitRomanLanguage(text: string): BotLanguage | null {
  if (ROMAN_TAMIL.test(text)) return "ta";
  if (ROMAN_KANNADA.test(text)) return "kn";
  if (ROMAN_MALAYALAM.test(text)) return "ml";
  if (ROMAN_TELUGU.test(text)) return "te";
  if (ROMAN_HINDI.test(text)) return "hi";
  if (hasHindiLocativeMe(text) && !isClearEnglishSignal(text)) return "hi";
  if (
    /\bhai\b/i.test(text) &&
    !isAmbiguousLanguageSignal(text) &&
    !isClearEnglishSignal(text)
  ) {
    return "hi";
  }
  return null;
}

export function hasClearCurrentLanguageSignal(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }
  if (TAMIL_SCRIPT.test(trimmed)) return true;
  if (KANNADA_SCRIPT.test(trimmed)) return true;
  if (MALAYALAM_SCRIPT.test(trimmed)) return true;
  if (TELUGU_SCRIPT.test(trimmed)) return true;
  if (HINDI_SCRIPT.test(trimmed)) return true;
  if (explicitRomanLanguage(trimmed)) return true;
  return isClearEnglishSignal(trimmed);
}

export function isClearEnglishSignal(text: string): boolean {
  const trimmed = text.trim();
  if (
    /\b(i want|i need|i am|i'm|i’m|looking for|hello|please|are there|is there|show me|find jobs?|post a job|how many|can you|could you|would you|do you|tell me|give me|help me|what|where|which|when|why|how|available|applications?)\b/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  return (
    /\b(?:job|jobs|vacancy|vacancies|opening|openings)\b/i.test(trimmed) &&
    /\b(?:in|at|near|around)\b/i.test(trimmed)
  );
}

/**
 * Resolves the conversation language for the current turn.
 * Script and romanized cues from this message win over the session.
 * A normal English sentence also wins over the session.
 * Ambiguous acknowledgments inherit the session language.
 */
export function detectLanguage(
  text: string,
  previous?: BotLanguage | null,
  hint?: BotLanguage | null,
  inheritPrevious = false,
): BotLanguage {
  if (TAMIL_SCRIPT.test(text)) return "ta";
  if (KANNADA_SCRIPT.test(text)) return "kn";
  if (MALAYALAM_SCRIPT.test(text)) return "ml";
  if (TELUGU_SCRIPT.test(text)) return "te";
  if (HINDI_SCRIPT.test(text)) return "hi";
  const roman = explicitRomanLanguage(text);
  if (roman) return roman;
  const trimmed = text.trim();
  if (previous && isAmbiguousLanguageSignal(trimmed)) {
    return previous;
  }
  if (isClearEnglishSignal(trimmed)) return "en";
  if (hint && hint !== "en") return hint;
  if (inheritPrevious && previous) return previous;
  if (
    previous &&
    previous !== "en" &&
    trimmed.length > 0 &&
    trimmed.length < 12 &&
    !/[A-Za-z]{4,}/.test(trimmed)
  ) {
    return previous;
  }
  return "en";
}

/**
 * Last-10-digit collapse. Prefer {@link indianWhatsAppNationalPhone} for
 * account identity — foreign WhatsApp numbers must not map onto Indian accounts.
 */
export function nationalPhone(from: string): string {
  const digits = from.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Indian mobile identity only (+91 / 0 / bare 10 starting 6–9).
 * Returns null for other country codes so they cannot collide with JobSeeker/Employer rows.
 */
export function indianWhatsAppNationalPhone(from: string): string | null {
  const digits = from.replace(/\D/g, "");
  let national = "";
  if (digits.length === 12 && digits.startsWith("91")) {
    national = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    national = digits.slice(1);
  } else if (digits.length === 10) {
    national = digits;
  } else {
    return null;
  }
  return /^[6-9]\d{9}$/.test(national) ? national : null;
}

/**
 * Session / rate-limit / inbox key. Indian senders keep the 10-digit national key;
 * other countries use a prefixed full-digit key so they never share an Indian session.
 */
export function whatsAppSessionPhoneKey(from: string): string {
  const indian = indianWhatsAppNationalPhone(from);
  if (indian) return indian;
  const digits = from.replace(/\D/g, "");
  if (digits.length > 0) return `intl:${digits}`;
  const raw = from.trim().slice(0, 32);
  return raw ? `raw:${raw}` : "unknown";
}

export type ProtocolTurn = "greeting" | "thanks" | "ack";

/** Whole-message protocol only. Never used to classify jobs or applications. */
/** User says they have no resume — continue discovery; do not block. */
export function isNoResumeMessage(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    /don'?t have (a )?resume/.test(t) ||
    /\bno resume\b/.test(t) ||
    /without (a )?resume/.test(t) ||
    /resume ledu|cv ledu|రెజ్యూమ్ లేదు|रिज़्यूमे नहीं|रिज्यूम नहीं|ரெஸ்யூம் இல்லை|ರೆಸ್ಯೂಮ್ ಇಲ್ಲ|റെസ്യൂം ഇല്ല/.test(
      text,
    )
  );
}

/**
 * Temporary conversational search slots cleared on a standalone greeting / fresh start.
 * Does not touch permanent account data (seeker profile, language preference, applications).
 */
export function clearedTemporarySearchSessionFields(): Record<string, unknown> {
  return {
    pendingLocation: "",
    pendingCategory: "",
    pendingOpenSearch: false,
    pendingIntent: "",
    pendingClarification: "",
    pendingNearbyCity: "",
    lastClarifyMissing: "",
    clarifyAttempts: 0,
    lastIntent: "",
    lastLocation: "",
    lastCategory: "",
    lastExperience: "",
    lastExperienceYears: null,
    lastExperienceRange: "",
    lastMinSalary: null,
    lastMaxSalary: null,
    lastSalaryBasis: "",
    locationKind: "",
    lastJobs: [],
    lastSeenJobIds: [],
  };
}

export function detectProtocolTurn(text: string): ProtocolTurn | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 24) return null;
  if (
    /^(hi|hello|hey|hy|namaste|హాయ్|హాయి|హలో|నమస్తే|నమస్కారం|नमस्ते|हाय|हेलो|வணக்கம்|ನಮಸ್ಕಾರ|നമസ്കാരം)[!.,]?$/i.test(
      trimmed,
    )
  ) {
    return "greeting";
  }
  if (
    /^(thanks|thank you|धन्यवाद|ధన్యవాదాలు|நன்றி|ಧನ್ಯವಾದ|നന്ദി)\.?$/i.test(trimmed)
  ) {
    return "thanks";
  }
  if (
    /^(ok|okay|oke|bye|goodbye|yes|no|yeah|yep|yup|nope|haan|han|ha|avunu|kadu|sare|nahi|nahin|సరే|అవును|కాదు|ठीक|सही|हाँ|हां|नहीं|சரி|ஆம்|இல்லை|ಸರಿ|ಹೌದು|ಇಲ್ಲ|ശരಿ|അതെ|ഇല്ല|బై)\.?$/i.test(
      trimmed,
    )
  ) {
    return "ack";
  }
  return null;
}

export function protocolReply(
  turn: ProtocolTurn,
  language: BotLanguage,
  account: AccountKind,
  name: string,
): string {
  if (turn === "greeting") {
    return greetingCopy({ language, account, name });
  }
  if (turn === "thanks") {
    if (language === "te") return "సరే 👍 ఇంకా ఏమైనా కావాలా?";
    if (language === "hi") return "शुक्रिया 👍 और कुछ चाहिए?";
    if (language === "ta") return "நன்றி 👍 வேறு ஏதாவது வேண்டுமா?";
    if (language === "kn") return "ಧನ್ಯವಾದ 👍 ಇನ್ನೇನಾದರೂ ಬೇಕೇ?";
    if (language === "ml") return "നന്ദി 👍 മറ്റെന്തെങ്കിലും വേണോ?";
    return "You're welcome. Anything else I can help with?";
  }
  if (language === "te") return "సరే 👍";
  if (language === "hi") return "ठीक है 👍";
  if (language === "ta") return "சரி 👍";
  if (language === "kn") return "ಸರಿ 👍";
  if (language === "ml") return "ശരി 👍";
  return "Okay 👍";
}

const understandingSchema = z.object({
  intent: z.enum(BOT_INTENTS),
  language: z.enum(["en", "hi", "te", "ta", "kn", "ml"]),
  location: z.string().optional().default(""),
  category: z.string().optional().default(""),
  jobQuery: z.string().optional().default(""),
  jobTitle: z.string().optional(),
  openSearch: z.boolean().optional(),
  confidence: z.coerce.number().optional(),
  focus: z.string().optional(),
  requestedAction: z.string().optional(),
  isOutOfScope: z.boolean().optional(),
});

function scopeForIntent(intent: BotIntent): BotScope {
  if (
    intent === "EMPLOYER_JOBS" ||
    intent === "EMPLOYER_JOB_STATUS" ||
    intent === "EMPLOYER_APPLICATION_COUNT" ||
    intent === "POST_JOB"
  ) {
    return "OWN_EMPLOYER_DATA";
  }
  // ACCOUNT_STATUS is dual-role; applyAccountAwareIntent sets OWN_DATA / OWN_EMPLOYER_DATA.
  if (
    intent === "MY_APPLICATIONS" ||
    intent === "APPLICATION_COUNT" ||
    intent === "APPLICATION_STATUS" ||
    intent === "APPLIED_COVERAGE" ||
    intent === "PROFILE_JOBS" ||
    intent === "PROFILE_MATCH" ||
    intent === "MY_SKILLS"
  ) {
    return "OWN_DATA";
  }
  if (intent === "JOB_SEARCH" || intent === "JOB_DETAILS" || intent === "JOB_COUNT") {
    return "PUBLIC_JOBS";
  }
  return "NONE";
}

function filledUnderstanding(
  text: string,
  language: BotLanguage,
  patch: Partial<BotUnderstanding>,
): BotUnderstanding {
  return {
    ...minimalUnderstanding(text),
    language,
    confidence: 0.94,
    ...patch,
  };
}

/** One-word commands that must not wait for a model. Protocol words stay in detectProtocolTurn. */
export function shortCommandUnderstanding(
  text: string,
  language: BotLanguage,
): BotUnderstanding | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 16 || trimmed.split(/\s+/).length > 2) {
    return null;
  }
  if (/^(jobs?|naukri|udyogalu|panulu)$/i.test(trimmed)) {
    return filledUnderstanding(text, language, {
      intent: "JOB_SEARCH",
      openSearch: true,
      scope: "PUBLIC_JOBS",
    });
  }
  if (/^(apply|applycheyyi)$/i.test(trimmed)) {
    return filledUnderstanding(text, language, {
      intent: "HOW_TO_APPLY",
      scope: "NONE",
    });
  }
  return null;
}

/**
 * Two strong asks in one message. We do not run both. The reply asks which is first.
 * "How do I apply for driver jobs" stays a single apply/search intent.
 */
export function looksLikeCompetingIntents(text: string): boolean {
  if (!/\band\b|మరియు|\+|\/|,/i.test(text)) return false;
  if (/how\s+(?:do\s+i\s+|to\s+|can\s+i\s+)?apply/i.test(text)) return false;
  const jobs = messageLooksLikeJobAsk(text) && Boolean(extractRole(text) || extractPlace(text));
  const applications =
    /application\s+status|my\s+applications|naa\s+application|status\s+enti/i.test(text);
  return jobs && applications;
}

export function understandLocally(
  text: string,
  previous?: BotLanguage | null,
  hint?: BotLanguage | null,
): BotUnderstanding {
  const language = detectLanguage(text, previous, hint, isFollowUpFragment(text));
  const short = shortCommandUnderstanding(text, language);
  if (short) return short;
  if (looksLikeCompetingIntents(text)) {
    return {
      ...minimalUnderstanding(text, previous, hint),
      intent: "CLARIFY",
      language,
      clarifyField: "which_intent",
      confidence: 0.95,
      scope: "NONE",
    };
  }
  if (looksLikeShownSalaryComparison(text)) {
    return {
      ...minimalUnderstanding(text, previous, hint),
      intent: "JOB_DETAILS",
      language,
      compareShownSalaries: true,
      focus: "salary",
      confidence: 0.95,
      scope: "PUBLIC_JOBS",
    };
  }
  const folded = text.toLowerCase();
  let location = extractPlace(text);
  let category = extractRole(text);
  const cityOptions = competingPlaces(text);
  let clarifyField: "" | "which_role" | "which_city" = "";
  let clarifyOptions: string[] = [];
  if (cityOptions.length >= 2) {
    location = "";
    clarifyField = "which_city";
    clarifyOptions = cityOptions;
  }
  const roleOptions = ambiguousRoleOptions(text, category);
  if (!clarifyField && roleOptions.length >= 2) {
    category = "";
    clarifyField = "which_role";
    clarifyOptions = roleOptions;
  }
  const salaryBandEarly = extractSalaryBand(text);
  const showMoreAsk = looksLikeShowMoreJobs(text);
  const salaryOnlyAsk =
    !showMoreAsk &&
    salaryBandEarly.min != null &&
    looksLikeSalaryPreferenceUpdate(text) &&
    !category &&
    !location;
  const relativeSalaryAsk = !showMoreAsk && !salaryOnlyAsk && looksLikeRelativeHigherSalary(text);
  const mentionsJob = mentionsJobWord(text);
  const mentionsRequest = includesAny(text, REQUEST_WORDS);
  const ownApply =
    /apply|applied|అప్లై|చేశా|applications?|అప్లికేషన్|आवेदन/i.test(text);
  // Require an explicit profile cue so generic "suitable jobs" search stays JOB_SEARCH.
  const profile =
    /profile|ప్రొఫైల్|प्रोफाइल|प्रोफ़ाइल/i.test(text) &&
    (mentionsJob ||
      mentionsRequest ||
      /jobs?/i.test(folded) ||
      ownApply ||
      /suitable|సరిపోయే/i.test(text));
  const howToApply =
    /how\s+(?:do\s+i\s+|to\s+|can\s+i\s+)?apply|apply\s+cheyya|apply\s+kaise|apply\s+ela|apply\s+ఎలా|ఎలా\s+apply|कैसे\s+apply|apply\s+कैसे/i.test(
      folded,
    );
  const aboutAsliJobs = looksLikeAboutAsliJobs(text);
  const howToFindJobs = looksLikeHowToFindJobs(text);
  const howToRegister = looksLikeHowToRegister(text);
  const contactEmployerGuide = looksLikeContactEmployerGuide(text);
  const platformKnowledge = looksLikePlatformKnowledge(text);
  const applications = ownApply && !howToApply;
  const myPosted = looksLikeOwnPostedJobsQuestion(text);
  const profileStatusAsk = looksLikeProfileStatusQuestion(text);
  const seekerRoleCue = chooseAccountRole(text) === "seeker";
  const explicitPostJob = looksLikePostJobRequest(text);
  const employerInfoQuestion = looksLikeEmployerInformationQuestion(text);
  // Explicit "post a job" stays hire. Role+job phrases ("electrician job") never become POST_JOB.
  // Informational employer FAQ/pricing/guide questions must not become POST_JOB.
  const hireIntent =
    !seekerRoleCue &&
    !employerInfoQuestion &&
    !platformKnowledge &&
    (explicitPostJob ||
      (chooseAccountRole(text) === "employer" &&
        !(category && (mentionsJob || mentionsRequest))));
  const employer =
    myPosted ||
    /candidates?\s+who\s+applied|show\s+(?:me\s+)?(?:the\s+)?candidates|applicants\s+(?:who|for)|who\s+applied\s+(?:to|for)\s+(?:my|the)/i.test(
      text,
    ) ||
    (/(applications?|applied|applicants|వచ్చాయి|vachayi)/i.test(text) &&
      /(my job|my jobs|నా\s*jobs|\bna jobs\b|for my|posted|post\s*chesina|nenu\s+post)/i.test(
        text,
      ));
  const ambiguousReceived =
    /applications?|అప్లికేషన్/i.test(text) &&
    /వచ్చాయి|received/i.test(text) &&
    !myPosted;
  const greeting = /^(హాయ్|హలో|నమస్తే|नमस्ते|हाय|hi|hello|hey|hy)\b/i.test(
    text.trim(),
  );
  const unrelated =
    /cricket|joke|weather|assignment|who won|today'?s match|movie|elon|president|recipe|python|show database|all employers/i.test(
      text,
    ) && !ownApply;
  const appliedAll =
    /అన్ని|all jobs|सभी|எல்லா|ಎಲ್ಲಾ|എല്ലാ/i.test(text) &&
    /apply|applied|అప్లై|చేశా/i.test(text);
  const salaryAsk =
    /salary|జీతం|వేతనం|वेतन|तनख्वाह|சம்பளம்|ಸಂಬಳ|ശമ്പളം/i.test(text) &&
    /what(?:'s| is)|how much|ఎంత|कितना|for this job|for that job|this job|that job/i.test(text) &&
    !category &&
    !location;
  const companyAsk =
    /company|కంపెనీ|कंपनी|நிறுவனம்/i.test(text) && !category && text.trim().length < 60;

  let intent: BotIntent = "UNKNOWN";
  let guideFocus: BotUnderstanding["focus"] = "";
  if (unrelated) intent = "UNRELATED";
  else if (
    /^(help)\b/i.test(text.trim()) ||
    /^(సహాయం|मदद|உதவி|ಸಹಾಯ|സഹായം)\s*[!?.]*$/i.test(text.trim()) ||
    /\bwhat can you do\b/i.test(text) ||
    /\bneed help with my account\b/i.test(text) ||
    /(help|సహాయం|मदद|உதவி|ಸಹಾಯ|സഹായം).{0,60}(account|ఖాతా|खाता|கணக்கு|ಖಾತೆ|അക്കൗണ്ട്)/i.test(
      text,
    )
  ) {
    intent = "HELP";
  } else if (platformKnowledge) {
    intent = "PLATFORM_KNOWLEDGE";
    if (aboutAsliJobs) guideFocus = "about";
    else if (howToFindJobs) guideFocus = "find_jobs";
    else if (howToRegister) guideFocus = "register";
    else if (contactEmployerGuide) guideFocus = "contact_employer";
  } else if (howToApply) {
    intent = "HOW_TO_APPLY";
  } else if (greeting && text.trim().length < 20 && !mentionsJob && !ownApply && !category && !location) {
    intent = "GREETING";
  }
  // Standalone menu-style "profile" (not "jobs matching my profile").
  else if (/^(profile|my profile|👤)\b/i.test(text.trim()) && !mentionsJob && !ownApply) {
    intent = "ACCOUNT_STATUS";
  }
  // Profile / verification status — never PROFILE_JOBS or JOB_SEARCH.
  else if (profileStatusAsk) intent = "ACCOUNT_STATUS";
  else if (profile) intent = "PROFILE_JOBS";
  else if (appliedAll) intent = "APPLIED_COVERAGE";
  else if (/company|కంపెనీ|कंपनी/i.test(text) && applications && !myPosted) {
    intent = "EMPLOYER_APPLICATION_COUNT";
  } else if (ambiguousReceived) intent = "CLARIFY";
  else if (employer) {
    intent = /status|స్టేటస్|స్టేజ్|स्थिति/i.test(text)
      ? "EMPLOYER_JOB_STATUS"
      : /ఎన్ని|how many|applications?|applied|వచ్చాయి|vachayi|\benni\b/i.test(text)
        ? "EMPLOYER_APPLICATION_COUNT"
        : "EMPLOYER_JOBS";
  } else if (hireIntent && !ownApply) {
    intent = "POST_JOB";
  } else if (applications) {
    intent = /status|review|reviewed|స్టేటస్|స్టేజ్|स्थिति|நிலை/i.test(text)
      ? "APPLICATION_STATUS"
      : /ఎన్ని|how many|कितनी|எத்தனை|ಎಷ್ಟು|എത്ര/i.test(text)
        ? "APPLICATION_COUNT"
        : "MY_APPLICATIONS";
  } else if (/my skills|skills unnayi|నైపుణ్యాలు/i.test(text)) intent = "MY_SKILLS";
  else if (salaryAsk || companyAsk) intent = "JOB_DETAILS";
  else if (showMoreAsk || salaryOnlyAsk || relativeSalaryAsk) intent = "JOB_SEARCH";
  else if (
    category ||
    (category && location) ||
    mentionsJob ||
    (location && mentionsRequest) ||
    /\b(search cheyyi|job kavali|jobs unnaya)\b/i.test(folded)
  ) {
    intent = "JOB_SEARCH";
  } else if (location && text.trim().length < 40) {
    intent = "JOB_SEARCH";
  }

  const ordinal = jobOrdinalFromText(text);
  const ordinalSelection = looksLikeJobOrdinalSelection(text);
  if (ordinal != null) {
    intent = "JOB_DETAILS";
  } else if (ordinalSelection) {
    // "apply for 9" / "0" — keep JOB_DETAILS so we clarify instead of listing applications.
    intent = "JOB_DETAILS";
  }
  const salaryBand = salaryBandEarly;
  const experience = extractExperienceDetail(text);
  const anyLocation = wantsAnyLocation(text);
  const scope = scopeForIntent(intent);
  // Employer management intents must not keep free-title noise as a job filter.
  const employerManaged =
    intent === "EMPLOYER_JOBS" ||
    intent === "EMPLOYER_JOB_STATUS" ||
    intent === "EMPLOYER_APPLICATION_COUNT" ||
    intent === "ACCOUNT_STATUS";
  const followUpSlot = showMoreAsk || salaryOnlyAsk || relativeSalaryAsk;
  const wipeRoleNoise =
    intent === "HELP" ||
    intent === "PLATFORM_KNOWLEDGE" ||
    intent === "HOW_TO_APPLY" ||
    intent === "GREETING" ||
    intent === "UNRELATED" ||
    intent === "CLARIFY";
  const cleanCategory = employerManaged || followUpSlot || wipeRoleNoise ? "" : category;
  const openSearch =
    intent === "JOB_SEARCH" &&
    !cleanCategory &&
    !followUpSlot &&
    (mentionsJob || mentionsRequest || anyLocation);

  return {
    intent,
    language,
    location: anyLocation || employerManaged || followUpSlot ? "" : location,
    category: cleanCategory,
    jobQuery: cleanCategory,
    openSearch,
    scope,
    requiresAuth: scope === "OWN_DATA" || scope === "OWN_EMPLOYER_DATA",
    confidence: intent === "UNKNOWN" ? 0.35 : intent === "CLARIFY" ? 0.7 : 0.94,
    focus: guideFocus
      ? guideFocus
      : companyAsk
        ? "company"
        : salaryAsk || salaryOnlyAsk || relativeSalaryAsk
          ? "salary"
          : "",
    locationKind: anyLocation ? "" : placeKind(location),
    experienceLevel: experience.level,
    originalExperienceYears: experience.years,
    experienceRangeLabel: experience.rangeLabel,
    minSalary: salaryBand.min,
    maxSalary: salaryBand.max,
    salaryBasis: salaryBand.basis,
    crossRole: "",
    anyLocation,
    reuseLocation: recallsEarlierLocation(text) || followUpSlot,
    jobOrdinal: ordinalSelection ? ordinal ?? 0 : ordinal,
    showMore: showMoreAsk,
    clarifyField,
    clarifyOptions,
  };
}

/** High-confidence local reads do not need a classifier model. */
export function isConfidentLocalUnderstanding(understanding: BotUnderstanding): boolean {
  return understanding.intent !== "UNKNOWN" && understanding.confidence >= 0.9;
}

export function lookingAtQuestionCopy(language: BotLanguage): string {
  if (language === "te") return "మీ ప్రశ్నను చూస్తున్నాను...";
  if (language === "hi") return "आपका सवाल देख रहा हूँ...";
  if (language === "ta") return "உங்கள் கேள்வியை பார்க்கிறேன்...";
  if (language === "kn") return "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ನೋಡುತ್ತಿದ್ದೇನೆ...";
  if (language === "ml") return "നിങ്ങളുടെ ചോദ്യം നോക്കുന്നു...";
  return "Looking at your question...";
}

export function minimalUnderstanding(
  text: string,
  previous?: BotLanguage | null,
  hint?: BotLanguage | null,
): BotUnderstanding {
  return {
    intent: "UNKNOWN",
    language: detectLanguage(text, previous, hint),
    location: "",
    category: "",
    jobQuery: "",
    openSearch: false,
    scope: "NONE",
    requiresAuth: false,
    confidence: 0,
    focus: "",
    locationKind: "",
    experienceLevel: "",
    originalExperienceYears: null,
    experienceRangeLabel: "",
    minSalary: null,
    maxSalary: null,
    salaryBasis: "monthly",
    crossRole: "",
    anyLocation: false,
    reuseLocation: false,
    jobOrdinal: null,
  };
}

export function parseUnderstanding(
  raw: string,
  fallbackText: string,
  previous?: BotLanguage | null,
  hint?: BotLanguage | null,
): BotUnderstanding {
  try {
    const json = JSON.parse(raw) as unknown;
    const parsed = understandingSchema.safeParse(json);
    if (!parsed.success) return minimalUnderstanding(fallbackText, previous, hint);
    const category = normalizeRole(
      cleanSlot(parsed.data.jobTitle) || cleanSlot(parsed.data.category) || cleanSlot(parsed.data.jobQuery),
    );
    const location = normalizePlace(cleanSlot(parsed.data.location));
    const intent = parsed.data.isOutOfScope ? "UNRELATED" : parsed.data.intent;
    const openSearch =
      !category && (intent === "JOB_SEARCH" || intent === "JOB_COUNT" || Boolean(parsed.data.openSearch));
    const scope = scopeForIntent(intent);
    const rawConfidence = parsed.data.confidence ?? 0.8;
    const confidence = Math.min(1, Math.max(0, rawConfidence > 1 ? rawConfidence / 100 : rawConfidence));
    const focus = parsed.data.focus === "salary" || parsed.data.focus === "company" ? parsed.data.focus : "";
    return {
      intent,
      language: resolveLanguage(fallbackText, parsed.data.language, previous, hint),
      location,
      category,
      jobQuery: category,
      openSearch,
      scope,
      requiresAuth: scope === "OWN_DATA" || scope === "OWN_EMPLOYER_DATA",
      confidence,
      focus,
    };
  } catch {
    return minimalUnderstanding(fallbackText, previous, hint);
  }
}

/**
 * Prefer this-message signals (script, romanized cues, clear English, ambiguous inherit).
 * Use the AI language only when the text has no clear current-language signal.
 */
export function resolveLanguage(
  text: string,
  aiLanguage: BotLanguage,
  previous?: BotLanguage | null,
  hint?: BotLanguage | null,
): BotLanguage {
  if (hasClearCurrentLanguageSignal(text) || isAmbiguousLanguageSignal(text)) {
    return detectLanguage(text, previous, hint, true);
  }
  if (aiLanguage !== "en") {
    return aiLanguage;
  }
  return detectLanguage(text, previous, hint, true);
}

/** Alias used by callers/tests for the turn-level conversation language policy. */
export function resolveConversationLanguage(
  text: string,
  previous?: BotLanguage | null,
  hint?: BotLanguage | null,
  inheritPrevious = true,
): BotLanguage {
  return detectLanguage(text, previous, hint, inheritPrevious);
}

/** Website page size is 20; WhatsApp fetches one public page then compacts for Sarvam. */
export const PUBLIC_JOB_FETCH_LIMIT = 20;
/** Compact verified jobs sent to Sarvam. Never used as the database match total. */
export const JOBS_FOR_AI_LIMIT = 8;

const JOB_SEARCH_INTENTS = new Set<BotIntent>(["JOB_SEARCH", "JOB_COUNT", "JOB_DETAILS"]);

export function looksLikeOwnPostedJobsQuestion(text: string): boolean {
  const seekerApply = /apply\s*ches|apply\s*chey|applied|అప్లై|చేశా/i.test(text);
  if (seekerApply) return false;
  // Public pricing/FAQ wording ("is job posting free?") is not an own-jobs question.
  if (looksLikeEmployerInformationQuestion(text) || looksLikePricingQuestion(text)) {
    return false;
  }
  return /post\s*chesina|nenu\s+post|i posted|my posted|na posted|posted jobs?|which jobs did i post|\bna jobs\b|నా\s*jobs|\bmy jobs\b|నా posted|పోస్ట్|my\s+job\s+postings?|my\s+vacanc/i.test(
    text,
  );
}

/** Profile / company verification or profile-status questions (not "jobs matching my profile"). */
export function looksLikeProfileStatusQuestion(text: string): boolean {
  const folded = text.toLowerCase().trim();
  if (!folded) return false;
  // Explicit English / romanized verification or status about a profile/account/company.
  if (
    /profile\s+(is\s+)?(status|verify|verified|verification)|is\s+(my\s+)?profile\s+verif|profile\s+is\s+verified|verify\s+ayyindh|verification\s+status|account\s+(status|verif)|company\s+profile|naa\s+profile|naaku\s+profile|i\s+want\s+profile\s+status|my\s+profile\s+status|profile\s+status\s+(ela|elu|enti|undhi|undi)|status\s+(ela|elu|enti)\s+undh/i.test(
      folded,
    )
  ) {
    return true;
  }
  const hasProfile =
    /profile|ప్రొఫైల్|प्रोफाइल|प्रोफ़ाइल|company\s+profile|అకౌంట్|account/i.test(text);
  const hasStatusCue =
    /status|verify|verified|verification|స్టేటస్|స్టేటస్|వెరిఫై|वेरिफ|ayyindh|అయ్యింద|undhi|undi|\bela\b|\belu\b|\benti\b|pending|approved|approval/i.test(
      folded,
    );
  const jobMatchCue =
    /match(ing)?\s+(my\s+)?(profile|resume)|jobs?\s+(for|matching)\s+(my\s+)?profile|suitable\s+jobs|సరిపోయే/i.test(
      folded,
    );
  return hasProfile && hasStatusCue && !jobMatchCue;
}

/** Short status follow-up after an employer posting / profile turn. */
export function looksLikeStatusFollowUp(text: string): boolean {
  return /^(status\??|status\s+kavali|emi status|entandi status|what(?:'s| is)?\s+(the\s+)?status\??|when\s+will\s+it\s+be\s+approved\??|approval\s+timeline\??)$/i.test(
    text.trim(),
  );
}

/** Continue prior job search: "Inka chuinu", "show more", "vere jobs", etc. */
export function looksLikeShowMoreJobs(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return /^(inka\s*chuinu|inka\s+jobs?(?:\s+chupin\w*)?|inka\s+chupin\w*|show\s+more(?:\s+jobs?)?|more\s+jobs?|next(?:\s+jobs?)?|vere\s+jobs?(?:\s+unnaya)?|any\s+other\s+jobs?|inkaa?\s+unnaya|మరిన్ని(?:\s*జాబ్స్)?|ఇంకా\s*(?:జాబ్స్|జాబ్|ఉద్యోగాలు)|और\s+(?:नौकर|जॉब)|வேறு\s+வேலை|இன்னும்\s*வேலை|ಇನ್ನಷ್ಟು\s*ಕೆಲಸ|കൂടുതൽ\s*ജോലി)/i.test(
    trimmed,
  );
}

const NIGHT_SHIFT =
  /night\s*shift|నైట్\s*షిఫ్ట్|नाइट\s*शिफ्ट|நைட்\s*ஷிப்ட்|ನೈಟ್\s*ಶಿಫ್ಟ್|നൈറ്റ്\s*ഷിഫ്റ്റ്/i;

/** User asked for a shift. The public job query has no shift field. */
export function mentionsNightShift(text: string): boolean {
  return NIGHT_SHIFT.test(text);
}

/** Shift is not a public job filter. Keep the saved search instead of inventing a role. */
export function looksLikeShiftConstraint(text: string): boolean {
  if (!mentionsNightShift(text)) return false;
  return !extractPlace(text);
}

export function isFollowUpFragment(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 48) return false;
  if (looksLikeOwnPostedJobsQuestion(text)) return false;
  if (/applications?|applicants|అప్లికేషన్|आवेदन|apply|applied/i.test(text)) return false;
  const role = extractRole(trimmed);
  const place = extractPlace(trimmed);
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  if (role && !place && words <= 4) return true;
  if (place && words <= 6) return true;
  return false;
}

export function looksLikeStalePublicJobReply(
  generated: string,
  situation: string,
  rememberedTitles: string[],
): boolean {
  if (situation === "jobs" || situation === "job_details") return false;
  const folded = generated.toLowerCase();
  if (rememberedTitles.some((title) => title && folded.includes(title.toLowerCase()))) {
    return true;
  }
  return /hyderabad lo \d+\s*jobs|హైదరాబాద్.*ఉద్యోగ/i.test(generated);
}

function isPrivateIntent(intent: BotIntent): boolean {
  return (
    intent === "EMPLOYER_JOBS" ||
    intent === "EMPLOYER_JOB_STATUS" ||
    intent === "EMPLOYER_APPLICATION_COUNT" ||
    intent === "POST_JOB" ||
    intent === "ACCOUNT_STATUS" ||
    intent === "MY_APPLICATIONS" ||
    intent === "APPLICATION_COUNT" ||
    intent === "APPLICATION_STATUS" ||
    intent === "APPLIED_COVERAGE" ||
    intent === "PROFILE_JOBS" ||
    intent === "PROFILE_MATCH" ||
    intent === "MY_SKILLS"
  );
}

export function validateCurrentMessageIntent(
  text: string,
  understanding: BotUnderstanding,
): BotUnderstanding {
  if (looksLikeProfileStatusQuestion(text)) {
    return {
      ...understanding,
      intent: "ACCOUNT_STATUS",
      location: "",
      category: "",
      jobQuery: "",
      openSearch: false,
      scope: "NONE",
      requiresAuth: true,
      confidence: Math.max(understanding.confidence, 0.95),
    };
  }
  if (looksLikeOwnPostedJobsQuestion(text) && /applications?|applicants|enni|ఎన్ని|vachayi|వచ్చాయి|how many/i.test(text)) {
    return {
      ...understanding,
      intent: "EMPLOYER_APPLICATION_COUNT",
      location: "",
      category: "",
      jobQuery: "",
      openSearch: false,
      scope: "OWN_EMPLOYER_DATA",
      requiresAuth: true,
    };
  }
  if (looksLikeOwnPostedJobsQuestion(text)) {
    const resolved: BotIntent = /status|స్టేటస్|స్టేజ్|स्थिति/i.test(text)
      ? "EMPLOYER_JOB_STATUS"
      : "EMPLOYER_JOBS";
    return {
      ...understanding,
      intent: resolved,
      location: "",
      category: "",
      jobQuery: "",
      openSearch: false,
      scope: "OWN_EMPLOYER_DATA",
      requiresAuth: true,
    };
  }
  // Wipe free-title pollution on employer intents (e.g. "Nenu Post Chesina").
  if (
    understanding.intent === "EMPLOYER_JOBS" ||
    understanding.intent === "EMPLOYER_JOB_STATUS" ||
    understanding.intent === "EMPLOYER_APPLICATION_COUNT"
  ) {
    return {
      ...understanding,
      location: "",
      category: "",
      jobQuery: "",
      openSearch: false,
      scope: "OWN_EMPLOYER_DATA",
      requiresAuth: true,
    };
  }
  return understanding;
}

export type PendingSearchContext = {
  location: string;
  category: string;
  openSearch?: boolean;
  intent?: string;
  locationKind?: "city" | "state" | "";
  experienceLevel?: string;
  originalExperienceYears?: number | null;
  experienceRangeLabel?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  salaryBasis?: "monthly" | "annual";
};

export type StoredSearchSession = {
  pendingIntent?: string;
  pendingLocation?: string;
  pendingCategory?: string;
  pendingOpenSearch?: boolean;
  lastLocation?: string;
  lastCategory?: string;
  lastExperience?: string;
  lastExperienceYears?: number | null;
  lastExperienceRange?: string;
  lastMinSalary?: number | null;
  lastMaxSalary?: number | null;
  lastSalaryBasis?: string;
  locationKind?: string;
};

/**
 * While the bot is waiting for a location, do not reuse an older city.
 * A finished search still remembers its last city for a short follow-up.
 */
export function activeSearchContext(session: StoredSearchSession | null | undefined): PendingSearchContext | null {
  if (!session) return null;
  const waitingForLocation =
    Boolean(session.pendingIntent) &&
    !session.pendingLocation &&
    Boolean(session.pendingCategory || session.pendingOpenSearch);
  const locationKind =
    session.locationKind === "state" || session.locationKind === "city" ? session.locationKind : "";
  return {
    location: waitingForLocation ? "" : session.pendingLocation || session.lastLocation || "",
    category: session.pendingCategory || session.lastCategory || "",
    openSearch: Boolean(session.pendingOpenSearch),
    intent: session.pendingIntent || "",
    locationKind: waitingForLocation ? "" : locationKind,
    experienceLevel: session.lastExperience || "",
    originalExperienceYears: session.lastExperienceYears ?? null,
    experienceRangeLabel: session.lastExperienceRange || "",
    minSalary: session.lastMinSalary ?? null,
    maxSalary: session.lastMaxSalary ?? null,
    salaryBasis: session.lastSalaryBasis === "annual" ? "annual" : "monthly",
  };
}

export function mergePending(
  previous: PendingSearchContext | null,
  next: BotUnderstanding,
  text = "",
): BotUnderstanding {
  if (!previous) return next;
  if (isPrivateIntent(next.intent) || next.intent === "GREETING" || next.intent === "HELP" || next.intent === "PLATFORM_KNOWLEDGE" || next.intent === "UNRELATED" || next.intent === "HOW_TO_APPLY" || next.intent === "CLARIFY" || next.intent === "POST_JOB" || next.intent === "ACCOUNT_STATUS") {
    return {
      ...next,
      location: next.location,
      category: next.category,
      jobQuery: next.category,
      openSearch: false,
    };
  }

  const slotUpdate = Boolean(
    next.location ||
      next.category ||
      next.experienceLevel ||
      next.clearExperience ||
      next.minSalary != null ||
      next.anyLocation ||
      next.reuseLocation ||
      looksLikeShiftConstraint(text),
  );
  const previousSearch = Boolean(previous.location || previous.category || previous.intent);

  if (next.intent === "UNKNOWN") {
    const shortUpdate = slotUpdate && previousSearch && text.trim().length <= 80;
    if (!isFollowUpFragment(text) && !shortUpdate) {
      return next;
    }
    const merged = combineSearchSlots(previous, next);
    return {
      ...next,
      ...merged,
      intent: "JOB_SEARCH",
      scope: "PUBLIC_JOBS",
      requiresAuth: false,
    };
  }

  if (!JOB_SEARCH_INTENTS.has(next.intent)) {
    return next;
  }

  const merged = combineSearchSlots(previous, next, text);
  return {
    ...next,
    ...merged,
  };
}

function combineSearchSlots(
  previous: PendingSearchContext,
  next: BotUnderstanding,
  text = "",
): Pick<
  BotUnderstanding,
  | "location"
  | "locationKind"
  | "category"
  | "jobQuery"
  | "openSearch"
  | "experienceLevel"
  | "originalExperienceYears"
  | "experienceRangeLabel"
  | "minSalary"
  | "maxSalary"
  | "salaryBasis"
  | "anyLocation"
> {
  const anyLocation = Boolean(next.anyLocation);
  const reuseLocation = Boolean(next.reuseLocation) && !next.location && !anyLocation;
  const location = anyLocation ? "" : next.location || (reuseLocation ? previous.location : "") || previous.location;
  const locationKind = anyLocation
    ? ""
    : next.location
      ? next.locationKind || placeKind(next.location)
      : previous.locationKind || placeKind(location);
  // "jobs in Chennai" is a broad search; vague "I want jobs" (no new place) keeps a prior role.
  const nextBroughtPlace = Boolean(next.location || next.anyLocation || anyLocation);
  const broadAsk =
    next.openSearch &&
    Boolean(next.location || anyLocation) &&
    !next.category &&
    (!text || mentionsJobWord(text)) &&
    (nextBroughtPlace || !previous.category);
  const keepOpenSearch =
    Boolean(previous.openSearch) &&
    !next.category &&
    Boolean(location || anyLocation) &&
    !previous.category;
  const category = broadAsk || keepOpenSearch ? "" : next.category || previous.category;
  const freshSearch =
    Boolean(text) &&
    !isFollowUpFragment(text) &&
    !next.clearExperience &&
    !looksLikeShiftConstraint(text) &&
    text.trim().length > 24 &&
    Boolean(next.category || next.openSearch) &&
    Boolean(next.location || anyLocation);
  const experienceLevel = next.clearExperience
    ? ""
    : next.experienceLevel
      ? next.experienceLevel
      : freshSearch
        ? ""
        : previous.experienceLevel || "";
  const originalExperienceYears = next.clearExperience
    ? null
    : next.experienceLevel
      ? next.originalExperienceYears ?? null
      : freshSearch
        ? null
        : previous.originalExperienceYears ?? null;
  const experienceRangeLabel = next.clearExperience
    ? ""
    : next.experienceLevel
      ? next.experienceRangeLabel || ""
      : freshSearch
        ? ""
        : previous.experienceRangeLabel || "";
  let minSalary = next.minSalary != null ? next.minSalary : freshSearch ? null : previous.minSalary ?? null;
  let maxSalary = next.minSalary != null ? next.maxSalary ?? null : freshSearch ? null : previous.maxSalary ?? null;
  const salaryBasis = next.minSalary != null
    ? next.salaryBasis || "monthly"
    : freshSearch
      ? "monthly"
      : previous.salaryBasis || "monthly";
  // Relative bump ("salary konchem ekkuva") without a number.
  // "Which one pays more?" compares the shown list and must not raise the minimum.
  if (
    next.minSalary == null &&
    !looksLikeShownSalaryComparison(text) &&
    looksLikeRelativeHigherSalary(text) &&
    (previous.minSalary ?? 0) > 0
  ) {
    minSalary = Math.round(Number(previous.minSalary) + 5000);
    maxSalary = null;
  }
  return {
    location,
    locationKind,
    category,
    jobQuery: category,
    openSearch: next.showMore ? false : (next.openSearch && !category) || keepOpenSearch,
    experienceLevel,
    originalExperienceYears,
    experienceRangeLabel,
    minSalary,
    maxSalary,
    salaryBasis,
    anyLocation,
  };
}

function overlayMessageEntities(text: string, understanding: BotUnderstanding): BotUnderstanding {
  const experience = extractExperienceDetail(text);
  const salary = extractSalaryBand(text);
  const clearExperience = looksLikeClearExperience(text);
  return {
    ...understanding,
    ...(clearExperience
      ? {
          clearExperience: true,
          experienceLevel: "",
          originalExperienceYears: null,
          experienceRangeLabel: "",
        }
      : experience.level
        ? {
            experienceLevel: experience.level,
            originalExperienceYears: experience.years,
            experienceRangeLabel: experience.rangeLabel,
          }
        : {}),
    ...(salary.min != null
      ? { minSalary: salary.min, maxSalary: salary.max, salaryBasis: salary.basis }
      : {}),
    ...(wantsAnyLocation(text) ? { anyLocation: true, location: "" } : {}),
  };
}

export function resolveTurnUnderstanding(
  text: string,
  raw: BotUnderstanding,
  previous: PendingSearchContext | null,
  lastIntent?: string | null,
): BotUnderstanding {
  const validated = validateCurrentMessageIntent(text, overlayMessageEntities(text, raw));
  const withFollowUp = applyConversationFollowUp(text, validated, lastIntent ?? previous?.intent);
  return applyCurrentMessageSearchRules(
    text,
    mergePending(previous, withFollowUp, text),
  );
}

/**
 * Current-message rules beat Sarvam slots and session memory.
 * Broad "any jobs in Hyderabad" must not keep a previous role.
 * An explicit role in this message is a hard filter.
 */
export function applyCurrentMessageSearchRules(
  text: string,
  understanding: BotUnderstanding,
): BotUnderstanding {
  if (understanding.intent !== "JOB_SEARCH" && understanding.intent !== "JOB_COUNT") {
    return understanding;
  }
  if (looksLikeOwnPostedJobsQuestion(text) || isPrivateIntent(understanding.intent)) {
    return understanding;
  }
  // Salary-only / show-more follow-ups must keep prior role + city.
  if (
    understanding.showMore ||
    understanding.focus === "salary" ||
    looksLikeShowMoreJobs(text) ||
    looksLikeSalaryPreferenceUpdate(text) ||
    (understanding.minSalary != null && !extractRole(text) && !extractPlace(text))
  ) {
    return {
      ...understanding,
      openSearch: false,
      category: understanding.category,
      jobQuery: understanding.category,
    };
  }

  const roleInMessage = extractRole(text);
  const locationInMessage = extractPlace(text);
  const mentionsJob = mentionsJobWord(text);
  const mentionsRequest = includesAny(text, REQUEST_WORDS);
  const location = understanding.anyLocation ? "" : locationInMessage || understanding.location;
  const locationKind = understanding.anyLocation
    ? ""
    : locationInMessage
      ? placeKind(locationInMessage)
      : understanding.locationKind || placeKind(location);

  if (roleInMessage) {
    return {
      ...understanding,
      location,
      locationKind,
      category: roleInMessage,
      jobQuery: roleInMessage,
      openSearch: false,
    };
  }

  if (!mentionsJob && mentionsRequest && locationInMessage && understanding.category) {
    return { ...understanding, location, locationKind, openSearch: false };
  }

  if ((mentionsJob || mentionsRequest) && (locationInMessage || understanding.anyLocation)) {
    return {
      ...understanding,
      location,
      locationKind,
      category: "",
      jobQuery: "",
      openSearch: true,
    };
  }

  return understanding;
}

export function selectVerifiedJobsForReply<T extends { jobTitle: string; jobId?: string }>(
  jobs: T[],
  role: string,
  dbTotal: number,
  excludeIds: ReadonlySet<string> = new Set(),
): { total: number; jobs: T[]; hasMore: boolean } {
  const seenIds = new Set<string>();
  const matched: T[] = [];
  for (const job of jobs) {
    if (!matchesRequestedRole(job.jobTitle, role)) continue;
    const id = typeof job.jobId === "string" ? job.jobId.trim() : "";
    if (id) {
      if (seenIds.has(id)) continue;
      seenIds.add(id);
    }
    matched.push(job);
  }
  const fresh = matched.filter((job) => {
    const id = typeof job.jobId === "string" ? job.jobId.trim() : "";
    return !id || !excludeIds.has(id);
  });
  const dropped = jobs.length - matched.length;
  const total = dropped > 0 ? Math.max(0, dbTotal - dropped) : dbTotal;
  const shown = fresh.slice(0, JOBS_FOR_AI_LIMIT);
  return {
    total,
    jobs: shown,
    hasMore: fresh.length > shown.length || total > excludeIds.size + shown.length,
  };
}

export function toPublicJobsLookup(input: {
  category: string;
  location: string;
  openSearch: boolean;
  locationKind?: "city" | "state" | "";
  anyLocation?: boolean;
}): { search: string; city: string } {
  const stateOnly = input.locationKind === "state" || Boolean(input.anyLocation);
  return {
    search: input.openSearch ? "" : input.category,
    city: stateOnly ? "" : input.location,
  };
}

/** Filters the public job API actually supports. State is not sent as a city. */
export function publicJobFilters(input: {
  category: string;
  location: string;
  openSearch: boolean;
  locationKind?: "city" | "state" | "";
  anyLocation?: boolean;
  experienceLevel?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
}): {
  search: string;
  city: string;
  state: string;
  experience: string;
  minSalary?: number;
  maxSalary?: number;
} {
  const base = toPublicJobsLookup(input);
  return {
    ...base,
    state: input.locationKind === "state" && !input.anyLocation ? input.location : "",
    experience: input.experienceLevel || "",
    ...(input.minSalary != null ? { minSalary: input.minSalary } : {}),
    ...(input.maxSalary != null ? { maxSalary: input.maxSalary } : {}),
  };
}

/** Latin spellings of a place, so "Bangalore" also matches jobs stored as "bengaluru". */
export function placeCityAliases(location: string): string[] {
  const trimmed = location.trim();
  if (!trimmed) return [];
  const place = PLACES.find((item) => item.canonical === (extractPlace(trimmed) || trimmed));
  const latin = (place?.forms ?? []).filter((form) => /^[a-z][a-z\s-]*$/i.test(form));
  const catalogCity = currentSearchCatalog().cities.find(
    (city) => city.toLowerCase() === trimmed.toLowerCase(),
  );
  return [...new Set([trimmed, ...(place ? [place.canonical] : []), ...latin, ...(catalogCity ? [catalogCity] : [])])];
}

/** Locality when the place is searched again at a parent city. Cities and states stay distinct. */
export function locationGrain(location: string): "locality" | "city" | "state" | "" {
  if (!location) return "";
  if (placeKind(location) === "state") return "state";
  if (parentCity(location)) return "locality";
  return "city";
}

export function messageLooksLikeJobAsk(text: string): boolean {
  return mentionsJobWord(text) || includesAny(text, REQUEST_WORDS);
}

/** City to retry for a neighbourhood search; never a different city than the one asked for. */
export function parentCity(location: string): string {
  return PLACE_PARENT_CITY[location] ?? "";
}

export function renderJobSearchReply(input: {
  language: BotLanguage;
  location: string;
  jobTitle: string;
  jobs: PublicJobFact[];
  widenedTo?: string;
  total?: number;
  frontendOrigin?: string;
  includeApplyLinks?: boolean;
  accountType?: AccountKind;
  seekerRegisterUrl?: string;
  /** Only filters that were sent to the job search. */
  appliedFilters?: string;
}): string {
  const place = labelPlace(input.location, input.language);
  const role = labelRole(input.jobTitle, input.language);
  const count = input.total ?? input.jobs.length;
  const unknown = input.accountType === "none";
  const registerUrl = input.seekerRegisterUrl ?? "";
  const filterNote =
    input.language === "en" && input.appliedFilters
      ? ` I used ${input.appliedFilters}.`
      : "";

  if (count === 0) {
    const emptyCore =
      input.language === "te"
        ? `ప్రస్తుతం ${place || "ఈ ప్రాంతం"}లో ${input.jobTitle ? role : ""} జాబ్స్ కనిపించలేదు.`.replace(/\s+/g, " ")
        : input.language === "hi"
          ? `अभी ${place || "इस जगह"} में ${role || "नौकरी"} नहीं मिली.`
          : input.language === "ta" || input.language === "kn" || input.language === "ml"
            ? regionalLead(input.language, "empty", place, role, "")
            : `Sorry, I could not find ${role || "jobs"}${place ? ` in ${place}` : ""} right now.${filterNote}`;
    if (unknown) {
      return `${emptyCore}\n\n${unknownApplyFooter(input.language, registerUrl, "after_empty")}`;
    }
    if (input.language === "te") {
      return `${emptyCore} వేరే ప్రాంతం లేదా వేరే జాబ్ కావాలంటే చెప్పండి.`;
    }
    if (input.language === "hi") {
      return `${emptyCore} किसी दूसरी जगह या दूसरी नौकरी के लिए बताइए.`;
    }
    if (input.language === "en") {
      return `${emptyCore} Tell me another location or job type to search.`;
    }
    return emptyCore;
  }

  const lines = input.jobs.slice(0, JOBS_FOR_AI_LIMIT).map((job, index) => {
    const where = labelPlace(job.cityName, input.language) || job.cityName || job.stateName;
    const salary = job.salaryLabel ? `\n💰 ${job.salaryLabel}` : "";
    const company = job.companyName ? ` — ${job.companyName}` : "";
    const title = localizeJobTitle(job.jobTitle, input.language);
    const applyUrl =
      input.includeApplyLinks === false
        ? ""
        : buildPublicJobApplyUrl(
            job.jobId,
            input.frontendOrigin ?? "",
            input.language,
          );
    const apply = applyUrl ? `\n👉 Apply Now: ${applyUrl}` : "";
    return `${index + 1}. ${title}${company}${where ? `\n📍 ${where}` : ""}${salary}${apply}`;
  });
  const withFooter = (body: string) =>
    unknown ? `${body}\n\n${unknownApplyFooter(input.language, registerUrl, "after_jobs")}` : body;

  if (input.language === "te") {
    const lead = input.widenedTo
      ? `${place}లో ${role} జాబ్స్ కనిపించలేదు. ${labelPlace(input.widenedTo, "te")}లో ఇవి ఉన్నాయి:`
      : `అవును 👍 ${place ? `${place}లో ` : ""}${count} ${role} ఉద్యోగాలు దొరికాయి.`;
    return withFooter(`${lead}\n\n${lines.join("\n\n")}`);
  }
  if (input.language === "hi") {
    const lead = input.widenedTo
      ? `${place} में ${role} की नौकरी नहीं मिली। ${labelPlace(input.widenedTo, "hi")} में ये मिलीं:`
      : `${place ? `${place} में ` : ""}${count} ${role} की नौकरियां मिली हैं.`;
    const more =
      count > input.jobs.length
        ? `\n\nकुल ${count} नौकरियां हैं. पहली ${input.jobs.length} दिखा रहे हैं.`
        : "";
    return withFooter(`${lead}\n\n${lines.join("\n\n")}${more}`);
  }
  if (input.language === "ta" || input.language === "kn" || input.language === "ml") {
    const lead = input.widenedTo
      ? regionalLead(input.language, "widen", place, role, labelPlace(input.widenedTo, input.language))
      : regionalLead(input.language, "found", place, role, String(count));
    return withFooter(`${lead}\n\n${lines.join("\n\n")}`);
  }
  const lead = input.widenedTo
    ? `No ${role || "jobs"} in ${place}. These are in ${input.widenedTo}:${filterNote}`
    : `I found ${count} active ${role || "job"} listing${count === 1 ? "" : "s"}${place ? ` in ${place}` : ""}.${filterNote}`;
  const more =
    count > input.jobs.length
      ? `\n\nThere are ${count} matching jobs. Showing the first ${input.jobs.length}.`
      : "";
  return withFooter(`${lead}\n\n${lines.join("\n\n")}${more}`);
}

export function jobSearchNoMatchCopy(input: {
  language: BotLanguage;
  location: string;
  role: string;
  minSalary: number | null;
  lowerSalaryCount: number;
  undisclosedCount: number;
  nearbyCity: string;
  showMore?: boolean;
}): string {
  const place = input.location.trim() || "your area";
  const role = input.role.trim() || "jobs";
  const salary =
    input.minSalary != null ? `₹${input.minSalary.toLocaleString("en-IN")}/month` : "";
  if (input.language === "te") {
    const lead = salary
      ? `Sorry, ${place} lo ${salary} preference ki match ayye ${role} jobs ippudu dorakaledhu.`
      : `Sorry, ${place} lo match ayye ${role} jobs ippudu dorakaledhu.`;
    const options = [
      input.lowerSalaryCount > 0
        ? `1. ${place} lo konchem takkuva salary unna ${role} jobs chudali.`
        : "",
      input.nearbyCity
        ? `2. ${input.nearbyCity} lanti daggarlo locations lo search cheyyali (meeru okay ante).`
        : "",
      input.undisclosedCount > 0
        ? `3. Salary mention cheyyani ${role} jobs chudali.`
        : "",
      "4. Ee requirements alage unchi tarvatha malli check cheyyali.",
    ].filter(Boolean);
    return `${lead}\n\nMeeru em cheyyalanukuntunnaru?\n\n${options.join("\n")}`;
  }
  if (input.language === "hi") {
    const lead = salary
      ? `माफ़ करें, ${place} में ${salary} के अनुसार कोई ${role} जॉब अभी नहीं मिली.`
      : `माफ़ करें, ${place} में कोई ${role} जॉब अभी नहीं मिली.`;
    return `${lead}\n\nक्या आप चाहेंगे?\n1. कम सैलरी वाली ${role} जॉब्स\n2. पास के शहर में खोजें\n3. सैलरी न बताई गई जॉब्स\n4. बाद में फिर जाँचें`;
  }
  if (input.language === "ta") {
    const lead = salary
      ? `மன்னிக்கவும், ${place}-ல் ${salary} சம்பளத்துக்கு ஏற்ற ${role} வேலை இப்போது இல்லை.`
      : `மன்னிக்கவும், ${place}-ல் ${role} வேலை இப்போது இல்லை.`;
    return `${lead}\n\nஎன்ன செய்யலாம்?\n1. குறைந்த சம்பள ${role} வேலைகள்\n2. அருகிலுள்ள நகரத்தில் தேடலாம்\n3. சம்பளம் குறிப்பிடாத வேலைகள்\n4. பிறகு மீண்டும் பார்க்கலாம்`;
  }
  if (input.language === "kn") {
    const lead = salary
      ? `ಕ್ಷಮಿಸಿ, ${place} ನಲ್ಲಿ ${salary} ಸಂಬಳಕ್ಕೆ ಹೊಂದುವ ${role} ಕೆಲಸ ಈಗ ಸಿಗಲಿಲ್ಲ.`
      : `ಕ್ಷಮಿಸಿ, ${place} ನಲ್ಲಿ ${role} ಕೆಲಸ ಈಗ ಸಿಗಲಿಲ್ಲ.`;
    return `${lead}\n\nಏನು ಮಾಡೋಣ?\n1. ಕಡಿಮೆ ಸಂಬಳದ ${role} ಕೆಲಸಗಳು\n2. ಹತ್ತಿರದ ನಗರದಲ್ಲಿ ಹುಡುಕಿ\n3. ಸಂಬಳ ಹೇಳದ ಕೆಲಸಗಳು\n4. ನಂತರ ಮತ್ತೆ ನೋಡಿ`;
  }
  if (input.language === "ml") {
    const lead = salary
      ? `ക്ഷമിക്കണം, ${place}-ൽ ${salary} ശമ്പളത്തിന് ചേരുന്ന ${role} ജോലി ഇപ്പോൾ ഇല്ല.`
      : `ക്ഷമിക്കണം, ${place}-ൽ ${role} ജോലി ഇപ്പോൾ ഇല്ല.`;
    return `${lead}\n\nഎന്ത് ചെയ്യാം?\n1. കുറഞ്ഞ ശമ്പളമുള്ള ${role} ജോലികൾ\n2. അടുത്ത നഗരത്തിൽ തിരയാം\n3. ശമ്പളം പറയാത്ത ജോലികൾ\n4. പിന്നീട് വീണ്ടും നോക്കാം`;
  }
  const lead = salary
    ? `Sorry, I couldn't find any ${role} jobs in ${place} matching your ${salary} salary preference right now.`
    : `Sorry, I couldn't find any ${role} jobs in ${place} right now.`;
  const options = [
    input.lowerSalaryCount > 0
      ? `1. See ${role} jobs in ${place} with a lower salary.`
      : "",
    input.nearbyCity
      ? `2. Search similar jobs near ${input.nearbyCity} (only if you allow).`
      : "",
    input.undisclosedCount > 0
      ? `3. View ${role} jobs where salary is not specified.`
      : "",
    "4. Keep your current preferences and check again later.",
  ].filter(Boolean);
  return `${lead}\n\nWould you like to:\n${options.join("\n")}`;
}

export function jobSearchNoMoreCopy(input: {
  language: BotLanguage;
  location: string;
  role: string;
  minSalary: number | null;
}): string {
  const place = input.location.trim();
  const role = input.role.trim() || "jobs";
  const salary =
    input.minSalary != null ? ` (₹${input.minSalary.toLocaleString("en-IN")}+)` : "";
  if (input.language === "te") {
    return `Ippudu inkoti ${role} job${place ? ` ${place} lo` : ""}${salary} dorakaledhu. Salary relax cheyyali aa, location marchali aa, leda tarvatha malli try cheyyali aa?`;
  }
  if (input.language === "hi") {
    return `अब और ${role} जॉब${place ? ` ${place} में` : ""}${salary} नहीं मिली. सैलरी कम करें, जगह बदलें, या बाद में फिर देखें?`;
  }
  if (input.language === "ta") {
    return `இப்போது மேலும் ${role} வேலை${place ? ` ${place}-ல்` : ""}${salary} இல்லை. சம்பளத்தை குறைக்கலாம், இடம் மாற்றலாம், அல்லது பிறகு பார்க்கலாம்.`;
  }
  if (input.language === "kn") {
    return `ಈಗ ಇನ್ನಷ್ಟು ${role} ಕೆಲಸ${place ? ` ${place} ನಲ್ಲಿ` : ""}${salary} ಇಲ್ಲ. ಸಂಬಳ ಕಡಿಮೆ ಮಾಡಿ, ಸ್ಥಳ ಬದಲಿಸಿ, ಅಥವಾ ನಂತರ ನೋಡಿ.`;
  }
  if (input.language === "ml") {
    return `ഇപ്പോൾ കൂടുതൽ ${role} ജോലി${place ? ` ${place}-ൽ` : ""}${salary} ഇല്ല. ശമ്പളം കുറയ്ക്കാം, സ്ഥലം മാറ്റാം, അല്ലെങ്കിൽ പിന്നീട് നോക്കാം.`;
  }
  return `I don't have more ${role} listings${place ? ` in ${place}` : ""}${salary} to show right now. You can relax the salary, change location, or check again later.`;
}

export function clarifyJobTitle(language: BotLanguage): string {
  if (language === "te") {
    return "మీకు ఏ జాబ్ కావాలో చెప్పండి. ఉదాహరణకు: 'మాధాపూర్‌లో డ్రైవర్ జాబ్ కావాలి'.";
  }
  if (language === "hi") {
    return "आपको कौन सी नौकरी चाहिए बताइए। उदाहरण: 'माधापुर में ड्राइवर की नौकरी चाहिए'.";
  }
  if (language === "ta") return "எந்த வேலை வேண்டும் என்று சொல்லுங்கள். உதாரணம்: 'ஹைதராபாத் டிரைவர் வேலை'.";
  if (language === "kn") return "ಯಾವ ಕೆಲಸ ಬೇಕು ಹೇಳಿ. ಉದಾಹರಣೆ: 'ಹೈದರಾಬಾದ್ ಡ್ರೈವರ್ ಕೆಲಸ'.";
  if (language === "ml") return "ഏത് ജോലി വേണം എന്ന് പറയൂ. ഉദാഹരണം: 'ഹൈദരാബാദ് ഡ്രൈവർ ജോലി'.";
  return "Tell me what kind of job you're looking for. For example: 'driver jobs in Madhapur'.";
}

/** User picked a number that is not in the last shown WhatsApp job list. */
export function clarifyWhichShownJobCopy(language: BotLanguage): string {
  if (language === "te") {
    return "ఏ జాబ్ కావాలో number చెప్పండి — ఉదా: apply for 1 లేదా apply for 5. ముందు jobs list చూపించాను అవి మాత్రమే select చేయండి.";
  }
  if (language === "hi") {
    return "कौन सी नौकरी चाहिए, नंबर बताइए — जैसे: apply for 1 या apply for 5. केवल वो नंबर चुनें जो मैंने अभी दिखाए हैं.";
  }
  if (language === "ta") {
    return "எந்த வேலை வேண்டும் என்ற எண்ணைச் சொல்லுங்கள் — எ.கா: apply for 1 அல்லது apply for 5. நான் காட்டிய பட்டியலில் உள்ள எண்கள் மட்டும்.";
  }
  if (language === "kn") {
    return "ಯಾವ ಕೆಲಸ ಬೇಕು ಎಂಬ ಸಂಖ್ಯೆ ಹೇಳಿ — ಉದಾ: apply for 1 ಅಥವಾ apply for 5. ನಾನು ತೋರಿಸಿದ ಪಟ್ಟಿಯ ಸಂಖ್ಯೆಗಳನ್ನು ಮಾತ್ರ ಆಯ್ಕೆ ಮಾಡಿ.";
  }
  if (language === "ml") {
    return "ഏത് ജോലി വേണമെന്ന നമ്പർ പറയൂ — ഉദാ: apply for 1 അല്ലെങ്കിൽ apply for 5. ഞാൻ കാണിച്ച ലിസ്റ്റിലെ നമ്പറുകൾ മാത്രം തിരഞ്ഞെടുക്കൂ.";
  }
  return "Tell me which job number you want — for example: apply for 1 or apply for 5. Please choose a number from the jobs I just showed.";
}

const CLARIFY_LOOP_LIMIT = 3;

/** Track repeated clarify asks for the same missing field (location/role). */
export function nextClarifyLoopState(input: {
  situation: string;
  missing: string;
  priorMissing?: string;
  priorAttempts?: number;
}): { attempts: number; missing: string; exhausted: boolean } {
  if (input.situation !== "clarify") {
    return { attempts: 0, missing: "", exhausted: false };
  }
  const field = input.missing.trim();
  if (field !== "location" && field !== "role") {
    return { attempts: 0, missing: "", exhausted: false };
  }
  const same = input.priorMissing === field;
  const attempts = same ? (input.priorAttempts ?? 0) + 1 : 1;
  return {
    attempts: attempts >= CLARIFY_LOOP_LIMIT ? 0 : attempts,
    missing: attempts >= CLARIFY_LOOP_LIMIT ? "" : field,
    exhausted: attempts >= CLARIFY_LOOP_LIMIT,
  };
}

/** Bound clarification loops: summarize known filters and ask once for the gap. */
export function clarifyExhaustedCopy(
  language: BotLanguage,
  known: { missing: string; role: string; location: string; minSalary: number | null },
): string {
  const role = known.role || (language === "te" ? "ఏదైనా రోల్" : "any role");
  const location = known.location || (language === "te" ? "ఏదైనా లొకేషన్" : "any location");
  const salary =
    known.minSalary != null && known.minSalary > 0
      ? language === "te"
        ? `₹${known.minSalary.toLocaleString("en-IN")}+ జీతం`
        : `₹${known.minSalary.toLocaleString("en-IN")}+ salary`
      : "";
  if (language === "te") {
    if (known.missing === "location") {
      return `మీకు ${role} జాబ్ కావాలని అర్థమైంది${salary ? ` (${salary})` : ""}. దయచేసి ఒక్కసారి లొకేషన్ చెప్పండి — ఉదా: Hyderabad. లేదా "anywhere" అని చెప్పండి.`;
    }
    if (known.missing === "role") {
      return `లొకేషన్: ${location}${salary ? `, ${salary}` : ""}. ఏ రకం జాబ్ కావాలో ఒక్కసారి చెప్పండి — ఉదా: Electrician / Driver. లేదా "any job" అని చెప్పండి.`;
    }
    return `ఇంకా కొంత సమాచారం కావాలి (${known.missing || "details"}). రోల్ + లొకేషన్ ఒకే మెసేజ్‌లో చెప్పండి — ఉదా: "Hyderabad lo electrician job".`;
  }
  if (known.missing === "location") {
    return `I have ${role}${salary ? ` (${salary})` : ""} — please send a location once (e.g. Hyderabad), or say "anywhere".`;
  }
  if (known.missing === "role") {
    return `Location: ${location}${salary ? `, ${salary}` : ""}. Please send the job type once (e.g. Electrician / Driver), or say "any job".`;
  }
  return `I still need a bit more detail (${known.missing || "role/location"}). Send role + location together — e.g. "electrician jobs in Hyderabad".`;
}

export function askLocationCopy(language: BotLanguage): string {
  if (language === "te") {
    return "సరే 👍 మీరు ఏ ప్రాంతంలో జాబ్ కావాలి? ఉదాహరణ: Hyderabad, Chennai, Bangalore.";
  }
  if (language === "hi") {
    return "ज़रूर 👍 किस जगह नौकरी चाहिए? उदाहरण: Hyderabad, Chennai, Bangalore.";
  }
  if (language === "ta") {
    return "சரி 👍 எந்த ஊரில் வேலை வேண்டும்? உதாரணம்: Hyderabad, Chennai, Bangalore.";
  }
  if (language === "kn") {
    return "ಸರಿ 👍 ಯಾವ ಊರಲ್ಲಿ ಕೆಲಸ ಬೇಕು? ಉದಾಹರಣೆ: Hyderabad, Chennai, Bangalore.";
  }
  if (language === "ml") {
    return "ശരി 👍 ഏത് സ്ഥലത്ത് ജോലി വേണം? ഉദാഹരണം: Hyderabad, Chennai, Bangalore.";
  }
  return "Sure 👍 Which location are you looking for?\nExample: Hyderabad, Chennai, Bangalore.";
}

export function howToApplyCopy(
  language: BotLanguage,
  account: AccountKind = "seeker",
  registerUrl = "",
): string {
  if (account === "none" && registerUrl) {
    return unknownApplyFooter(language, registerUrl, "apply_only");
  }
  if (language === "te") {
    return "Apply చేయడానికి AsliJobs లో login అయి job open చేసి Apply నొక్కండి.";
  }
  if (language === "hi") {
    return "आवेदन करने के लिए AsliJobs पर लॉग इन करें, नौकरी खोलें, और Apply दबाएं.";
  }
  if (language === "ta") {
    return "விண்ணப்பிக்க AsliJobs-ல் login செய்து வேலையைத் திறந்து Apply அழுத்தவும்.";
  }
  if (language === "kn") {
    return "ಅರ್ಜಿ ಸಲ್ಲಿಸಲು AsliJobs ನಲ್ಲಿ login ಮಾಡಿ, ಉದ್ಯೋಗ ತೆರೆಯಿರಿ, Apply ಒತ್ತಿರಿ.";
  }
  if (language === "ml") {
    return "അപേക്ഷിക്കാൻ AsliJobs-ൽ login ചെയ്ത് ജോലി തുറന്ന് Apply അമർത്തൂ.";
  }
  return "To apply, log in to AsliJobs, open the job, and tap Apply.";
}

export function aboutAsliJobsCopy(language: BotLanguage): string {
  if (language === "te") {
    return "AsliJobs ఒక WhatsApp-first జాబ్ ప్లాట్‌ఫామ్. మీరు ఇక్కడ ఉద్యోగాలు వెతకవచ్చు, apply చేయవచ్చు, లేదా employer గా జాబ్ పోస్ట్ చేయవచ్చు. Role + city చెప్పండి — ఉదా: Hyderabad lo driver jobs.";
  }
  if (language === "hi") {
    return "AsliJobs एक WhatsApp-first जॉब प्लेटफ़ॉर्म है. यहाँ नौकरियां खोजें, आवेदन करें, या employer के रूप में जॉब पोस्ट करें. भूमिका और शहर बताएं — जैसे: Hyderabad me driver jobs.";
  }
  if (language === "ta") {
    return "AsliJobs ஒரு WhatsApp-first வேலை தளம். வேலை தேடலாம், விண்ணப்பிக்கலாம் அல்லது employer ஆக வேலை போஸ்ட் செய்யலாம். பங்கு + ஊர் சொல்லுங்கள் — எ.கா: Hyderabad la driver jobs.";
  }
  if (language === "kn") {
    return "AsliJobs ಒಂದು WhatsApp-first ಉದ್ಯೋಗ ವೇದಿಕೆ. ಉದ್ಯೋಗ ಹುಡುಕಿ, ಅರ್ಜಿ ಸಲ್ಲಿಸಿ, ಅಥವಾ employer ಆಗಿ ಜಾಬ್ ಪೋಸ್ಟ್ ಮಾಡಿ. ಪಾತ್ರ + ಊರು ಹೇಳಿ — ಉದಾ: Hyderabad alli driver jobs.";
  }
  if (language === "ml") {
    return "AsliJobs ഒരു WhatsApp-first ജോലി പ്ലാറ്റ്‌ഫോമാണ്. ജോലി തിരയാം, അപേക്ഷിക്കാം, അല്ലെങ്കിൽ employer ആയി ജോലി പോസ്റ്റ് ചെയ്യാം. റോൾ + സ്ഥലം പറയൂ — ഉദാ: Hyderabadil driver jobs.";
  }
  return "AsliJobs is a WhatsApp-first job platform. You can search jobs, apply, or post a job as an employer. Tell me a role and city — for example: driver jobs in Hyderabad.";
}

export function howToFindJobsCopy(language: BotLanguage): string {
  if (language === "te") {
    return "ఉద్యోగాలు కావాలంటే role + city చెప్పండి. ఉదా: Hyderabad lo driver jobs, లేదా fresher electrician jobs in Chennai.";
  }
  if (language === "hi") {
    return "नौकरी खोजने के लिए भूमिका और शहर बताएं. जैसे: Hyderabad me driver jobs, या Chennai me fresher electrician jobs.";
  }
  if (language === "ta") {
    return "வேலை தேட பங்கு + ஊர் சொல்லுங்கள். எ.கா: Hyderabad la driver jobs.";
  }
  if (language === "kn") {
    return "ಉದ್ಯೋಗ ಹುಡುಕಲು ಪಾತ್ರ + ಊರು ಹೇಳಿ. ಉದಾ: Hyderabad alli driver jobs.";
  }
  if (language === "ml") {
    return "ജോലി തിരയാൻ റോൾ + സ്ഥലം പറയൂ. ഉദാ: Hyderabadil driver jobs.";
  }
  return "To find jobs, tell me a role and city. Example: driver jobs in Hyderabad, or fresher electrician jobs in Chennai.";
}

export function howToRegisterCopy(
  language: BotLanguage,
  seekerUrl = "",
  employerUrl = "",
): string {
  const seeker = seekerUrl.trim();
  const employer = employerUrl.trim();
  if (language === "te") {
    return `Job Seeker లేదా Employer account AsliJobs website లో create చేయండి.${seeker ? `\n👉 Job Seeker: ${seeker}` : ""}${employer ? `\n👉 Employer: ${employer}` : ""}\n\nRegister అయిన తర్వాత ఇదే WhatsApp number తో message చేయండి.`;
  }
  if (language === "hi") {
    return `Job Seeker या Employer खाता AsliJobs वेबसाइट पर बनाएं.${seeker ? `\n👉 Job Seeker: ${seeker}` : ""}${employer ? `\n👉 Employer: ${employer}` : ""}\n\nरजिस्टर के बाद उसी WhatsApp नंबर से मैसेज करें.`;
  }
  if (language === "ta") {
    return `Job Seeker அல்லது Employer கணக்கை AsliJobs இணையதளத்தில் உருவாக்குங்கள்.${seeker ? `\n👉 Job Seeker: ${seeker}` : ""}${employer ? `\n👉 Employer: ${employer}` : ""}`;
  }
  if (language === "kn") {
    return `Job Seeker ಅಥವಾ Employer ಖಾತೆಯನ್ನು AsliJobs ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ.${seeker ? `\n👉 Job Seeker: ${seeker}` : ""}${employer ? `\n👉 Employer: ${employer}` : ""}`;
  }
  if (language === "ml") {
    return `Job Seeker അല്ലെങ്കിൽ Employer അക്കൗണ്ട് AsliJobs വെബ്സൈറ്റിൽ ഉണ്ടാക്കൂ.${seeker ? `\n👉 Job Seeker: ${seeker}` : ""}${employer ? `\n👉 Employer: ${employer}` : ""}`;
  }
  return `Create a Job Seeker or Employer account on the AsliJobs website.${seeker ? `\n👉 Job Seeker: ${seeker}` : ""}${employer ? `\n👉 Employer: ${employer}` : ""}\n\nAfter registering, message us again from the same WhatsApp number.`;
}

export function contactEmployerGuideCopy(language: BotLanguage): string {
  if (language === "te") {
    return "Employer phone number నేను ఇక్కడ invent చేయను. Apply చేసిన తర్వాత AsliJobs ద్వారా employer contact / next steps చూపిస్తాం. ముందు job కనుక్కుని Apply చేయండి.";
  }
  if (language === "hi") {
    return "मैं employer का फ़ोन नंबर यहाँ नहीं बना सकता. आवेदन के बाद AsliJobs के ज़रिए संपर्क / अगले कदम दिखते हैं. पहले नौकरी खोजकर Apply करें.";
  }
  if (language === "ta") {
    return "Employer தொலைபேசி எண்ணை இங்கே உருவாக்க மாட்டேன். Apply செய்த பிறகு AsliJobs வழியாக அடுத்த படிகள் தெரியும். முதலில் வேலை தேடி Apply செய்யுங்கள்.";
  }
  if (language === "kn") {
    return "Employer ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ಇಲ್ಲಿ ರಚಿಸುವುದಿಲ್ಲ. Apply ಮಾಡಿದ ನಂತರ AsliJobs ಮೂಲಕ ಮುಂದಿನ ಹಂತಗಳು ಕಾಣಿಸುತ್ತವೆ. ಮೊದಲು ಉದ್ಯೋಗ ಹುಡುಕಿ Apply ಮಾಡಿ.";
  }
  if (language === "ml") {
    return "Employer ഫോൺ നമ്പർ ഇവിടെ ഉണ്ടാക്കില്ല. Apply ചെയ്ത ശേഷം AsliJobs വഴി അടുത്ത ഘട്ടങ്ങൾ കാണാം. ആദ്യം ജോലി കണ്ടെത്തി Apply ചെയ്യൂ.";
  }
  return "I cannot invent an employer phone number here. After you apply, AsliJobs shows the next contact steps for that job. First search a job and tap Apply.";
}

export function unknownApplyFooter(
  language: BotLanguage,
  url: string,
  mode: "after_jobs" | "after_empty" | "apply_only" = "after_jobs",
): string {
  const link = url.trim();
  if (language === "te") {
    if (mode === "after_empty") {
      return `మీరు:\n1. వేరే role try చేయవచ్చు\n2. వేరే location try చేయవచ్చు\n3. Job Seeker account create చేసుకుని latest jobs search చేయవచ్చు${link ? `\n\n👉 Job Seeker account:\n${link}` : ""}`;
    }
    if (mode === "apply_only") {
      return `ఈ jobs కి apply చేయాలంటే ముందుగా Job Seeker account create చేసుకోండి.${link ? `\n\n👉 ${link}` : ""}`;
    }
    return `ఈ jobs కి apply చేయాలంటే ముందుగా Job Seeker account create చేసుకోండి:${link ? `\n👉 ${link}` : ""}\n\nRegistration complete చేసాక WhatsApp లో మళ్లీ message చేయండి.`;
  }
  if (language === "hi") {
    if (mode === "after_empty") {
      return `आप:\n1. कोई और role देख सकते हैं\n2. कोई और जगह देख सकते हैं\n3. Job Seeker खाता बनाकर नई नौकरियां खोज सकते हैं${link ? `\n\n👉 Job Seeker account:\n${link}` : ""}`;
    }
    if (mode === "apply_only") {
      return `आवेदन के लिए पहले Job Seeker खाता बनाएं.${link ? `\n\n👉 ${link}` : ""}`;
    }
    return `इन नौकरियों पर आवेदन करने के लिए Job Seeker खाता बनाएं:${link ? `\n👉 ${link}` : ""}`;
  }
  if (language === "ta") {
    return mode === "after_empty"
      ? `வேறு வேலை அல்லது ஊரை முயற்சிக்கலாம்.${link ? `\n👉 ${link}` : ""}`
      : `விண்ணப்பிக்க Job Seeker கணக்கு உருவாக்குங்கள்.${link ? `\n👉 ${link}` : ""}`;
  }
  if (language === "kn") {
    return mode === "after_empty"
      ? `ಬೇರೆ ಕೆಲಸ ಅಥವಾ ಊರು ಪ್ರಯತ್ನಿಸಿ.${link ? `\n👉 ${link}` : ""}`
      : `ಅರ್ಜಿ ಸಲ್ಲಿಸಲು Job Seeker ಖಾತೆ ತೆರೆಯಿರಿ.${link ? `\n👉 ${link}` : ""}`;
  }
  if (language === "ml") {
    return mode === "after_empty"
      ? `മറ്റൊരു ജോലി അല്ലെങ്കിൽ സ്ഥലം ശ്രമിക്കാം.${link ? `\n👉 ${link}` : ""}`
      : `അപേക്ഷിക്കാൻ Job Seeker അക്കൗണ്ട് ഉണ്ടാക്കൂ.${link ? `\n👉 ${link}` : ""}`;
  }
  if (mode === "after_empty") {
    return `You can:\n1. Try another role\n2. Try another location\n3. Create a Job Seeker account to search the latest jobs${link ? `\n\n👉 Job Seeker registration:\n${link}` : ""}`;
  }
  if (mode === "apply_only") {
    return `To apply, please create a Job Seeker account first.${link ? `\n\n👉 ${link}` : ""}`;
  }
  return `To apply for these jobs, please create a Job Seeker account:${link ? `\n👉 ${link}` : ""}\n\nAfter registration, message us again on WhatsApp.`;
}

export function profileCopy(input: {
  language: BotLanguage;
  name: string;
  role: string;
  skills: string[];
}): string {
  const name = input.name.trim();
  const role = input.role.trim() || "-";
  const skills = input.skills.filter(Boolean).join(", ");
  if (input.language === "te") {
    return `${name ? `${name}: ` : ""}మీ role ${role}${skills ? `. Skills: ${skills}` : ""}.`;
  }
  if (input.language === "hi") {
    return `${name ? `${name}: ` : ""}आपकी role ${role}${skills ? `. Skills: ${skills}` : ""}.`;
  }
  return `${name ? `${name}: ` : ""}Your role is ${role}${skills ? `. Skills: ${skills}` : ""}.`;
}

export function disambiguationCopy(language: BotLanguage, missing: string, options: unknown): string {
  const names = Array.isArray(options)
    ? options.map((item) => String(item).trim()).filter(Boolean).slice(0, 3)
    : [];
  const list = names.join(" or ");
  const city = missing === "which_city";
  if (language === "te") {
    return city
      ? `ఏ నగరం? ${list || "ఒక నగరం పేరు చెప్పండి."}`
      : `ఏ రోల్? ${list || "ఒక రోల్ చెప్పండి."}`;
  }
  if (language === "hi") {
    return city
      ? `कौन सा शहर? ${list || "शहर का नाम भेजें."}`
      : `कौन सी भूमिका? ${list || "भूमिका भेजें."}`;
  }
  return city
    ? `Which city did you mean? ${list || "Send the city name."}`
    : `Which role did you mean? ${list || "Send the role name."}`;
}

export function unsupportedShiftFilterCopy(language: BotLanguage): string {
  if (language === "te") {
    return "Night shift ippudu search filter kadu. Nenu mee role + city tho jobs chupisthunnanu.";
  }
  if (language === "hi") {
    return "नाइट शिफ्ट अभी सर्च फ़िल्टर नहीं है. मैं आपकी भूमिका और शहर वाली नौकरियां दिखा रहा हूँ.";
  }
  return "Night shift is not a search filter yet. I'll keep your role and city and show those jobs.";
}

export function clarifyCompetingIntentCopy(language: BotLanguage): string {
  if (language === "te") {
    return "Meeru rendu vishayalu adigaru: job search, and application status. Okati mundu cheppandi — jobs, leda status.";
  }
  if (language === "hi") {
    return "आपने दो बातें पूछी हैं: जॉब सर्च और आवेदन स्टेटस. पहले क्या करूँ — jobs, या status?";
  }
  return "You asked about two things: job search and application status. Which should I do first — jobs, or status?";
}

export function clarifyNoMatchChoiceCopy(language: BotLanguage): string {
  if (language === "te") {
    return "Number tho cheppandi: 1 takkuva salary, 2 daggarlo location, 3 salary ledu, 4 tarvatha.";
  }
  if (language === "hi") {
    return "नंबर बताइए: 1 कम सैलरी, 2 पास का शहर, 3 बिना सैलरी, 4 बाद में.";
  }
  return "Reply with a number: 1 lower salary, 2 a nearby city, 3 jobs with no salary listed, 4 check again later.";
}

export function rateLimitCopy(language: BotLanguage): string {
  if (language === "te") {
    return "Konchem aagu. Nenu oka nimisham lo 20 messages varaku reply istha. Tarvatha malli adagandi.";
  }
  if (language === "hi") {
    return "एक मिनट रुकिए. मैं एक मिनट में 20 संदेशों तक जवाब देता हूँ. फिर पूछिए.";
  }
  return "Please wait a moment. I can reply to 20 messages a minute, then I'll continue.";
}

function withUnsupportedFilterNote(
  language: BotLanguage,
  facts: Record<string, unknown>,
  body: string,
): string {
  if (facts.unsupportedFilter !== "shift") return body;
  return `${unsupportedShiftFilterCopy(language)}\n\n${body}`;
}

export function buildDeterministicReply(
  language: BotLanguage,
  facts: Record<string, unknown>,
): string | null {
  const situation = String(facts.situation ?? "");
  if (situation === "greeting") {
    return greetingCopy({
      language,
      account: (facts.accountType as AccountKind) || "none",
      name: String(facts.name ?? ""),
    });
  }
  if (situation === "platform_knowledge") {
    const answer = String(facts.answer ?? "").trim();
    if (answer) return answer;
    return null;
  }
  if (situation === "help" || situation === "out_of_scope") {
    const account = (facts.accountType as AccountKind) || "seeker";
    const focus = String(facts.focus ?? "");
    if (situation === "help" && focus === "about") return aboutAsliJobsCopy(language);
    if (situation === "help" && focus === "find_jobs") return howToFindJobsCopy(language);
    if (situation === "help" && focus === "contact_employer") {
      return contactEmployerGuideCopy(language);
    }
    if (situation === "help" && focus === "register") {
      const registration =
        facts.registration && typeof facts.registration === "object"
          ? (facts.registration as { seekerRegisterUrl?: string; employerRegisterUrl?: string })
          : {};
      return howToRegisterCopy(
        language,
        registration.seekerRegisterUrl || "",
        registration.employerRegisterUrl || "",
      );
    }
    return capabilityCopy(language, account);
  }
  if (situation === "how_to_apply") {
    const registration =
      facts.registration && typeof facts.registration === "object"
        ? (facts.registration as { seekerRegisterUrl?: string })
        : {};
    return howToApplyCopy(
      language,
      (facts.accountType as AccountKind) || "seeker",
      registration.seekerRegisterUrl || "",
    );
  }
  if (situation === "choose_account") {
    return greetingCopy({ language, account: "both", name: "" });
  }
  if (situation === "denied") {
    return String(facts.reason ?? "") === "employer_required"
      ? unauthorizedCopy(language, "employer")
      : denyPrivateCopy(language);
  }
  if (situation === "role_redirect") {
    const target = facts.target === "employer" ? "employer" : "seeker";
    return roleRedirectCopy(language, target, String(facts.url ?? ""));
  }
  if (situation === "new_user") {
    const registration =
      facts.registration && typeof facts.registration === "object"
        ? (facts.registration as { seekerRegisterUrl?: string; employerRegisterUrl?: string })
        : {};
    const reason = String(facts.reason ?? "");
    const employerNeeded = reason === "employer_account_required" || reason === "incomplete_employer";
    const resume = reason.startsWith("incomplete");
    return [
      resume ? "" : unauthorizedCopy(language, employerNeeded ? "employer" : "seeker"),
      registrationCopy({
        language,
        role: employerNeeded ? "employer" : "seeker",
        url: employerNeeded
          ? registration.employerRegisterUrl || ""
          : registration.seekerRegisterUrl || "",
        resume,
      }),
    ]
      .filter((line) => line.trim())
      .join("\n");
  }
  if (situation === "clarify" || situation === "clarify_exhausted") {
    const missing = String(facts.missing ?? "");
    if (situation === "clarify_exhausted") {
      return clarifyExhaustedCopy(language, {
        missing,
        role: String(facts.knownRole ?? ""),
        location: String(facts.knownLocation ?? ""),
        minSalary: facts.knownMinSalary != null ? Number(facts.knownMinSalary) : null,
      });
    }
    if (missing === "location") return askLocationCopy(language);
    if (missing === "which_city" || missing === "which_role") {
      return disambiguationCopy(language, missing, facts.options);
    }
    if (missing === "which_intent") return clarifyCompetingIntentCopy(language);
    if (missing === "no_match") return clarifyNoMatchChoiceCopy(language);
    if (missing === "which_account_data") return clarifyAmbiguousCopy(language);
    if (missing === "purpose") return purposeClarifyCopy(language);
    if (missing === "which_job") return clarifyWhichShownJobCopy(language);
    return clarifyJobTitle(language);
  }
  if (situation === "no_resume") {
    if (language === "te") {
      return "సరే — రెజ్యూమ్ లేకుండా కూడా జాబ్‌లు చూడవచ్చు. ఏ రోల్ / ఏ ఏరియా కావాలి?";
    }
    if (language === "hi") {
      return "ठीक है — बिना रिज़्यूमे भी जॉब देख सकते हैं. कौनसी भूमिका / इलाका चाहिए?";
    }
    if (language === "ta") {
      return "சரி — ரெஸ்யூம் இல்லாமலும் வேலைகளைப் பார்க்கலாம். எந்த பங்கு / பகுதி வேண்டும்?";
    }
    if (language === "kn") {
      return "ಸರಿ — ರೆಸ್ಯೂಮ್ ಇಲ್ಲದೆಯೂ ಉದ್ಯೋಗಗಳನ್ನು ನೋಡಬಹುದು. ಯಾವ ಪಾತ್ರ / ಪ್ರದೇಶ ಬೇಕು?";
    }
    if (language === "ml") {
      return "ശരി — റെസ്യൂം ഇല്ലാതെയും ജോലികൾ കാണാം. ഏത് റോൾ / ഏരിയ വേണം?";
    }
    return "No problem — you can still browse jobs without a resume. Which role or area are you looking for?";
  }
  if (situation === "post_job") {
    return postJobGuideCopy({
      language,
      verification: String(facts.verification ?? "pending"),
      name: String(facts.name ?? ""),
      role: String(facts.role ?? ""),
      location: String(facts.location ?? ""),
      postJobUrl: String(facts.postJobUrl ?? ""),
      profileUrl: String(facts.profileUrl ?? ""),
    });
  }
  if (situation === "account_status") {
    const accountType = String(facts.accountType ?? "");
    if (accountType === "seeker") {
      return seekerProfileStatusCopy({
        language,
        registrationStatus: String(facts.registrationStatus ?? ""),
        whatsappVerified: Boolean(facts.whatsappVerified),
        accountStatus: String(facts.accountStatus ?? "active"),
        name: String(facts.name ?? ""),
        role: String(facts.role ?? ""),
      });
    }
    return employerVerificationCopy({
      language,
      verification: String(facts.verification ?? "pending"),
      name: String(facts.name ?? ""),
      profileUrl: String(facts.profileUrl ?? ""),
      remarks: String(facts.remarks ?? ""),
    });
  }
  if (situation === "verification_timeline_unknown") {
    if (language === "te") {
      return "ప్రస్తుతం ఖచ్చితమైన approval సమయం అందుబాటులో లేదు. Operations review పూర్తయిన తర్వాత స్టేటస్ మారుతుంది.";
    }
    if (language === "hi") {
      return "अभी सटीक approval समय उपलब्ध नहीं है. Operations समीक्षा पूरी होने पर स्टेटस अपडेट होगा.";
    }
    return "An exact approval timeline is not available right now. Your status will update after Operations finishes the review.";
  }
  if (situation === "profile") {
    return profileCopy({
      language,
      name: String(facts.name ?? ""),
      role: String(facts.role ?? ""),
      skills: Array.isArray(facts.skills) ? facts.skills.map((item) => String(item)) : [],
    });
  }
  if (situation === "job_search_no_match") {
    return withUnsupportedFilterNote(language, facts, jobSearchNoMatchCopy({
      language,
      location: String(facts.location ?? ""),
      role: String(facts.role ?? ""),
      minSalary: typeof facts.minSalary === "number" ? facts.minSalary : null,
      lowerSalaryCount: Number(facts.lowerSalaryCount ?? 0),
      undisclosedCount: Number(facts.undisclosedCount ?? 0),
      nearbyCity: String(facts.nearbyCity ?? ""),
      showMore: Boolean(facts.showMore),
    }));
  }
  if (situation === "job_search_no_more") {
    return jobSearchNoMoreCopy({
      language,
      location: String(facts.location ?? ""),
      role: String(facts.role ?? ""),
      minSalary: typeof facts.minSalary === "number" ? facts.minSalary : null,
    });
  }
  if (situation === "search_failed") {
    return serviceErrorCopy(language);
  }
  if (situation === "salary_compare") {
    const answer = String(facts.answer ?? "").trim();
    return answer || null;
  }
  if (situation === "jobs" || situation === "job_details") {
    const jobs = Array.isArray(facts.jobs)
      ? (facts.jobs as Array<Record<string, unknown>>)
      : [];
    const rendered = renderJobSearchReply({
      language,
      location: String(facts.location ?? ""),
      jobTitle: String(facts.role ?? ""),
      jobs: jobs.map((job) => ({
        jobTitle: String(job.jobTitle ?? ""),
        companyName: String(job.companyName ?? ""),
        cityName: String(job.cityName ?? ""),
        stateName: "",
        jobId: String(job.jobId ?? ""),
        salaryLabel: String(job.salary ?? job.salaryLabel ?? ""),
      })),
      widenedTo: facts.widenedTo ? String(facts.widenedTo) : undefined,
      total: typeof facts.total === "number" ? facts.total : undefined,
      frontendOrigin: String(facts.applyOrigin ?? ""),
      includeApplyLinks:
        String(facts.accountType ?? "") !== "employer" && String(facts.accountType ?? "") !== "none",
      accountType: (facts.accountType as AccountKind) || undefined,
      seekerRegisterUrl:
        facts.registration && typeof facts.registration === "object"
          ? String((facts.registration as { seekerRegisterUrl?: string }).seekerRegisterUrl ?? "")
          : "",
      appliedFilters: facts.appliedFilters ? String(facts.appliedFilters) : "",
    });
    return withUnsupportedFilterNote(language, facts, rendered);
  }
  if (situation === "count" || situation === "status" || situation === "list") {
    const applications = Array.isArray(facts.applications)
      ? (facts.applications as Array<{ jobTitle?: string; companyName?: string; status?: string }>)
      : [];
    return renderApplicationReply({
      language,
      total: Number(facts.total ?? 0),
      lines: applications.map(
        (item, index) =>
          `${index + 1}. ${item.jobTitle ?? ""} — ${item.companyName ?? ""} (${formatApplicationStatusLabel(String(item.status ?? ""))})`,
      ),
      mode: situation,
    });
  }
  if (
    situation === "EMPLOYER_JOBS" ||
    situation === "EMPLOYER_JOB_STATUS" ||
    situation === "EMPLOYER_APPLICATION_COUNT"
  ) {
    const jobs = Array.isArray(facts.jobs)
      ? (facts.jobs as Array<{ jobTitle?: string; status?: string; applications?: number }>)
      : [];
    return renderEmployerReply({
      language,
      totalApplications: Number(facts.totalApplications ?? 0),
      lines: jobs.map((job, index) =>
        situation === "EMPLOYER_APPLICATION_COUNT"
          ? `${index + 1}. ${job.jobTitle ?? ""} — ${job.applications ?? 0}`
          : `${index + 1}. ${job.jobTitle ?? ""} (${job.status ?? ""})`,
      ),
      mode:
        situation === "EMPLOYER_APPLICATION_COUNT"
          ? "count"
          : situation === "EMPLOYER_JOB_STATUS"
            ? "status"
            : "jobs",
    });
  }
  if (situation === "applied_coverage") {
    return renderCoverageReply({
      language,
      applied: Number(facts.applied ?? 0),
      compared: Number(facts.compared ?? 0),
      matched: Number(facts.matched ?? 0),
      totalListed: Number(facts.totalListed ?? 0),
      bounded: Boolean(facts.bounded),
    });
  }
  return null;
}

export function properNounsFromFacts(facts: Record<string, unknown>): string[] {
  const terms: string[] = [];
  const add = (value: unknown) => {
    if (typeof value === "string" && value.trim().length > 1) {
      terms.push(value.trim());
    }
  };
  add(facts.location);
  add(facts.role);
  add(facts.name);
  add(facts.widenedTo);
  if (Array.isArray(facts.jobs)) {
    for (const job of facts.jobs) {
      if (!job || typeof job !== "object") continue;
      const row = job as Record<string, unknown>;
      add(row.jobTitle);
      add(row.companyName);
      add(row.cityName);
      add(row.salary);
      add(row.salaryLabel);
      add(row.jobId);
    }
  }
  if (Array.isArray(facts.applications)) {
    for (const item of facts.applications) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      add(row.jobTitle);
      add(row.companyName);
    }
  }
  return terms;
}

export function isCacheableSituation(situation: string, facts: Record<string, unknown>): boolean {
  if (situation === "greeting") return !String(facts.name ?? "").trim();
  return (
    situation === "help" ||
    situation === "platform_knowledge" ||
    situation === "out_of_scope" ||
    situation === "how_to_apply" ||
    situation === "choose_account" ||
    situation === "clarify" ||
    situation === "denied" ||
    situation === "new_user"
  );
}

export type AccountKind = "seeker" | "employer" | "both" | "none";

export function chooseAccountRole(text: string): "seeker" | "employer" | null {
  const trimmed = text.trim();
  const posting =
    looksLikePostJobRequest(trimmed) ||
    /\b(employer|hiring|hire|recruit|workers?|staff needed|need staff|hire staff)\b|నియమించ|సిబ్బంది|రిక్రూట్|మనిషి కావాలి|వర్కర్స్ కావాలి|भर्ती|कर्मचारी चाहिए|मुझे कर्मचारी|ஊழியர்|ஆட்களை|ஆள் எடுக்க|வேலை போஸ்ட்|ನೇಮಕ|ಸಿಬ್ಬಂದಿ|ನೌಕರ ಬೇಕು|നിയമിക്ക|ജീവനക്കാര്|തൊഴിലാളി/i.test(
      trimmed,
    );
  // Typo-tolerant seeker cues (wnat→want) and compacted "jobseeker".
  const seekerPhrase =
    /\b(job[-\s]?seeker|jobseeker|looking for (a )?job|looking for work|need (a )?job|find (a )?job|want (a )?job|wnat (a )?job|want work|need work|suitable jobs?|match(ing)? (my )?resume|jobs? (for|matching) me)\b|ఉద్యోగం కావాలి|ఉద్యోగాలను|జాబ్ కావాలి|పని కావాలి|नौकरी चाहिए|नौकरी ढूंढ|सही नौकरी|काम चाहिए|जॉब चाहिए|வேலை தேவை|வேலை வேண்டும்|ಉದ್ಯೋಗ ಬೇಕು|ಕೆಲಸ ಬೇಕು|ജോലി വേണം|job kavali|jobs kavali|naaku job|naku job|pani kavali|job chupinchu|jobs chupinchu/i.test(
      trimmed,
    );
  // Role + job = seeker only when not posting ("post electrician job" stays employer).
  const rolePlusJob =
    !posting &&
    /\b(electrician|driver|helper|plumber|carpenter|cook|mason|welder|painter|mechanic|labour|labor|watchman|security|delivery|sales)\b/i.test(
      trimmed,
    ) &&
    /\b(job|jobs|work|kavali|chahiye|naukri|udyog|வேலை|ಕೆಲಸ|ജോലി)\b/i.test(trimmed);
  const seeker = seekerPhrase || rolePlusJob;
  if (posting && !seekerPhrase) return "employer";
  if (seeker && !posting) return "seeker";
  if (posting && seekerPhrase) {
    return /post|hire|hiring|recruit|workers|कर्मचारी|నియమించ|సిబ్బంది|ஊழியர்|ಸಿಬ್ಬಂದಿ|ജീവനക്കാര്/i.test(
      trimmed,
    )
      ? "employer"
      : "seeker";
  }
  if (posting) return "employer";
  return null;
}

export function looksLikePostJobRequest(text: string): boolean {
  return /want to post|\bpost(?:ing)?\b.{0,48}\b(jobs?|vacanc(?:y|ies)|opening)\b|\b(jobs?|vacanc(?:y|ies))\s*post|post\s+a\s+new\b.{0,40}\b(job|vacanc)|post cheyy|పోస్ట్ చేయ|नौकरी पोस्ट|जॉब पोस्ट|வேலை போஸ்ட்|ಜಾಬ್ ಪೋಸ್ಟ್|ജോലി പോസ്റ്റ്/i.test(
    text,
  );
}

export type ConversationState = "" | "NEW_USER_INTENT" | "SEEKER_MENU" | "EMPLOYER_MENU";

export function conversationStateForAccount(account: AccountKind): ConversationState {
  if (account === "employer") return "EMPLOYER_MENU";
  if (account === "seeker") return "SEEKER_MENU";
  return "NEW_USER_INTENT";
}

export function detectMenuSelection(
  text: string,
  state: ConversationState | string | null | undefined,
): BotIntent | null {
  if (!state) return null;
  const trimmed = text.trim();
  const digitMatch = trimmed.match(/^([1-5])[).:]?$/) || trimmed.match(/^([1-5])️⃣$/);
  const digit = digitMatch?.[1] ?? "";

  if (state === "NEW_USER_INTENT") {
    if (digit === "1" || /find a job|looking for a job|🔎/i.test(trimmed)) return "JOB_SEARCH";
    if (digit === "2" || /post a job|want to hire|📢/i.test(trimmed)) return "POST_JOB";
    return null;
  }
  if (state === "SEEKER_MENU") {
    if (digit === "1" || /find jobs?|🔎/i.test(trimmed)) return "JOB_SEARCH";
    if (digit === "2" || /applications?|📋/i.test(trimmed)) return "MY_APPLICATIONS";
    if (digit === "3" || /profile|👤/i.test(trimmed)) return "MY_SKILLS";
    if (digit === "4" || /something else|help|💬/i.test(trimmed)) return "HELP";
    return null;
  }
  if (state === "EMPLOYER_MENU") {
    if (digit === "1" || /post a job|post job/i.test(trimmed)) return "POST_JOB";
    if (digit === "2" || /check (your )?jobs|my jobs/i.test(trimmed)) return "EMPLOYER_JOBS";
    if (digit === "3" || /applications?/i.test(trimmed)) return "EMPLOYER_APPLICATION_COUNT";
    if (digit === "4" || /account|verification/i.test(trimmed)) return "ACCOUNT_STATUS";
    if (digit === "5" || /other|help/i.test(trimmed)) return "HELP";
    return null;
  }
  return null;
}

export function menuUnderstanding(
  intent: BotIntent,
  language: BotLanguage,
): BotUnderstanding {
  const scope = scopeForIntent(intent);
  return {
    intent,
    language,
    location: "",
    category: "",
    jobQuery: "",
    openSearch: intent === "JOB_SEARCH",
    scope,
    requiresAuth: scope === "OWN_DATA" || scope === "OWN_EMPLOYER_DATA",
    confidence: 0.99,
    focus: "",
  };
}

export type UnknownUserAction =
  | "greeting"
  | "employer_register"
  | "seeker_register"
  | "how_to_apply"
  | "public_jobs"
  | "out_of_scope"
  | "clarify";

/** Account status and intent stay separate. Unknown users may search public jobs. */
export function unknownUserAction(
  understanding: Pick<BotUnderstanding, "intent" | "scope">,
): UnknownUserAction {
  const { intent, scope } = understanding;
  if (intent === "GREETING" || intent === "HELP") {
    return "greeting";
  }
  if (intent === "POST_JOB" || scope === "OWN_EMPLOYER_DATA") return "employer_register";
  if (intent === "ACCOUNT_STATUS") return "seeker_register";
  if (intent === "HOW_TO_APPLY") return "how_to_apply";
  if (scope === "OWN_DATA") return "seeker_register";
  if (intent === "JOB_SEARCH" || intent === "JOB_COUNT" || intent === "JOB_DETAILS") {
    return "public_jobs";
  }
  if (intent === "UNRELATED") return "out_of_scope";
  return "clarify";
}

export function shouldUseLlmFallback(local: BotUnderstanding, text: string): boolean {
  if (detectProtocolTurn(text)) return false;
  if (chooseAccountRole(text)) return false;
  if (isConfidentLocalUnderstanding(local)) return false;
  const trimmed = text.trim();
  if (trimmed.length < 12) return false;
  return local.intent === "UNKNOWN" || local.confidence < 0.9;
}

const EMPLOYER_ONLY_INTENTS = new Set<BotIntent>([
  "POST_JOB",
  "EMPLOYER_JOBS",
  "EMPLOYER_JOB_STATUS",
  "EMPLOYER_APPLICATION_COUNT",
]);

/**
 * Seeker-only product surface — employers are redirected (strict role separation).
 * Includes public job discovery: an Employer WhatsApp account must not run
 * candidate job search / apply flows.
 */
const SEEKER_PRIVATE_INTENTS = new Set<BotIntent>([
  "JOB_SEARCH",
  "JOB_COUNT",
  "JOB_DETAILS",
  "PROFILE_MATCH",
  "PROFILE_JOBS",
  "MY_APPLICATIONS",
  "APPLICATION_STATUS",
  "APPLICATION_COUNT",
  "APPLIED_COVERAGE",
  "MY_SKILLS",
  "HOW_TO_APPLY",
]);

/** Account role decides permission. Cross-role intents are redirected, not answered. */
export function roleRedirectTarget(
  intent: BotIntent,
  account: AccountKind,
): "" | "seeker" | "employer" {
  if (account === "seeker" && EMPLOYER_ONLY_INTENTS.has(intent)) return "employer";
  if (account === "employer" && SEEKER_PRIVATE_INTENTS.has(intent)) return "seeker";
  return "";
}

export function applyAccountAwareIntent(
  understanding: BotUnderstanding,
  account: AccountKind,
): BotUnderstanding {
  let next = understanding;
  // Dual-role profile/verification status — bind scope to the linked account.
  if (understanding.intent === "ACCOUNT_STATUS") {
    if (account === "seeker") {
      next = {
        ...understanding,
        scope: "OWN_DATA",
        requiresAuth: true,
        crossRole: "",
        category: "",
        jobQuery: "",
        openSearch: false,
      };
    } else if (account === "employer") {
      next = {
        ...understanding,
        scope: "OWN_EMPLOYER_DATA",
        requiresAuth: true,
        crossRole: "",
        category: "",
        jobQuery: "",
        openSearch: false,
      };
    } else if (account === "none") {
      next = {
        ...understanding,
        scope: "NONE",
        requiresAuth: false,
        crossRole: "",
      };
    }
  }
  // Employer asking about "applications" in the hiring sense → employer applicants.
  // Seeker-only intents (skills, profile jobs, how to apply, job search) are not remapped.
  if (account === "employer") {
    if (
      next.intent === "MY_APPLICATIONS" ||
      next.intent === "APPLICATION_COUNT" ||
      next.intent === "APPLICATION_STATUS"
    ) {
      next = {
        ...next,
        intent: "EMPLOYER_APPLICATION_COUNT",
        location: "",
        category: "",
        jobQuery: "",
        openSearch: false,
        scope: "OWN_EMPLOYER_DATA",
        requiresAuth: true,
        crossRole: "",
      };
    }
  }
  const redirect = roleRedirectTarget(next.intent, account);
  if (redirect) {
    return { ...next, crossRole: redirect, scope: "NONE", requiresAuth: false };
  }
  return { ...next, crossRole: "" };
}

const EMPLOYER_TOPIC_INTENTS = new Set<string>([
  "POST_JOB",
  "EMPLOYER_JOBS",
  "EMPLOYER_JOB_STATUS",
  "EMPLOYER_APPLICATION_COUNT",
  "ACCOUNT_STATUS",
]);

/**
 * Continue a prior topic for short follow-ups ("Status?", "electrician" after post-job).
 * Explicit corrections and private intents in the current message always win.
 */
export function applyConversationFollowUp(
  text: string,
  understanding: BotUnderstanding,
  lastIntent: string | undefined | null,
): BotUnderstanding {
  const prior = String(lastIntent ?? "").trim();
  if (/^apply$/i.test(text.trim()) && (prior === "JOB_SEARCH" || prior === "JOB_DETAILS" || prior === "JOB_COUNT")) {
    return {
      ...understanding,
      intent: "JOB_DETAILS",
      scope: "PUBLIC_JOBS",
      requiresAuth: false,
      openSearch: false,
      jobOrdinal: null,
      confidence: Math.max(understanding.confidence, 0.95),
    };
  }
  if (!prior || isPrivateIntent(understanding.intent) || understanding.intent === "ACCOUNT_STATUS") {
    return understanding;
  }
  if (
    understanding.intent === "GREETING" ||
    understanding.intent === "HELP" ||
    understanding.intent === "PLATFORM_KNOWLEDGE" ||
    understanding.intent === "UNRELATED"
  ) {
    return understanding;
  }

  if (
    looksLikeStatusFollowUp(text) &&
    (prior === "MY_APPLICATIONS" ||
      prior === "APPLICATION_STATUS" ||
      prior === "APPLICATION_COUNT" ||
      prior === "APPLIED_COVERAGE")
  ) {
    return {
      ...understanding,
      intent: "APPLICATION_STATUS",
      scope: "OWN_DATA",
      requiresAuth: true,
      category: "",
      jobQuery: "",
      openSearch: false,
      confidence: Math.max(understanding.confidence, 0.92),
    };
  }

  // "Status?" / "when will it be approved?" after posting or profile → keep employer/profile topic.
  if (looksLikeStatusFollowUp(text) && EMPLOYER_TOPIC_INTENTS.has(prior)) {
    if (prior === "ACCOUNT_STATUS" || /approved|approval|verify/i.test(text)) {
      return {
        ...understanding,
        intent: "ACCOUNT_STATUS",
        scope: "NONE",
        requiresAuth: true,
        category: "",
        jobQuery: /approved|approval/i.test(text) ? "verification_timeline" : "",
        openSearch: false,
        confidence: Math.max(understanding.confidence, 0.92),
      };
    }
    return {
      ...understanding,
      intent: "EMPLOYER_JOB_STATUS",
      scope: "OWN_EMPLOYER_DATA",
      requiresAuth: true,
      category: "",
      jobQuery: "",
      openSearch: false,
      confidence: Math.max(understanding.confidence, 0.92),
    };
  }

  // Bare job role after employer posting flow → continue POST_JOB, not candidate JOB_SEARCH.
  const bareRole =
    understanding.intent === "JOB_SEARCH" &&
    Boolean(understanding.category) &&
    !understanding.location &&
    text.trim().split(/\s+/).length <= 3 &&
    !/job|jobs|kavali|chahiye|find|search|apply|hire/i.test(text);
  if (bareRole && (prior === "POST_JOB" || prior === "EMPLOYER_JOBS" || prior === "EMPLOYER_JOB_STATUS")) {
    return {
      ...understanding,
      intent: "POST_JOB",
      scope: "OWN_EMPLOYER_DATA",
      requiresAuth: true,
      openSearch: false,
      confidence: Math.max(understanding.confidence, 0.9),
    };
  }

  // Show-more / salary-only follow-ups keep JOB_SEARCH when a prior search exists.
  if (
    (understanding.showMore || looksLikeShowMoreJobs(text) || understanding.focus === "salary") &&
    (prior === "JOB_SEARCH" || prior === "JOB_COUNT" || prior === "JOB_DETAILS")
  ) {
    return {
      ...understanding,
      intent: "JOB_SEARCH",
      scope: "PUBLIC_JOBS",
      requiresAuth: false,
      showMore: understanding.showMore || looksLikeShowMoreJobs(text),
      openSearch: false,
      confidence: Math.max(understanding.confidence, 0.92),
    };
  }

  // Bare "5" / "apply 5" after a job list continues as job details, not a new search.
  if (
    looksLikeJobOrdinalSelection(text) &&
    (prior === "JOB_SEARCH" || prior === "JOB_COUNT" || prior === "JOB_DETAILS")
  ) {
    return {
      ...understanding,
      intent: "JOB_DETAILS",
      scope: "PUBLIC_JOBS",
      requiresAuth: false,
      openSearch: false,
      jobOrdinal: understanding.jobOrdinal ?? jobOrdinalFromText(text) ?? 0,
      confidence: Math.max(understanding.confidence, 0.95),
    };
  }

  return understanding;
}

const ROLE_HINT_PRESERVE_INTENTS = new Set<BotIntent>([
  "HELP",
  "PLATFORM_KNOWLEDGE",
  "PROFILE_JOBS",
  "PROFILE_MATCH",
  "MY_APPLICATIONS",
  "APPLICATION_STATUS",
  "APPLICATION_COUNT",
  "APPLIED_COVERAGE",
  "EMPLOYER_JOBS",
  "EMPLOYER_JOB_STATUS",
  "EMPLOYER_APPLICATION_COUNT",
  "ACCOUNT_STATUS",
  "MY_SKILLS",
  "HOW_TO_APPLY",
  "JOB_DETAILS",
  "JOB_COUNT",
  "UNRELATED",
  "CLARIFY",
]);

export function applyRoleHints(
  text: string,
  understanding: BotUnderstanding,
  account: AccountKind,
): BotUnderstanding {
  if (ROLE_HINT_PRESERVE_INTENTS.has(understanding.intent)) {
    return understanding;
  }
  const role = chooseAccountRole(text);
  if (!role) return understanding;
  if (account === "none" && role === "seeker") {
    return {
      ...understanding,
      intent: "JOB_SEARCH",
      confidence: Math.max(understanding.confidence, 0.95),
      openSearch: !understanding.category,
      scope: "PUBLIC_JOBS",
      requiresAuth: false,
    };
  }
  if ((account === "none" || account === "employer") && role === "employer") {
    return {
      ...understanding,
      intent: "POST_JOB",
      confidence: Math.max(understanding.confidence, 0.95),
      scope: "OWN_EMPLOYER_DATA",
      requiresAuth: true,
    };
  }
  return understanding;
}

export function capabilityCopy(language: BotLanguage, account: AccountKind = "seeker"): string {
  if (account === "employer") {
    if (language === "te") return "నేను మీరు పోస్ట్ చేసిన ఉద్యోగాలు, వాటి స్థితి, మరియు వాటికి వచ్చిన దరఖాస్తుల గురించి సహాయం చేయగలను.";
    if (language === "hi") return "मैं आपकी पोस्ट की गई नौकरियों, उनकी स्थिति, और उन पर आए आवेदनों में मदद कर सकता हूँ.";
    if (language === "ta") return "நீங்கள் போஸ்ட் செய்த வேலைகள், அவற்றின் நிலை, மற்றும் வந்த விண்ணப்பங்களில் உதவ முடியும்.";
    if (language === "kn") return "ನೀವು ಪೋಸ್ಟ್ ಮಾಡಿದ ಉದ್ಯೋಗಗಳು, ಅವುಗಳ ಸ್ಥಿತಿ, ಮತ್ತು ಬಂದ ಅರ್ಜಿಗಳ ಬಗ್ಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.";
    if (language === "ml") return "നിങ്ങൾ പോസ്റ്റ് ചെയ്ത ജോലികൾ, അവയുടെ നില, വന്ന അപേക്ഷകൾ എന്നിവയിൽ സഹായിക്കാം.";
    return "I can help with your posted jobs, their status, and the applications those jobs received.";
  }
  if (account === "none" || account === "both") {
    if (language === "te") return "మీరు ఉద్యోగం వెతుకుతున్నారా, లేక ఉద్యోగులను నియమించాలనుకుంటున్నారా?";
    if (language === "hi") return "क्या आप नौकरी ढूंढ रहे हैं, या कर्मचारियों को रखना चाहते हैं?";
    if (language === "ta") return "வேலை தேடுகிறீர்களா, அல்லது ஆட்களை நியமிக்க வேண்டுமா?";
    if (language === "kn") return "ನೀವು ಉದ್ಯೋಗ ಹುಡುಕುತ್ತಿದ್ದೀರಾ, ಅಥವಾ ಉದ್ಯೋಗಿಗಳನ್ನು ನೇಮಿಸಬೇಕೇ?";
    if (language === "ml") return "നിങ്ങൾ ജോലി തിരയുകയാണോ, അതോ ആളുകളെ നിയമിക്കണോ?";
    return "Are you looking for a job, or are you an employer who wants to hire?";
  }
  if (language === "te") return "నేను ఉద్యోగాలు వెతకడం, మీ దరఖాస్తులు, వాటి స్థితి, మరియు మీ ప్రొఫైల్‌కు సరిపోయే ఉద్యోగాల్లో సహాయం చేయగలను.";
  if (language === "hi") return "मैं नौकरी खोज, आपके आवेदन, उनकी स्थिति, और आपकी प्रोफाइल के अनुसार नौकरियों में मदद कर सकता हूँ.";
  if (language === "ta") return "வேலை தேடல், உங்கள் விண்ணப்பங்கள், அவற்றின் நிலை, மற்றும் உங்கள் சுயவிவரத்துக்கு பொருந்தும் வேலைகளில் உதவ முடியும்.";
  if (language === "kn") return "ಉದ್ಯೋಗ ಹುಡುಕಾಟ, ನಿಮ್ಮ ಅರ್ಜಿಗಳು, ಅವುಗಳ ಸ್ಥಿತಿ, ಮತ್ತು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ಗೆ ಸೂಕ್ತ ಉದ್ಯೋಗಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.";
  if (language === "ml") return "ജോലി തിരയൽ, നിങ്ങളുടെ അപേക്ഷകൾ, അവയുടെ നില, പ്രൊഫൈലിന് അനുയോജ്യമായ ജോലികൾ എന്നിവയിൽ സഹായിക്കാം.";
  return "I can help you find jobs, check your applications and their status, and see jobs that match your profile.";
}

export function clarifyAmbiguousCopy(language: BotLanguage): string {
  if (language === "te") {
    return "మీరు మీరు apply చేసిన jobs గురించి అడుగుతున్నారా, లేక మీరు post చేసిన jobs కి వచ్చిన applications గురించా?";
  }
  if (language === "hi") {
    return "आप अपने किए गए आवेदनों के बारे में पूछ रहे हैं, या अपनी पोस्ट की गई नौकरियों पर आए आवेदनों के बारे में?";
  }
  return "Are you asking about applications you submitted, or applications received on jobs you posted?";
}

export function denyPrivateCopy(language: BotLanguage): string {
  if (language === "te") {
    return "ఇతర employer లేదా ఇతర వ్యక్తుల application వివరాలు చూపించలేను. మీ సొంత account కి ఉన్న సమాచారం మాత్రమే చెప్పగలను.";
  }
  if (language === "hi") {
    return "मैं किसी और employer या किसी और व्यक्ति के आवेदन नहीं दिखा सकता. केवल आपके अपने खाते का डेटा उपलब्ध है.";
  }
  return "I can only show data linked to your own account. Private employer or another person's applications are not available.";
}

export function serviceErrorCopy(language: BotLanguage): string {
  if (language === "te") {
    return "క్షమించండి, ప్రస్తుతం సమాచారం తీసుకోలేకపోయాను. దయచేసి కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.";
  }
  if (language === "hi") return "क्षमा करें, अभी जानकारी नहीं ला सका. कृपया थोड़ी देर बाद फिर कोशिश करें.";
  if (language === "ta") return "மன்னிக்கவும், இப்போது தகவலை பெற முடியவில்லை. சிறிது நேரம் கழித்து முயற்சிக்கவும்.";
  if (language === "kn") return "ಕ್ಷಮಿಸಿ, ಈಗ ಮಾಹಿತಿ ತರಲು ಆಗಲಿಲ್ಲ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.";
  if (language === "ml") return "ക്ഷമിക്കണം, ഇപ്പോൾ വിവരം എടുക്കാൻ കഴിഞ്ഞില്ല. കുറച്ച് കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കൂ.";
  return "Sorry, I couldn't fetch that information right now. Please try again.";
}

export function greetingCopy(input: {
  language: BotLanguage;
  account: AccountKind;
  name: string;
}): string {
  const name = input.name.trim();
  if (input.account === "both") {
    if (input.language === "te") {
      return "మీ WhatsApp నంబర్ ఒకటి కంటే ఎక్కువ AsliJobs ఖాతాలకు లింక్ అయి ఉంది. ఉద్యోగం వెతకాలా, లేక employer గా కొనసాగాలా?";
    }
    if (input.language === "hi") {
      return "आपका WhatsApp नंबर एक से अधिक AsliJobs खातों से जुड़ा है. नौकरी खोजनी है या employer के रूप में जारी रखना है?";
    }
    if (input.language === "ta") {
      return "உங்கள் WhatsApp எண் ஒன்றுக்கு மேற்பட்ட AsliJobs கணக்குகளுடன் இணைந்துள்ளது. வேலை தேடுபவராகத் தொடரவா, Employer ஆகத் தொடரவா?";
    }
    if (input.language === "kn") {
      return "ನಿಮ್ಮ WhatsApp ಸಂಖ್ಯೆ ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು AsliJobs ಖಾತೆಗಳಿಗೆ ಸಂಪರ್ಕವಾಗಿದೆ. ಉದ್ಯೋಗ ಹುಡುಕುವವರಾಗಿ ಮುಂದುವರಿಯೋ, Employer ಆಗಿ ಮುಂದುವರಿಯೋ?";
    }
    if (input.language === "ml") {
      return "നിങ്ങളുടെ WhatsApp നമ്പർ ഒന്നിലധികം AsliJobs അക്കൗണ്ടുകളുമായി ബന്ധപ്പെട്ടിരിക്കുന്നു. ജോലി അന്വേഷകനായി തുടരണോ, Employer ആയി തുടരണോ?";
    }
    return "Your WhatsApp number is linked to more than one AsliJobs account. Continue as a job seeker or as an employer?";
  }
  if (input.account === "none") {
    if (input.language === "te") {
      return "హాయ్ 👋 AsliJobs కి స్వాగతం!\n\nమీకు ఏం కావాలి?\n\n🔎 ఉద్యోగం కావాలా?\n📢 జాబ్ పోస్ట్ చేయాలా / మనిషిని నియమించాలా?\n\nమీరు కావాల్సింది టైప్ చేయండి లేదా వాయిస్ పంపండి.";
    }
    if (input.language === "hi") {
      return "नमस्ते 👋 AsliJobs में आपका स्वागत है!\n\nआप क्या चाहते हैं?\n\n🔎 नौकरी ढूंढनी है?\n📢 नौकरी पोस्ट करनी है / भर्ती करनी है?\n\nबताइए या वॉइस भेजिए.";
    }
    if (input.language === "ta") {
      return "வணக்கம் 👋 AsliJobs-க்கு வரவேற்கிறோம்!\n\n🔎 வேலை தேடவா?\n📢 வேலை போஸ்ட் செய்யவா?";
    }
    if (input.language === "kn") {
      return "ನಮಸ್ಕಾರ 👋 AsliJobs ಗೆ ಸ್ವಾಗತ!\n\n🔎 ಕೆಲಸ ಹುಡುಕಬೇಕೇ?\n📢 ಜಾಬ್ ಪೋಸ್ಟ್ ಮಾಡಬೇಕೇ?";
    }
    if (input.language === "ml") {
      return "ഹായ് 👋 AsliJobs-ലേക്ക് സ്വാഗതം!\n\n🔎 ജോലി തേടണോ?\n📢 ജോലി പോസ്റ്റ് ചെയ്യണോ?";
    }
    return "Hi 👋 Welcome to AsliJobs!\n\nWhat are you looking for?\n\n🔎 I want to find a job\n📢 I want to post a job\n\nYou can also simply tell me what you need.";
  }
  if (input.account === "employer") {
    const who = name ? ` ${name}` : "";
    if (input.language === "te") {
      return `హాయ్${who} 👋\nAsliJobs కి తిరిగి స్వాగతం!\n\n1️⃣ కొత్త ఉద్యోగం పోస్ట్ చేయాలా?\n2️⃣ మీ posted jobs చూడాలా?\n3️⃣ అప్లికేషన్స్ చూడాలా?\n4️⃣ అకౌంట్ / వెరిఫికేషన్\n5️⃣ ఇంకేదైనా`;
    }
    if (input.language === "hi") {
      return `नमस्ते${who} 👋 AsliJobs में वापस स्वागत है.\n\nआप अपनी पोस्ट की गई नौकरियां, उनकी स्थिति, और आए आवेदन देख सकते हैं. क्या जानना है?`;
    }
    if (input.language === "ta") {
      return `வணக்கம்${who} 👋 AsliJobs-க்கு மீண்டும் வரவேற்கிறோம்.\n\nநீங்கள் போஸ்ட் செய்த வேலைகள், நிலை, மற்றும் வந்த விண்ணப்பங்களை பார்க்கலாம்.`;
    }
    if (input.language === "kn") {
      return `ನಮಸ್ಕಾರ${who} 👋 AsliJobs ಗೆ ಮತ್ತೆ ಸ್ವಾಗತ.\n\nನೀವು ಪೋಸ್ಟ್ ಮಾಡಿದ ಉದ್ಯೋಗಗಳು, ಸ್ಥಿತಿ, ಮತ್ತು ಬಂದ ಅರ್ಜಿಗಳನ್ನು ನೋಡಬಹುದು.`;
    }
    if (input.language === "ml") {
      return `ഹായ്${who} 👋 AsliJobs-ലേക്ക് വീണ്ടും സ്വാഗതം.\n\nനിങ്ങൾ പോസ്റ്റ് ചെയ്ത ജോലികൾ, നില, വന്ന അപേക്ഷകൾ എന്നിവ കാണാം.`;
    }
    return `Hi${who} 👋\nWelcome back to AsliJobs!\n\nHow can I help you today?\n\n1️⃣ Post a Job\n2️⃣ Check your posted jobs\n3️⃣ Check Applications\n4️⃣ Account / Verification\n5️⃣ Other\n\nYou can also simply type or send a voice message describing what you need.`;
  }
  const who = name ? ` ${name}` : "";
  if (input.language === "te") {
    return `హాయ్${who} 👋\nAsliJobs కి తిరిగి స్వాగతం!\n\n🔎 జాబ్స్ వెతకండి\n📋 అప్లికేషన్స్ చూడండి\n👤 ప్రొఫైల్\n💬 ఇంకేదైనా`;
  }
  if (input.language === "hi") {
    return `नमस्ते${who} 👋\nAsliJobs में वापस स्वागत है!\n\n🔎 नौकरियां खोजें\n📋 आवेदन देखें\n👤 प्रोफ़ाइल\n💬 कुछ और`;
  }
  if (input.language === "ta") {
    return `வணக்கம்${who} 👋 AsliJobs-க்கு மீண்டும் வரவேற்கிறோம்.\n\nவேலை தேடலாம், உங்கள் விண்ணப்பங்களையும் நிலையையும் பார்க்கலாம். எந்த வேலை வேண்டும்?`;
  }
  if (input.language === "kn") {
    return `ನಮಸ್ಕಾರ${who} 👋 AsliJobs ಗೆ ಮತ್ತೆ ಸ್ವಾಗತ.\n\nಉದ್ಯೋಗ ಹುಡುಕಬಹುದು, ನಿಮ್ಮ ಅರ್ಜಿಗಳು ಮತ್ತು ಸ್ಥಿತಿ ನೋಡಬಹುದು. ಯಾವ ಕೆಲಸ ಬೇಕು?`;
  }
  if (input.language === "ml") {
    return `ഹായ്${who} 👋 AsliJobs-ലേക്ക് വീണ്ടും സ്വാഗതം.\n\nജോലി തിരയാം, അപേക്ഷകളും നിലയും കാണാം. ഏത് ജോലി വേണം?`;
  }
  return `Hi${who} 👋 Welcome to AsliJobs!\n\nWhat are you looking for today?\n\n🔎 Find Jobs\n📋 Check Applications\n👤 Profile\n💬 Something else\n\nYou can also type your job requirement directly, for example:\n'Car driver jobs in Hyderabad.'\n\nHow can I help you today?`;
}

export function registrationCopy(input: {
  language: BotLanguage;
  role: "seeker" | "employer";
  url: string;
  resume?: boolean;
}): string {
  const url = input.url.trim();
  if (input.resume) {
    const who = input.role === "employer" ? "Employer" : "Job Seeker";
    if (input.language === "te") return `మీ ${who} రిజిస్ట్రేషన్ ఇంకా పూర్తి కాలేదు. ఇక్కడ కొనసాగించండి:\n${url}`;
    if (input.language === "hi") return `आपका ${who} रजिस्ट्रेशन अभी पूरा नहीं हुआ है. यहाँ जारी रखें:\n${url}`;
    if (input.language === "ta") return `உங்கள் ${who} பதிவு இன்னும் முடியவில்லை. இங்கே தொடருங்கள்:\n${url}`;
    if (input.language === "kn") return `ನಿಮ್ಮ ${who} ನೋಂದಣಿ ಇನ್ನೂ ಪೂರ್ಣವಾಗಿಲ್ಲ. ಇಲ್ಲಿ ಮುಂದುವರಿಸಿ:\n${url}`;
    if (input.language === "ml") return `നിങ്ങളുടെ ${who} രജിസ്ട്രേഷൻ ഇനിയും പൂർത്തിയായിട്ടില്ല. ഇവിടെ തുടരൂ:\n${url}`;
    return `Your ${who} registration is still open. Continue here:\n${url}`;
  }
  if (input.role === "employer") {
    if (input.language === "te") {
      return `సరే 👍 జాబ్ పోస్ట్ చేయడానికి ముందు AsliJobs లో Employer account create చేసుకోండి.\n\n👉 Register as Employer:\n${url}\n\nAccount create చేసాక WhatsApp లో మళ్లీ message చేయండి.`;
    }
    if (input.language === "hi") {
      return `ज़रूर 👍 नौकरी पोस्ट करने से पहले AsliJobs पर Employer खाता बनाएं.\n\n👉 Register as Employer:\n${url}`;
    }
    if (input.language === "ta") {
      return `சரி 👍 வேலை போஸ்ட் செய்ய Employer கணக்கு உருவாக்குங்கள்.\n\n👉 Register as Employer:\n${url}`;
    }
    if (input.language === "kn") {
      return `ಸರಿ 👍 ಜಾಬ್ ಪೋಸ್ಟ್ ಮಾಡಲು Employer ಖಾತೆ ತೆರೆಯಿರಿ.\n\n👉 Register as Employer:\n${url}`;
    }
    if (input.language === "ml") {
      return `ശരി 👍 ജോലി പോസ്റ്റ് ചെയ്യാൻ Employer അക്കൗണ്ട് ഉണ്ടാക്കൂ.\n\n👉 Register as Employer:\n${url}`;
    }
    return `Sure 👍 You can post your requirement on AsliJobs.\n\nCreate your Employer account here:\n${url}\n\nAfter registration, you can post jobs and receive applications.`;
  }
  if (input.language === "te") {
    return `సరే 👍 జాబ్స్ సెర్చ్ చేయడానికి ముందు AsliJobs లో Job Seeker account create చేసుకోండి.\n\n👉 Register as Job Seeker:\n${url}\n\nRegistration complete అయ్యాక WhatsApp లో మళ్లీ message చేయండి.`;
  }
  if (input.language === "hi") {
    return `ज़रूर 👍 नौकरी खोजने से पहले AsliJobs पर Job Seeker खाता बनाएं.\n\n👉 Register as Job Seeker:\n${url}`;
  }
  if (input.language === "ta") {
    return `சரி 👍 வேலை தேட Job Seeker கணக்கு உருவாக்குங்கள்.\n\n👉 Register as Job Seeker:\n${url}`;
  }
  if (input.language === "kn") {
    return `ಸರಿ 👍 ಉದ್ಯೋಗ ಹುಡುಕಲು Job Seeker ಖಾತೆ ತೆರೆಯಿರಿ.\n\n👉 Register as Job Seeker:\n${url}`;
  }
  if (input.language === "ml") {
    return `ശരി 👍 ജോലി തേടാൻ Job Seeker അക്കൗണ്ട് ഉണ്ടാക്കൂ.\n\n👉 Register as Job Seeker:\n${url}`;
  }
  return `Great! 👍 You're looking for a job.\n\nCreate your free Job Seeker account on AsliJobs to find and apply for jobs:\n${url}\n\nAfter registering, you can search and apply for jobs directly.`;
}

export function roleRedirectCopy(
  language: BotLanguage,
  target: "seeker" | "employer",
  url: string,
): string {
  const link = url.trim();
  if (target === "employer") {
    if (language === "te") {
      return `క్షమించండి, నేను ఉద్యోగాలు వెతకడం, దరఖాస్తులు, ఇంటర్వ్యూలు, మరియు మీ Job Seeker ప్రొఫైల్‌లో సహాయం చేయగలను. ఉద్యోగులను నియమించాలంటే Employer గా నమోదు చేసుకోండి:\n${link}`;
    }
    if (language === "hi") {
      return `क्षमा करें, मैं नौकरी खोज, आवेदन, इंटरव्यू और आपकी Job Seeker प्रोफ़ाइल में मदद कर सकता हूँ. भर्ती करनी है तो Employer के रूप में रजिस्टर करें:\n${link}`;
    }
    if (language === "ta") {
      return `மன்னிக்கவும், வேலை தேடல், விண்ணப்பங்கள், நேர்காணல்கள், மற்றும் உங்கள் Job Seeker சுயவிவரத்தில் உதவ முடியும். ஆட்களை நியமிக்க Employer ஆகப் பதிவு செய்யுங்கள்:\n${link}`;
    }
    if (language === "kn") {
      return `ಕ್ಷಮಿಸಿ, ಉದ್ಯೋಗ ಹುಡುಕಾಟ, ಅರ್ಜಿಗಳು, ಸಂದರ್ಶನಗಳು, ಮತ್ತು ನಿಮ್ಮ Job Seeker ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ನೇಮಕ ಮಾಡಲು Employer ಆಗಿ ನೋಂದಾಯಿಸಿ:\n${link}`;
    }
    if (language === "ml") {
      return `ക്ഷമിക്കണം, ജോലി തിരയൽ, അപേക്ഷകൾ, അഭിമുഖങ്ങൾ, നിങ്ങളുടെ Job Seeker പ്രൊഫൈൽ എന്നിവയിൽ സഹായിക്കാം. നിയമിക്കണമെങ്കിൽ Employer ആയി രജിസ്റ്റർ ചെയ്യൂ:\n${link}`;
    }
    return `Sorry, this WhatsApp account is configured for Job Seeker services only. Employer registration, job posting, and hiring management require an Employer account:\n${link}`;
  }
  if (language === "te") {
    return `క్షమించండి, ఈ WhatsApp ఖాతా Employer సేవలకు మాత్రమే. ఉద్యోగం వెతకడం, దరఖాస్తు, లేదా Job Seeker ప్రొఫైల్ కోసం Job Seeker ఖాతా ఉపయోగించండి:\n${link}`;
  }
  if (language === "hi") {
    return `क्षमा करें, यह WhatsApp खाता केवल Employer सेवाओं के लिए है. नौकरी खोज, आवेदन, या Job Seeker प्रोफ़ाइल के लिए Job Seeker खाता उपयोग करें:\n${link}`;
  }
  if (language === "ta") {
    return `மன்னிக்கவும், இந்த WhatsApp கணக்கு Employer சேவைகளுக்கு மட்டும். வேலை தேடல், விண்ணப்பம் அல்லது Job Seeker சுயவிவரம் வேண்டுமானால் Job Seeker கணக்கைப் பயன்படுத்துங்கள்:\n${link}`;
  }
  if (language === "kn") {
    return `ಕ್ಷಮಿಸಿ, ಈ WhatsApp ಖಾತೆ Employer ಸೇವೆಗಳಿಗೆ ಮಾತ್ರ. ಉದ್ಯೋಗ ಹುಡುಕಾಟ, ಅರ್ಜಿ, ಅಥವಾ Job Seeker ಪ್ರೊಫೈಲ್‌ಗೆ Job Seeker ಖಾತೆ ಬಳಸಿ:\n${link}`;
  }
  if (language === "ml") {
    return `ക്ഷമിക്കണം, ഈ WhatsApp അക്കൗണ്ട് Employer സേവനങ്ങൾക്ക് മാത്രം. ജോലി തിരയൽ, അപേക്ഷ, അല്ലെങ്കിൽ Job Seeker പ്രൊഫൈലിന് Job Seeker അക്കൗണ്ട് ഉപയോഗിക്കൂ:\n${link}`;
  }
  return `Sorry, this WhatsApp account is configured for Employer services only. For job searching, applying for jobs, or managing a Job Seeker profile, please use your Job Seeker account:\n${link}`;
}

export function purposeClarifyCopy(language: BotLanguage): string {
  if (language === "te") {
    return "నేను ఉద్యోగం వెతకడంలో లేదా జాబ్ పోస్ట్ చేయడంలో సహాయం చేయగలను. మీకు ఏది కావాలి?";
  }
  if (language === "hi") {
    return "मैं नौकरी खोजने या नौकरी पोस्ट करने में मदद कर सकता हूँ. आपको क्या चाहिए?";
  }
  if (language === "ta") return "வேலை தேடலாம் அல்லது வேலை போஸ்ட் செய்யலாம். எது வேண்டும்?";
  if (language === "kn") return "ಉದ್ಯೋಗ ಹುಡುಕಬಹುದು ಅಥವಾ ಜಾಬ್ ಪೋಸ್ಟ್ ಮಾಡಬಹುದು. ಯಾವುದು ಬೇಕು?";
  if (language === "ml") return "ജോലി തേടാം അല്ലെങ്കിൽ ജോലി പോസ്റ്റ് ചെയ്യാം. ഏതാണ് വേണ്ടത്?";
  return "I can help with either finding a job or posting a job. Which one do you need?";
}

export function employerVerificationCopy(input: {
  language: BotLanguage;
  verification: string;
  name: string;
  profileUrl: string;
  remarks?: string;
}): string {
  const who = input.name.trim() ? ` ${input.name.trim()}` : "";
  const url = input.profileUrl.trim();
  const remarks = String(input.remarks ?? "").trim();
  if (input.verification === "verified") {
    if (input.language === "te") return `మీ company profile verify అయింది${who}. జాబ్స్ పోస్ట్ చేయవచ్చు.`;
    if (input.language === "hi") return `आपकी company प्रोफ़ाइल वेरिफाइड है${who}. नौकरियां पोस्ट कर सकते हैं.`;
    return `Your company profile is verified${who}. You can post jobs.`;
  }
  if (input.verification === "rejected") {
    const reason =
      remarks.length > 0
        ? input.language === "te"
          ? `\nకారణం: ${remarks}`
          : input.language === "hi"
            ? `\nकारण: ${remarks}`
            : `\nReason: ${remarks}`
        : input.language === "te"
          ? "\nకారణం ప్రస్తుతం అందుబాటులో లేదు."
          : input.language === "hi"
            ? "\nकारण अभी उपलब्ध नहीं है."
            : "\nA specific reason is not available right now.";
    if (input.language === "te") {
      return `మీ company profile verification approve కాలేదు.${reason} ప్రొఫైల్ అప్డేట్ చేసి మళ్లీ సమర్పించండి.${url ? `\n👉 ${url}` : ""}`;
    }
    if (input.language === "hi") {
      return `आपकी company प्रोफ़ाइल वेरिफिकेशन स्वीकृत नहीं हुई.${reason} प्रोफ़ाइल अपडेट करें.${url ? `\n👉 ${url}` : ""}`;
    }
    return `Your company profile verification was not approved.${reason} Please update your profile and resubmit.${url ? `\n👉 ${url}` : ""}`;
  }
  if (input.language === "te") {
    return "మీ company profile ప్రస్తుతం pending verification లో ఉంది. Operations verify చేసిన తర్వాత మీరు జాబ్స్ పోస్ట్ చేయవచ్చు.";
  }
  if (input.language === "hi") {
    return "आपकी company प्रोफ़ाइल अभी pending verification में है. वेरिफाई होने के बाद नौकरी पोस्ट कर सकते हैं.";
  }
  return "Your company profile is currently pending verification. Once Operations verifies it, you can post jobs.";
}

export function seekerProfileStatusCopy(input: {
  language: BotLanguage;
  registrationStatus: string;
  whatsappVerified: boolean;
  accountStatus: string;
  name: string;
  role: string;
}): string {
  const who = input.name.trim() ? ` ${input.name.trim()}` : "";
  const blocked = /block|suspend/i.test(input.accountStatus);
  if (blocked) {
    if (input.language === "te") return `మీ Job Seeker account ప్రస్తుతం ${input.accountStatus} స్థితిలో ఉంది.`;
    if (input.language === "hi") return `आपका Job Seeker खाता अभी ${input.accountStatus} है.`;
    return `Your Job Seeker account is currently ${input.accountStatus}.`;
  }
  const registrationDone = input.registrationStatus === "COMPLETED";
  const whatsapp = input.whatsappVerified;
  if (registrationDone && whatsapp) {
    const role = input.role.trim();
    if (input.language === "te") {
      return `మీ Job Seeker profile active గా ఉంది${who}.${role ? ` Role: ${role}.` : ""} WhatsApp verified.`;
    }
    if (input.language === "hi") {
      return `आपकी Job Seeker प्रोफ़ाइल active है${who}.${role ? ` Role: ${role}.` : ""} WhatsApp verified.`;
    }
    return `Your Job Seeker profile is active${who}.${role ? ` Preferred role: ${role}.` : ""} WhatsApp is verified.`;
  }
  if (!whatsapp) {
    if (input.language === "te") {
      return `మీ Job Seeker profile ఇంకా WhatsApp verify కాలేదు${who}. OTP verify చేసి registration పూర్తి చేయండి.`;
    }
    if (input.language === "hi") {
      return `आपकी Job Seeker प्रोफ़ाइल अभी WhatsApp verified नहीं है${who}. OTP पूरा करें.`;
    }
    return `Your Job Seeker profile is not WhatsApp-verified yet${who}. Please complete OTP verification to finish registration.`;
  }
  if (input.language === "te") {
    return `మీ Job Seeker registration ఇంకా incomplete గా ఉంది${who}. Profile పూర్తి చేయండి.`;
  }
  if (input.language === "hi") {
    return `आपका Job Seeker registration अभी incomplete है${who}. प्रोफ़ाइल पूरा करें.`;
  }
  return `Your Job Seeker registration is still incomplete${who}. Please finish your profile on AsliJobs.`;
}

export function postJobGuideCopy(input: {
  language: BotLanguage;
  verification: string;
  name: string;
  role: string;
  location: string;
  postJobUrl: string;
  profileUrl: string;
}): string {
  if (input.verification !== "verified") {
    return employerVerificationCopy({
      language: input.language,
      verification: input.verification,
      name: input.name,
      profileUrl: input.profileUrl,
    });
  }
  const url = input.postJobUrl.trim();
  const role = input.role.trim();
  const location = input.location.trim();
  const mentioned = [role, location].filter(Boolean).join(" — ");
  const detail = mentioned
    ? input.language === "te"
      ? `\n\nమీరు చెప్పింది: ${mentioned}.`
      : input.language === "hi"
        ? `\n\nआपने बताया: ${mentioned}.`
        : `\n\nYou mentioned: ${mentioned}.`
    : "";
  if (input.language === "te") {
    return `సరే 👍 జాబ్ పోస్ట్ చేయడానికి ఈ లింక్ ఓపెన్ చేయండి:\n👉 ${url}${detail}`;
  }
  if (input.language === "hi") {
    return `ज़रूर 👍 नौकरी पोस्ट करने के लिए यह लिंक खोलें:\n👉 ${url}${detail}`;
  }
  return `Sure 👍 Open this link to post a job:\n👉 ${url}${detail}`;
}

export function fallbackCopy(language: BotLanguage): string {
  return clarifyJobTitle(language);
}

export function voiceUnclearCopy(language: BotLanguage): string {
  if (language === "te") {
    return "మీ వాయిస్ మెసేజ్ నాకు స్పష్టంగా అర్థం కాలేదు. దయచేసి మరోసారి చెప్పండి.";
  }
  if (language === "hi") {
    return "मुझे आपका वॉइस मैसेज साफ़ समझ नहीं आया। कृपया दोबारा भेजें।";
  }
  if (language === "ta") {
    return "உங்கள் குரல் செய்தி தெளிவாகப் புரியவில்லை. தயவுசெய்து மீண்டும் சொல்லுங்கள்.";
  }
  if (language === "kn") {
    return "ನಿಮ್ಮ ಧ್ವನಿ ಸಂದೇಶ ಸ್ಪಷ್ಟವಾಗಿ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಹೇಳಿ.";
  }
  if (language === "ml") {
    return "നിങ്ങളുടെ വോയ്സ് സന്ദേശം വ്യക്തമായി മനസ്സിലായില്ല. ദയവായി വീണ്ടും പറയൂ.";
  }
  return "I couldn't understand the voice message clearly. Please try again.";
}

export function unauthorizedCopy(language: BotLanguage, kind: "seeker" | "employer"): string {
  if (kind === "employer") {
    if (language === "te") {
      return "మీ WhatsApp number ఏ employer account కి link కాలేదు. ముందుగా employer account link చేయండి.";
    }
    if (language === "hi") return "यह नंबर किसी employer account से जुड़ा नहीं है. पहले employer account लिंक करें.";
    if (language === "ta") return "இந்த WhatsApp எண் employer கணக்குடன் இணைக்கப்படவில்லை.";
    if (language === "kn") return "ಈ WhatsApp ಸಂಖ್ಯೆ employer ಖಾತೆಗೆ ಲಿಂಕ್ ಆಗಿಲ್ಲ.";
    if (language === "ml") return "ഈ WhatsApp നമ്പർ employer അക്കൗണ്ടുമായി ബന്ധിപ്പിച്ചിട്ടില്ല.";
    return "This WhatsApp number is not linked to an employer account.";
  }
  if (language === "te") {
    return "మీ WhatsApp number తో AsliJobs profile కనిపించలేదు. ముందుగా AsliJobs లో register/login చేయండి.";
  }
  if (language === "hi") return "इस नंबर पर AsliJobs प्रोफाइल नहीं मिली. पहले register/login करें.";
  if (language === "ta") return "இந்த எண்ணில் AsliJobs சுயவிவரம் இல்லை. முதலில் register/login செய்யுங்கள்.";
  if (language === "kn") return "ಈ ಸಂಖ್ಯೆಯಲ್ಲಿ AsliJobs ಪ್ರೊಫೈಲ್ ಕಾಣಿಸಲಿಲ್ಲ. ಮೊದಲು register/login ಮಾಡಿ.";
  if (language === "ml") return "ഈ നമ്പറിൽ AsliJobs പ്രൊഫൈൽ കണ്ടില്ല. ആദ്യം register/login ചെയ്യൂ.";
  return "This WhatsApp number is not linked to an AsliJobs profile. Please register or log in first.";
}

/** Human label for a stored application status; unknown values stay honest. */
export function formatApplicationStatusLabel(status: string): string {
  const key = status.trim().toLowerCase();
  if ((APPLICATION_STATUSES as readonly string[]).includes(key)) {
    return APPLICATION_STATUS_LABELS[key as (typeof APPLICATION_STATUSES)[number]];
  }
  if (!key) return "Unknown";
  return key.replace(/_/g, " ");
}

export function renderApplicationReply(input: {
  language: BotLanguage;
  total: number;
  lines: string[];
  mode: "list" | "count" | "status";
}): string {
  const { language, total, lines, mode } = input;
  if (total === 0) {
    if (language === "te") return "మీ applications ఇప్పుడు లేవు.";
    if (language === "hi") return "अभी कोई आवेदन नहीं मिला.";
    if (language === "ta") return "உங்கள் விண்ணப்பங்கள் இப்போது இல்லை.";
    if (language === "kn") return "ನಿಮ್ಮ ಅರ್ಜಿಗಳು ಈಗ ಇಲ್ಲ.";
    if (language === "ml") return "നിങ്ങളുടെ അപേക്ഷകൾ ഇപ്പോൾ ഇല്ല.";
    return "You do not have applications yet.";
  }
  const head =
    language === "te"
      ? mode === "count"
        ? `మీ దగ్గర ${total} applications ఉన్నాయి.`
        : `మీ ${total} applications:`
      : language === "hi"
        ? mode === "count"
          ? `आपके ${total} आवेदन हैं.`
          : `आपके ${total} आवेदन:`
        : mode === "count"
          ? `You have ${total} applications.`
          : `Your ${total} applications:`;
  if (mode === "count") return head;
  return `${head}\n${lines.join("\n")}`;
}

export function renderCoverageReply(input: {
  language: BotLanguage;
  applied: number;
  compared: number;
  matched: number;
  totalListed: number;
  bounded: boolean;
}): string {
  const missing = Math.max(input.compared - input.matched, 0);
  if (input.bounded) {
    if (input.language === "te") {
      return `చూసిన ${input.compared} ఉద్యోగాల్లో మీరు ${input.matched} కి apply చేశారు. మొత్తం applications ${input.applied}. అన్ని ఉద్యోగాలను ఈ చాట్‌లో పూర్తిగా సరిపోల్చలేను.`;
    }
    return `Of the ${input.compared} jobs I checked, you applied to ${input.matched}. Your applications: ${input.applied}. I cannot confirm every job on the site from this chat.`;
  }
  if (input.language === "te") {
    return `మీరు ${input.totalListed} ఉద్యోగాల్లో ${input.matched} ఉద్యోగాలకు apply చేశారు. మిగిలిన ${missing} ఉద్యోగాలకు ఇంకా apply చేయలేదు.`;
  }
  if (input.language === "hi") {
    return `आपने ${input.totalListed} नौकरियों में से ${input.matched} पर आवेदन किया है. बाकी ${missing} पर अभी आवेदन नहीं है.`;
  }
  return `You applied to ${input.matched} of ${input.totalListed} jobs. ${missing} are still not applied.`;
}

export function renderEmployerReply(input: {
  language: BotLanguage;
  lines: string[];
  totalApplications: number;
  mode: "jobs" | "count" | "status";
}): string {
  if (input.lines.length === 0) {
    if (input.language === "te") return "మీరు ఇంకా జాబ్స్ పోస్ట్ చేయలేదు.";
    if (input.language === "hi") return "आपने अभी कोई नौकरी पोस्ट नहीं की.";
    return "You have no posted jobs yet.";
  }
  if (input.mode === "count") {
    if (input.language === "te") {
      return `మీ జాబ్స్‌కు ${input.totalApplications} applications వచ్చాయి.\n${input.lines.join("\n")}`;
    }
    if (input.language === "hi") {
      return `आपकी नौकरियों पर ${input.totalApplications} आवेदन आए हैं.\n${input.lines.join("\n")}`;
    }
    return `Applications on your jobs: ${input.totalApplications}\n${input.lines.join("\n")}`;
  }
  if (input.language === "te") return `మీ జాబ్స్:\n${input.lines.join("\n")}`;
  if (input.language === "hi") return `आपकी नौकरियां:\n${input.lines.join("\n")}`;
  return `Your jobs:\n${input.lines.join("\n")}`;
}

function regionalLead(
  language: BotLanguage,
  kind: "found" | "widen" | "empty" | "more",
  place: string,
  role: string,
  extra: string,
): string {
  if (language === "ta") {
    if (kind === "found") return `${place ? `${place}ல் ` : ""}${extra} ${role} வேலைகள் உள்ளன.`;
    if (kind === "widen") return `${place}ல் ${role} வேலை இல்லை. ${extra}ல் இவை உள்ளன:`;
    if (kind === "empty") return `${place || "இந்த இடம்"}ல் ${role} வேலை கிடைக்கவில்லை.`;
    return "மேலும் வேலைகள் வேண்டுமானால் சொல்லுங்கள்.";
  }
  if (language === "kn") {
    if (kind === "found") return `${place ? `${place}ನಲ್ಲಿ ` : ""}${extra} ${role} ಕೆಲಸಗಳಿವೆ.`;
    if (kind === "widen") return `${place}ನಲ್ಲಿ ${role} ಕೆಲಸ ಇಲ್ಲ. ${extra}ನಲ್ಲಿ ಇವು ಇವೆ:`;
    if (kind === "empty") return `${place || "ಈ ಸ್ಥಳ"}ದಲ್ಲಿ ${role} ಕೆಲಸ ಸಿಗಲಿಲ್ಲ.`;
    return "ಇನ್ನಷ್ಟು ಕೆಲಸ ಬೇಕಾದರೆ ಹೇಳಿ.";
  }
  if (kind === "found") return `${place ? `${place}ൽ ` : ""}${extra} ${role} ജോലികൾ ഉണ്ട്.`;
  if (kind === "widen") return `${place}ൽ ${role} ജോലി കണ്ടില്ല. ${extra}ൽ ഇവ ഉണ്ട്:`;
  if (kind === "empty") return `${place || "ഈ സ്ഥലം"}ത്ത് ${role} ജോലി കണ്ടില്ല.`;
  return "കൂടുതൽ ജോലികൾ വേണമെങ്കിൽ പറയൂ.";
}

export function formatSalaryLabel(job: {
  fixedSalary?: number | null;
  minimumSalary?: number | null;
  maximumSalary?: number | null;
}): string {
  const fixed = numberOrNull(job.fixedSalary);
  const min = numberOrNull(job.minimumSalary);
  const max = numberOrNull(job.maximumSalary);
  if (min != null && max != null) return `${inr(min)}–${inr(max)}`;
  if (fixed != null) return inr(fixed);
  if (min != null) return inr(min);
  if (max != null) return inr(max);
  return "";
}

const PLACE_MISSPELLINGS: Record<string, string> = {
  hyderbad: "Hyderabad",
  hydrabad: "Hyderabad",
  bangalor: "Bangalore",
};

/** Short forms matched on a word boundary so "hyd" does not fire inside "Hyderabad". */
const SHORT_PLACES: Array<{ canonical: string; pattern: RegExp }> = [
  { canonical: "Hyderabad", pattern: /(^|[^a-z])hyd(?![a-z])/gi },
  { canonical: "Bangalore", pattern: /(^|[^a-z])blr(?![a-z])/gi },
  { canonical: "Secunderabad", pattern: /(^|[^a-z])secbad(?![a-z])/gi },
];

function placeHitsIn(text: string): Array<{ canonical: string; index: number }> {
  const folded = text.toLowerCase();
  const hits: Array<{ canonical: string; index: number }> = [];
  for (const place of PLACES) {
    for (const form of place.forms) {
      const idx = folded.indexOf(form.toLowerCase());
      if (idx >= 0) hits.push({ canonical: place.canonical, index: idx });
    }
  }
  for (const [form, canonical] of Object.entries(PLACE_MISSPELLINGS)) {
    const idx = folded.indexOf(form);
    if (idx >= 0 && canonical) hits.push({ canonical, index: idx });
  }
  for (const place of SHORT_PLACES) {
    place.pattern.lastIndex = 0;
    const match = place.pattern.exec(folded);
    if (match?.[1] != null) {
      hits.push({ canonical: place.canonical, index: match.index + match[1].length });
    }
  }
  hits.sort((a, b) => a.index - b.index || a.canonical.localeCompare(b.canonical));
  return hits;
}

function firstDistinctPlace(text: string): string {
  const ordered: string[] = [];
  for (const hit of placeHitsIn(text)) {
    if (ordered[ordered.length - 1] !== hit.canonical) ordered.push(hit.canonical);
  }
  return ordered[0] ?? "";
}

function lastDistinctPlace(text: string): string {
  const ordered: string[] = [];
  for (const hit of placeHitsIn(text)) {
    if (ordered[ordered.length - 1] !== hit.canonical) ordered.push(hit.canonical);
  }
  return ordered[ordered.length - 1] ?? ordered[0] ?? "";
}

function extractPlace(text: string): string {
  // "Chennai instead of Hyderabad" → Chennai (city before the cue).
  const insteadOf = text.match(/^(.+?)\binstead\s+of\b/i);
  if (insteadOf?.[1]) {
    const before = firstDistinctPlace(insteadOf[1]);
    if (before) return before;
  }
  // "rather than Hyderabad show Chennai" → last city after the cue.
  const ratherThan = text.match(/\brather\s+than\b(.+)$/i);
  if (ratherThan?.[1]) {
    const after = lastDistinctPlace(ratherThan[1]);
    if (after) return after;
  }
  // Telugu: "Hyderabad badhulu Vijayawada" → city after the cue.
  const teluguSwap = text.match(/\b(?:badhulu|badulu)\b(.+)$/i);
  if (teluguSwap?.[1]) {
    const after = firstDistinctPlace(teluguSwap[1]);
    if (after) return after;
  }
  const changeTo = text.match(
    /(?:change\s+(?:location\s+)?to|location\s+(?:change\s+)?to)\s+(.+)$/i,
  );
  if (changeTo?.[1]) {
    const target = firstDistinctPlace(changeTo[1]);
    if (target) return target;
  }
  if (/\b(?:ki\s+marchu|\bmarchu\b)\b/i.test(text)) {
    const target = firstDistinctPlace(text);
    if (target) return target;
  }
  const hit = firstDistinctPlace(text);
  if (hit) return hit;
  const fuzzy = fuzzyKnownPlace(text);
  if (fuzzy) return fuzzy;
  const dynamic = matchCatalogCityInText(text);
  if (dynamic) return dynamic;
  return extractIndianState(text);
}

const PLACE_FUZZY_SKIP = new Set(["driver", "jobs", "job", "jobs", "electrician", "plumber", "helper"]);

function fuzzyKnownPlace(text: string): string {
  const tokens = text.toLowerCase().match(/[a-z]{5,}/g) ?? [];
  const names = knownPlaceNames();
  for (const token of tokens) {
    if (PLACE_FUZZY_SKIP.has(token)) continue;
    const found = closestSupportedLabel(token, names, 0.88);
    if (found) return found;
  }
  return "";
}

function hasLocationChangeCue(text: string): boolean {
  return /\binstead\s+of\b|\brather\s+than\b|\b(?:badhulu|badulu)\b|change\s+(?:location\s+)?to|\bki\s+marchu\b|\bmarchu\b/i.test(
    text,
  );
}

/** Two known cities in one message, unless one is a locality of the other or the user named a swap. */
export function competingPlaces(text: string): string[] {
  if (hasLocationChangeCue(text)) return [];
  const ordered: string[] = [];
  for (const hit of placeHitsIn(text)) {
    if (!ordered.includes(hit.canonical)) ordered.push(hit.canonical);
  }
  if (ordered.length < 2) return [];
  if (ordered.length === 2) {
    const [first, second] = ordered;
    if (first && second && (parentCity(first) === second || parentCity(second) === first)) return [];
  }
  return ordered.slice(0, 3);
}

/** Latin role tokens must be whole words so "driver" does not match "screwdriver". */
function titleContainsRoleForm(title: string, form: string): boolean {
  const needle = form.trim().toLowerCase();
  if (!needle) return false;
  if (/[^\x00-\x7f]/.test(needle)) {
    return title.toLowerCase().includes(needle);
  }
  // "electrical" is an Electrician cue, not Electrical Engineer.
  if (needle === "electrical" && /\belectrical\s+engineer\b/i.test(title)) {
    return false;
  }
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i").test(title);
}

export function matchesRequestedRole(title: string, role: string): boolean {
  const requested = role.trim();
  if (!requested) return true;
  const canonical = extractRole(requested) || requested;
  const forms = ROLES.find((item) => item.canonical === canonical)?.forms ?? [canonical];
  return forms.some((form) => titleContainsRoleForm(title, form));
}

function extractRole(text: string): string {
  const folded = text.toLowerCase();
  let best = "";
  let bestLen = 0;
  for (const role of ROLES) {
    for (const form of role.forms) {
      const needle = form.toLowerCase();
      if (needle.length > bestLen && folded.includes(needle)) {
        best = role.canonical;
        bestLen = needle.length;
      }
    }
  }
  const free = extractFreeJobTitle(text, (phrase) => extractPlace(phrase) !== "");
  if (
    best === "Software Developer" &&
    free &&
    free.trim().split(/\s+/).length > 1 &&
    /\bdeveloper\b/i.test(free) &&
    !/\b(?:software|web|programmer)\b/i.test(free)
  ) {
    return free;
  }
  let picked = "";
  if (best) picked = alignKnownRole(best, text);
  else if (free) {
    const spelled = correctRoleSpelling(free);
    picked = spelled ? alignKnownRole(spelled, text) : matchCatalogRole(free) || free;
  } else {
    picked = matchCatalogRole(text);
  }
  if (roleIsShiftOnly(picked)) return "";
  return picked;
}

function roleIsShiftOnly(value: string): boolean {
  if (!value || !mentionsNightShift(value)) return false;
  const rest = value.replace(NIGHT_SHIFT, " ").replace(/[^a-zA-Z]+/g, " ").trim();
  return rest.length === 0;
}

export function knownPlaceNames(): string[] {
  return PLACES.map((place) => place.canonical);
}

export function knownRoleNames(): string[] {
  return ROLES.map((role) => role.canonical);
}

/** High-confidence spelling fix against known roles. Empty when unsure. */
export function correctRoleSpelling(token: string): string {
  const decision = acceptRankedLabel(rankLabels(token, knownRoleNames()), 0.9);
  if (!decision.label || decision.options.length > 0) return "";
  return withinOneEdit(token, decision.label) ? decision.label : "";
}

/** High-confidence spelling fix against known cities. Empty when two cities are close. */
export function correctCitySpelling(token: string): string {
  return acceptRankedLabel(rankLabels(token, knownPlaceNames()), 0.88).label;
}

export function ambiguousCitySpellings(token: string): string[] {
  return acceptRankedLabel(rankLabels(token, knownPlaceNames()), 0.88).options;
}

function normalizePlace(value: string): string {
  return value ? extractPlace(value) || value : "";
}

function normalizeRole(value: string): string {
  return value ? extractRole(value) || value : "";
}

function mentionsJobWord(text: string): boolean {
  // Brand name contains the letters "job" but is not a job-search cue.
  const scrubbed = text.replace(/\baslijobs\b/gi, " ");
  if (/\bjobs?\b/i.test(scrubbed)) return true;
  for (const word of JOB_WORDS) {
    if (/^[a-z]+$/i.test(word)) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp("\\b" + escaped + "\\b", "i").test(scrubbed)) return true;
    } else if (scrubbed.toLowerCase().includes(word.toLowerCase())) {
      return true;
    }
  }
  return false;
}

export function looksLikeAboutAsliJobs(text: string): boolean {
  return /what\s+is\s+aslijobs|about\s+aslijobs|how\s+(?:does|do)\s+aslijobs\s+work|aslijobs\s+(?:ante|అంటే|क्या\s+है|என்ன|ಏನು|എന്താണ്)|aslijobs\s+గురించి|(?:need|have)\s+to\s+download\s+(?:an?\s+)?app|download\s+(?:an?\s+)?app\??$/i.test(
    text,
  );
}

export function looksLikeHowAsliJobsWorks(text: string): boolean {
  return /how\s+(?:does|do)\s+aslijobs\s+work|aslijobs\s+(?:ela|epdi|kaise|hege|engane).{0,12}work|aslijobs\s+work\s+(?:ela|epdi|kaise)|aslijobs\s+(?:ఎలా|कैसे|எப்படி|ಹೇಗೆ|എങ്ങనെ)\s*(?:work|పని|काम)?/i.test(
    text,
  );
}

export function looksLikeAppDownloadQuestion(text: string): boolean {
  return /(?:need|have)\s+to\s+download\s+(?:an?\s+)?app|download\s+(?:an?\s+)?app|app\s+download\s*(?:avala|కావాలా|चाहिए)?|any\s+app\s+needed/i.test(
    text,
  );
}

export function looksLikeHowToFindJobs(text: string): boolean {
  return /how\s+(?:do\s+i\s+|to\s+|can\s+i\s+)?find\s+(?:a\s+)?jobs?|jobs?\s+ela\s+kanukko|నౌకరీ\s+ఎలా|नौकरी\s+कैसे\s+(?:ढूंढ|पता)/i.test(
    text,
  );
}

export function looksLikeHowToRegister(text: string): boolean {
  return /how\s+(?:do\s+i\s+|to\s+|can\s+i\s+)?register|sign\s*up|create\s+(?:an?\s+)?account|account\s+ela\s+create|రిజిస్టర్\s+ఎలా|रजिस्टर\s+कैसे|register\s+ఎలా|job\s*seeker\s+registration|job\s*seeker\s+register/i.test(
    text,
  );
}

export function looksLikeContactEmployerGuide(text: string): boolean {
  return /how\s+(?:do\s+i\s+|to\s+|can\s+i\s+)?contact\s+(?:the\s+)?employer|employer\s+(?:number|phone|contact|details)|contact\s+(?:the\s+)?recruiter|employer\s+ni\s+contact/i.test(
    text,
  );
}

export function looksLikeHowToPostJobGuide(text: string): boolean {
  // How-to / guide explanations use documentation. Imperative hire CTAs
  // ("I want to post a job", "Post a job") stay POST_JOB via looksLikePostJobRequest.
  if (
    /employer\s+guide|job\s+posting\s+process|how\s+(?:do\s+(?:i|we|employers)\s+|can\s+(?:i|we)\s+|to\s+)?post\s+(?:a\s+)?jobs?|how\s+(?:do\s+(?:i|we)\s+|can\s+(?:i|we)\s+|to\s+)?publish\s+(?:a\s+)?jobs?/i.test(
      text,
    )
  ) {
    return true;
  }
  return /(?:job|jobs?|employer).{0,40}(?:ela|epdi|kaise|hege|engane|ఎలా|कैसे|எப்படி|ಹೇಗೆ|എങ്ങനെ).{0,24}(?:post|publish)|(?:ela|epdi|kaise|hege|engane|ఎలా|कैसे|எப்படி|ಹೇಗೆ|എങ്ങനെ).{0,24}(?:post|publish).{0,24}(?:job|jobs?)|aslijobs.{0,48}(?:post|publish).{0,24}(?:job|jobs?).{0,24}(?:ela|epdi|kaise|hege|engane|ఎలా|कैसे|எப்படி|ಹೇಗೆ|എങ്ങനെ)|aslijobs.{0,48}(?:ela|epdi|kaise|hege|engane|ఎలా|कैसे|எப்படி|ಹೇಗೆ|എങ്ങനെ).{0,24}(?:post|publish)/i.test(
    text,
  );
}

export function looksLikePricingQuestion(text: string): boolean {
  return /pricing|price\s*plans?|subscription\s*plans?|hiring\s*plans?|employer\s+pricing|plans?\s*(?:enti|ఏంటి|क्या|enna|ಏನು|എന്ത്)|plan\s*(?:entha|ఎంత|कितना)|प्राइसिंग|விலை\s*திட்ட|ಬೆಲೆ\s*ಯೋಜನ|വില\s*പദ്ധതി|employer\s+services?\s+(?:free|paid)|(?:free|paid)\s+(?:or\s+)?(?:paid|free).{0,24}employer|is\s+(?:job\s+)?posting\s+free|how\s+much\s+(?:does\s+)?(?:job\s+)?posting\s+cost|job\s+posting\s+cost|posting\s+(?:a\s+)?job\s+cost/i.test(
    text,
  );
}

export function looksLikeJobCategoriesQuestion(text: string): boolean {
  return /which\s+job\s+categor(?:y|ies)|job\s+categor(?:y|ies)\s+(?:are\s+)?available|available\s+job\s+categor|(?:what|which)\s+categor(?:y|ies).{0,24}(?:job|aslijobs)|aslijobs.{0,40}categor/i.test(
    text,
  );
}

export function looksLikePublicContactQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (/^(phone|email|support|contact|call|mobile|number|helpline)\s*[?!.]*$/i.test(trimmed)) {
    return true;
  }
  return /(?:support|contact|aslijobs).{0,24}(?:phone|email|number|call|mobile)|(?:phone|email|number|call|mobile).{0,24}(?:support|contact|aslijobs)|how\s+(?:do\s+i\s+|can\s+i\s+|to\s+)?contact\s+aslijobs|aslijobs\s+(?:phone|email|number|helpline)/i.test(
    trimmed,
  );
}

/** Employer documentation / pricing / free-vs-paid — not an action to hire. */
export function looksLikeEmployerInformationQuestion(text: string): boolean {
  if (looksLikePricingQuestion(text)) return true;
  if (looksLikeHowToPostJobGuide(text)) return true;
  if (/employer\s+guide|employer\s+services?|are\s+employer|is\s+employer|employer.{0,40}(?:free|paid|pricing|cost|plan)/i.test(text)) {
    return true;
  }
  if (/is\s+(?:job\s+)?posting\s+free|how\s+much.{0,40}post(?:ing)?\s+(?:a\s+)?job|job\s+posting\s+(?:free|cost|price|paid)/i.test(text)) {
    return true;
  }
  return false;
}

export function looksLikePolicyQuestion(text: string): boolean {
  return /privacy\s*policy|terms?\s*(?:and|&)?\s*conditions?|guidelines?|గోప్యత|प्राइवेसी|தனியுரிமை|ಗೌಪ್ಯತೆ|സ്വകാര്യത|terms\s+explain|privacy\s+explain/i.test(
    text,
  );
}

export function looksLikeApplicantsWhereGuide(text: string): boolean {
  return /(?:applicants?|applications?|candidates?).{0,24}(?:ekkada|where|எங்க|ಎಲ್ಲಿ|എവിടെ|कहाँ|ఎక్కడ)|(?:ekkada|where|ఎక్కడ).{0,24}(?:applicants?|applications?|candidates?)|dashboard.{0,32}(?:applicants?|applications?|candidates?)|na\s+applicants/i.test(
    text,
  );
}

/**
 * Official website / platform documentation questions.
 * Must not steal concrete job-search turns (role+city) or private account counts.
 */
export function looksLikePlatformKnowledge(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  // Concrete job hunt with a place stays JOB_SEARCH even if wording mentions AsliJobs.
  const hasPlace =
    Boolean(extractPlace(trimmed)) ||
    /\b(hyderabad|chennai|bangalore|bengaluru|mumbai|delhi|pune|vizag|vijayawada)\b/i.test(
      trimmed,
    );
  if (hasPlace && mentionsJobWord(trimmed) && !looksLikeAboutAsliJobs(trimmed)) {
    return false;
  }
  if (looksLikeAboutAsliJobs(trimmed)) return true;
  if (looksLikeHowAsliJobsWorks(trimmed)) return true;
  if (looksLikeAppDownloadQuestion(trimmed)) return true;
  if (looksLikeHowToFindJobs(trimmed)) return true;
  if (/interview\s+tips?|salary\s+guide|career\s+advice|help\s+center/i.test(trimmed)) return true;
  if (looksLikeHowToRegister(trimmed)) return true;
  if (looksLikeContactEmployerGuide(trimmed)) return true;
  if (looksLikePublicContactQuestion(trimmed)) return true;
  if (looksLikeJobCategoriesQuestion(trimmed)) return true;
  if (looksLikeEmployerInformationQuestion(trimmed)) return true;
  if (looksLikeHowToPostJobGuide(trimmed)) return true;
  if (looksLikePricingQuestion(trimmed)) return true;
  if (looksLikePolicyQuestion(trimmed)) return true;
  if (looksLikeApplicantsWhereGuide(trimmed)) return true;
  if (
    /(?:help\s*center|faqs?|contact\s+us|contact\s+support|aslijobs\s+support|whatsapp\s+support)/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  if (
    /aslijobs.{0,40}(?:ela|epdi|kaise|hege|engane|ఎలా|कैसे|எப்படி|ಹೇಗೆ|എങ്ങനെ)/i.test(trimmed) &&
    !hasPlace
  ) {
    return true;
  }
  return false;
}


function includesAny(text: string, words: string[]): boolean {
  const folded = text.toLowerCase();
  return words.some((word) => folded.includes(word.toLowerCase()));
}

function labelPlace(place: string, language: BotLanguage): string {
  if (!place) return "";
  if (language === "te") return TE_PLACE[place] ?? place;
  if (language === "hi") return HI_PLACE[place] ?? place;
  return place;
}

function localizeJobTitle(title: string, language: BotLanguage): string {
  if (language === "en") return title;
  const role = extractRole(title);
  if (!role) return title;
  const localized = labelRole(role, language);
  if (title.trim().toLowerCase() === role.toLowerCase()) return localized;
  return `${localized} (${title})`;
}

function labelRole(role: string, language: BotLanguage): string {
  if (!role) return language === "te" ? "జాబ్" : language === "hi" ? "नौकरी" : "job";
  if (language === "te") return TE_ROLE[role] ?? role;
  if (language === "hi") return HI_ROLE[role] ?? role;
  return role.toLowerCase();
}

function cleanSlot(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

function numberOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function inr(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}
