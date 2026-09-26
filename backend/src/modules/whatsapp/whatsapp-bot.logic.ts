import { z } from "zod";

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
  focus: "" | "salary" | "company";
};

export type PublicJobFact = {
  jobTitle: string;
  companyName: string;
  cityName: string;
  stateName: string;
  jobId: string;
  salaryLabel: string;
};

const TELUGU_SCRIPT = /[\u0C00-\u0C7F]/;
const HINDI_SCRIPT = /[\u0900-\u097F]/;
const TAMIL_SCRIPT = /[\u0B80-\u0BFF]/;
const KANNADA_SCRIPT = /[\u0C80-\u0CFF]/;
const MALAYALAM_SCRIPT = /[\u0D00-\u0D7F]/;

const ROMAN_TELUGU =
  /\b(undha|unda|vundha|vunda|unnaya|unnayi|unnai|kavali|kaavali|cheppu|cheppandi|chudandi|chupinchu|naaku|nenu|enni|vachayi|chesina|pani)\b|\blo\b/i;
const ROMAN_HINDI = /\b(kya|hai|hain|mujhe|chahiye|dikhao|naukri|mereko|mein)\b/i;
const ROMAN_TAMIL = /\b(venum|venam|irukka|irukku|enakku|velai)\b/i;
const ROMAN_KANNADA = /\b(beku|ideya|nanage|kelasa)\b/i;
const ROMAN_MALAYALAM = /\b(venam|undo|enikku|joli)\b/i;

const PLACES: Array<{ canonical: string; forms: string[] }> = [
  { canonical: "Madhapur", forms: ["madhapur", "మాధాపూర్", "మాదాపూర్", "माधापुर"] },
  { canonical: "Gachibowli", forms: ["gachibowli", "గచ్చిబౌలి", "गच्चीबोवली"] },
  { canonical: "Kukatpally", forms: ["kukatpally", "kukatpalli", "కూకట్‌పల్లి", "కూకట్పల్లి", "కూకట్‌పల్లి"] },
  { canonical: "Hyderabad", forms: ["hyderabad", "హైదరాబాద్", "హైదరాబాదు", "हैदराबाद", "ஹைதராபாத்", "ஹைதராபாத்தில்", "ಹೈದರಾಬಾದ್", "ಹೈದರಾಬಾದ್‌ನಲ್ಲಿ", "ഹൈദരാബാദ്", "ഹൈദരാബാദിൽ"] },
  { canonical: "Secunderabad", forms: ["secunderabad", "సికింద్రాబాద్", "सिकंदराबाद"] },
  { canonical: "Bangalore", forms: ["bangalore", "bengaluru", "బెంగళూరు", "बैंगलोर"] },
  { canonical: "Chennai", forms: ["chennai", "చెన్నై", "चेन्नई"] },
  { canonical: "Mumbai", forms: ["mumbai", "ముంబై", "मुंबई"] },
  { canonical: "Delhi", forms: ["delhi", "ఢిల్లీ", "दिल्ली"] },
  { canonical: "Pune", forms: ["pune", "పూణె", "पुणे"] },
  { canonical: "Vijayawada", forms: ["vijayawada", "విజయవాడ"] },
  { canonical: "Visakhapatnam", forms: ["visakhapatnam", "vizag", "విశాఖపట్నం"] },
  { canonical: "Warangal", forms: ["warangal", "వరంగల్"] },
];

const ROLES: Array<{ canonical: string; forms: string[] }> = [
  { canonical: "Driver", forms: ["driver", "డ్రైవర్", "డ్రైవరు", "ड्राइवर", "டிரைவர்", "ಡ್ರೈವರ್", "ഡ്രൈവർ"] },
  { canonical: "Delivery", forms: ["delivery", "డెలివరీ", "డెలివరి", "डिलीवरी"] },
  { canonical: "Watchman", forms: ["watchman", "security", "వాచ్‌మన్", "వాచ్మన్", "वॉचमैन"] },
  { canonical: "Electrician", forms: ["electrician", "electrical", "ఎలక్ట్రీషియన్", "इलेक्ट्रीशियन", "எலக்ட்ரீஷியன்"] },
  { canonical: "Carpenter", forms: ["carpenter", "కార్పెంటర్", "कारपेंटर"] },
  { canonical: "Plumber", forms: ["plumber", "ప్లంబర్", "प्लंबर"] },
  { canonical: "Cook", forms: ["cook", "వంటవాడు", "रसोइया"] },
  { canonical: "Sales", forms: ["sales", "సేల్స్", "सेल्स"] },
];

const JOB_WORDS = [
  "job",
  "jobs",
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
];

const REQUEST_WORDS = [
  "undha",
  "unda",
  "vundha",
  "vunda",
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
];

const TE_PLACE: Record<string, string> = {
  Madhapur: "మాధాపూర్",
  Gachibowli: "గచ్చిబౌలి",
  Kukatpally: "కూకట్‌పల్లి",
  Hyderabad: "హైదరాబాద్",
  Secunderabad: "సికింద్రాబాద్",
};
const HI_PLACE: Record<string, string> = {
  Madhapur: "माधापुर",
  Hyderabad: "हैदराबाद",
  Gachibowli: "गच्चीबोवली",
  Kukatpally: "कुकटपल्ली",
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

const CITY_LEVEL = new Set([
  "Hyderabad",
  "Secunderabad",
  "Bangalore",
  "Chennai",
  "Mumbai",
  "Delhi",
  "Pune",
  "Vijayawada",
  "Visakhapatnam",
  "Warangal",
]);

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

export function detectLanguage(
  text: string,
  previous?: BotLanguage | null,
  hint?: BotLanguage | null,
): BotLanguage {
  if (TAMIL_SCRIPT.test(text) || ROMAN_TAMIL.test(text)) return "ta";
  if (KANNADA_SCRIPT.test(text) || ROMAN_KANNADA.test(text)) return "kn";
  if (MALAYALAM_SCRIPT.test(text) || ROMAN_MALAYALAM.test(text)) return "ml";
  if (TELUGU_SCRIPT.test(text) || ROMAN_TELUGU.test(text)) return "te";
  if (HINDI_SCRIPT.test(text) || ROMAN_HINDI.test(text)) return "hi";
  const trimmed = text.trim();
  const clearEnglish = /\b(i want|i need|hello|please|are there|show me)\b/i.test(trimmed);
  if (clearEnglish) return "en";
  if (hint && hint !== "en") return hint;
  if (previous && previous !== "en" && trimmed.length > 0 && trimmed.length < 40) {
    return previous;
  }
  return "en";
}

export function nationalPhone(from: string): string {
  const digits = from.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export type ProtocolTurn = "greeting" | "thanks" | "ack";

/** Whole-message protocol only. Never used to classify jobs or applications. */
export function detectProtocolTurn(text: string): ProtocolTurn | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 24) return null;
  if (
    /^(hi|hello|hey|hy|హాయ్|హలో|నమస్తే|नमस्ते|हाय|வணக்கம்|ನಮಸ್ಕಾರ|നമസ്കാരം)!?$/i.test(
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
  if (/^(ok|okay|oke|bye|goodbye|సరే|ठीक|सही|சரி|ಸರಿ|ശരി|బై)\.?$/i.test(trimmed)) {
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
    intent === "EMPLOYER_APPLICATION_COUNT"
  ) {
    return "OWN_EMPLOYER_DATA";
  }
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

export function understandLocally(
  text: string,
  previous?: BotLanguage | null,
  hint?: BotLanguage | null,
): BotUnderstanding {
  const language = detectLanguage(text, previous, hint);
  const folded = text.toLowerCase();
  const location = extractPlace(text);
  const category = extractRole(text);
  const mentionsJob = includesAny(text, JOB_WORDS) || /\bjobs?\b/i.test(folded);
  const mentionsRequest = includesAny(text, REQUEST_WORDS);
  const ownApply =
    /apply|applied|అప్లై|చేశా|applications?|అప్లికేషన్|आवेदन/i.test(text);
  const profile =
    /profile|ప్రొఫైల్|సరిపోయే|प्रोफाइल|प्रोफ़ाइल|suitable/i.test(text) &&
    (mentionsJob || mentionsRequest || /jobs?/i.test(folded) || ownApply);
  const applications = ownApply;
  const myPosted = looksLikeOwnPostedJobsQuestion(text);
  const employer =
    myPosted ||
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
    !/\b(jobs?|kavali|chahiye|want)\b/i.test(folded);
  const companyAsk =
    /company|కంపెనీ|कंपनी|நிறுவனம்/i.test(text) && !category && text.trim().length < 60;

  let intent: BotIntent = "UNKNOWN";
  if (unrelated) intent = "UNRELATED";
  else if (/^(help|సహాయం|मदद)\b|what can you do/i.test(text.trim())) intent = "HELP";
  else if (greeting && text.trim().length < 20 && !mentionsJob && !ownApply) intent = "GREETING";
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
  } else if (applications) {
    intent = /status|స్టేటస్|స్టేజ్|स्थिति|நிலை/i.test(text)
      ? "APPLICATION_STATUS"
      : /ఎన్ని|how many|कितनी|எத்தனை|ಎಷ್ಟು|എത്ര/i.test(text)
        ? "APPLICATION_COUNT"
        : "MY_APPLICATIONS";
  } else if (/how (do|to) i apply|apply cheyya|apply kaise/i.test(folded)) {
    intent = "HOW_TO_APPLY";
  } else if (/my skills|skills unnayi|నైపుణ్యాలు/i.test(text)) intent = "MY_SKILLS";
  else if (salaryAsk || companyAsk) intent = "JOB_DETAILS";
  else if (
    category ||
    mentionsJob ||
    (location && mentionsRequest) ||
    /\b(search cheyyi|job kavali|jobs unnaya)\b/i.test(folded)
  ) {
    intent = "JOB_SEARCH";
  } else if (location && text.trim().length < 40) {
    intent = "JOB_SEARCH";
  }

  const openSearch = intent === "JOB_SEARCH" && !category && (mentionsJob || mentionsRequest);
  const scope = scopeForIntent(intent);

  return {
    intent,
    language,
    location,
    category,
    jobQuery: category,
    openSearch,
    scope,
    requiresAuth: scope === "OWN_DATA" || scope === "OWN_EMPLOYER_DATA",
    confidence: intent === "UNKNOWN" ? 0.35 : intent === "CLARIFY" ? 0.7 : 0.94,
    focus: companyAsk ? "company" : salaryAsk ? "salary" : "",
  };
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

function resolveLanguage(
  text: string,
  aiLanguage: BotLanguage,
  previous?: BotLanguage | null,
  hint?: BotLanguage | null,
): BotLanguage {
  if (TAMIL_SCRIPT.test(text)) return "ta";
  if (KANNADA_SCRIPT.test(text)) return "kn";
  if (MALAYALAM_SCRIPT.test(text)) return "ml";
  if (TELUGU_SCRIPT.test(text)) return "te";
  if (HINDI_SCRIPT.test(text)) return "hi";
  if (aiLanguage !== "en") return aiLanguage;
  return detectLanguage(text, previous, hint);
}

/** Website page size is 20; WhatsApp fetches one public page then compacts for Sarvam. */
export const PUBLIC_JOB_FETCH_LIMIT = 20;
/** Compact verified jobs sent to Sarvam. Never used as the database match total. */
export const JOBS_FOR_AI_LIMIT = 8;

const JOB_SEARCH_INTENTS = new Set<BotIntent>(["JOB_SEARCH", "JOB_COUNT", "JOB_DETAILS"]);

export function looksLikeOwnPostedJobsQuestion(text: string): boolean {
  const seekerApply = /apply\s*ches|apply\s*chey|applied|అప్లై|చేశా/i.test(text);
  if (seekerApply) return false;
  return /post\s*chesina|nenu\s+post|i posted|my posted|na posted|posted jobs?|which jobs did i post|\bna jobs\b|నా\s*jobs|\bmy jobs\b|నా posted|పోస్ట్/i.test(
    text,
  );
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
  if (looksLikeOwnPostedJobsQuestion(text) && JOB_SEARCH_INTENTS.has(understanding.intent)) {
    return {
      ...understanding,
      intent: "EMPLOYER_JOBS",
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

export function mergePending(
  previous: { location: string; category: string } | null,
  next: BotUnderstanding,
  text = "",
): BotUnderstanding {
  if (!previous) return next;
  if (isPrivateIntent(next.intent) || next.intent === "GREETING" || next.intent === "HELP" || next.intent === "UNRELATED" || next.intent === "HOW_TO_APPLY" || next.intent === "CLARIFY") {
    return {
      ...next,
      location: next.location,
      category: next.category,
      jobQuery: next.category,
      openSearch: false,
    };
  }

  if (next.intent === "UNKNOWN") {
    if (!isFollowUpFragment(text)) {
      return next;
    }
    const location = next.location || previous.location;
    const category = next.category || previous.category;
    return {
      ...next,
      location,
      category,
      jobQuery: category,
      intent: "JOB_SEARCH",
      openSearch: !category,
      scope: "PUBLIC_JOBS",
    };
  }

  if (!JOB_SEARCH_INTENTS.has(next.intent)) {
    return next;
  }

  const location = next.location || previous.location;
  const category = next.openSearch && next.location && !next.category ? "" : next.category || previous.category;
  return {
    ...next,
    location,
    category,
    jobQuery: category,
    openSearch: next.openSearch && !category,
  };
}

export function resolveTurnUnderstanding(
  text: string,
  raw: BotUnderstanding,
  previous: { location: string; category: string } | null,
): BotUnderstanding {
  return applyCurrentMessageSearchRules(
    text,
    mergePending(previous, validateCurrentMessageIntent(text, raw), text),
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

  const roleInMessage = extractRole(text);
  const locationInMessage = extractPlace(text);
  const mentionsJob = includesAny(text, JOB_WORDS) || /\bjobs?\b/i.test(text);
  const mentionsRequest = includesAny(text, REQUEST_WORDS);
  const location = locationInMessage || understanding.location;

  if (roleInMessage) {
    return {
      ...understanding,
      location,
      category: roleInMessage,
      jobQuery: roleInMessage,
      openSearch: false,
    };
  }

  if ((mentionsJob || mentionsRequest) && location) {
    return {
      ...understanding,
      location,
      category: "",
      jobQuery: "",
      openSearch: true,
    };
  }

  return understanding;
}

export function selectVerifiedJobsForReply<T extends { jobTitle: string }>(
  jobs: T[],
  role: string,
  dbTotal: number,
): { total: number; jobs: T[]; hasMore: boolean } {
  const matched = jobs.filter((job) => matchesRequestedRole(job.jobTitle, role));
  const dropped = jobs.length - matched.length;
  const total = dropped > 0 ? Math.max(0, dbTotal - dropped) : dbTotal;
  const shown = matched.slice(0, JOBS_FOR_AI_LIMIT);
  return {
    total,
    jobs: shown,
    hasMore: total > shown.length,
  };
}

export function toPublicJobsLookup(input: {
  category: string;
  location: string;
  openSearch: boolean;
}): { search: string; city: string } {
  return {
    search: input.openSearch ? "" : input.category,
    city: input.location,
  };
}

export function parentCity(location: string): string {
  if (!location || CITY_LEVEL.has(location)) return "";
  return "Hyderabad";
}

export function renderJobSearchReply(input: {
  language: BotLanguage;
  location: string;
  jobTitle: string;
  jobs: PublicJobFact[];
  widenedTo?: string;
  total?: number;
}): string {
  const place = labelPlace(input.location, input.language);
  const role = labelRole(input.jobTitle, input.language);
  const count = input.total ?? input.jobs.length;

  if (count === 0) {
    if (input.language === "te") {
      return `ప్రస్తుతం ${place || "ఈ ప్రాంతం"}లో ${role || ""} జాబ్స్ కనిపించలేదు. హైదరాబాద్‌లోని ఇతర ప్రాంతాల్లో ${role || "జాబ్స్"} వెతకాలా?`.replace(
        /\s+/g,
        " ",
      );
    }
    if (input.language === "hi") {
      return `अभी ${place || "इस जगह"} में ${role || "नौकरी"} नहीं मिली। हैदराबाद के दूसरे इलाकों में देखें?`;
    }
    if (input.language === "ta" || input.language === "kn" || input.language === "ml") {
      return regionalLead(input.language, "empty", place, role, "");
    }
    return `I could not find ${role || "jobs"}${place ? ` in ${place}` : ""}. Should I look in nearby Hyderabad areas?`;
  }

  const lines = input.jobs.slice(0, JOBS_FOR_AI_LIMIT).map((job, index) => {
    const where = labelPlace(job.cityName, input.language) || job.cityName || job.stateName;
    const salary = job.salaryLabel ? `\n💰 ${job.salaryLabel}` : "";
    const company = job.companyName ? ` — ${job.companyName}` : "";
    const title = localizeJobTitle(job.jobTitle, input.language);
    return `${index + 1}. ${title}${company}${where ? `\n📍 ${where}` : ""}${salary}`;
  });

  if (input.language === "te") {
    const lead = input.widenedTo
      ? `${place}లో ${role} జాబ్స్ కనిపించలేదు. ${labelPlace(input.widenedTo, "te")}లో ఇవి ఉన్నాయి:`
      : `అవును 👍 ${place ? `${place}లో ` : ""}${count} ${role} ఉద్యోగాలు దొరికాయి.`;
    return `${lead}\n\n${lines.join("\n\n")}\n\nమీకు కావాల్సిన జాబ్‌పై మరిన్ని వివరాలు కావాలంటే చెప్పండి.`;
  }
  if (input.language === "hi") {
    const lead = input.widenedTo
      ? `${place} में ${role} की नौकरी नहीं मिली। ${labelPlace(input.widenedTo, "hi")} में ये मिलीं:`
      : `${place ? `${place} में ` : ""}${count} ${role} की नौकरियां मिली हैं.`;
    const more =
      count > input.jobs.length
        ? `\n\nकुल ${count} नौकरियां हैं. पहली ${input.jobs.length} दिखा रहे हैं.`
        : "";
    return `${lead}\n\n${lines.join("\n\n")}${more}`;
  }
  if (input.language === "ta" || input.language === "kn" || input.language === "ml") {
    const lead = input.widenedTo
      ? regionalLead(input.language, "widen", place, role, labelPlace(input.widenedTo, input.language))
      : regionalLead(input.language, "found", place, role, String(count));
    return `${lead}\n\n${lines.join("\n\n")}\n\n${regionalLead(input.language, "more", "", "", "")}`;
  }
  const lead = input.widenedTo
    ? `No ${role || "jobs"} in ${place}. These are in ${input.widenedTo}:`
    : `I found ${count} active ${role || "job"} listing${count === 1 ? "" : "s"}${place ? ` in ${place}` : ""}.`;
  const more =
    count > input.jobs.length
      ? `\n\nThere are ${count} matching jobs. Showing the first ${input.jobs.length}.`
      : "";
  return `${lead}\n\n${lines.join("\n\n")}${more}`;
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

export function askLocationCopy(language: BotLanguage): string {
  if (language === "te") return "ఏ ప్రాంతంలో జాబ్ కావాలో చెప్పండి. ఉదాహరణ: హైదరాబాద్.";
  if (language === "hi") return "किस जगह नौकरी चाहिए? उदाहरण: हैदराबाद.";
  if (language === "ta") return "எந்த ஊரில் வேலை வேண்டும்? உதாரணம்: ஹைதராபாத்.";
  if (language === "kn") return "ಯಾವ ಊರಲ್ಲಿ ಕೆಲಸ ಬೇಕು? ಉದಾಹರಣೆ: ಹೈದರಾಬಾದ್.";
  if (language === "ml") return "ഏത് സ്ഥലത്ത് ജോലി വേണം? ഉദാഹരണം: ഹൈദരാബാദ്.";
  return "Sure 👍 Which location are you looking for?";
}

export function howToApplyCopy(_language: BotLanguage): string {
  return "To apply, log in to AsliJobs, open the job, and tap Apply.";
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
  if (situation === "help" || situation === "out_of_scope") {
    return capabilityCopy(language, (facts.accountType as AccountKind) || "seeker");
  }
  if (situation === "how_to_apply") {
    return howToApplyCopy(language);
  }
  if (situation === "choose_account") {
    return greetingCopy({ language, account: "both", name: "" });
  }
  if (situation === "denied") {
    return String(facts.reason ?? "") === "employer_required"
      ? unauthorizedCopy(language, "employer")
      : denyPrivateCopy(language);
  }
  if (situation === "new_user") {
    const registration =
      facts.registration && typeof facts.registration === "object"
        ? (facts.registration as { seekerRegisterUrl?: string; employerRegisterUrl?: string })
        : {};
    const employerNeeded = String(facts.reason ?? "") === "employer_account_required";
    return [
      unauthorizedCopy(language, employerNeeded ? "employer" : "seeker"),
      registrationCopy({
        language,
        role: employerNeeded ? "employer" : "seeker",
        url: employerNeeded
          ? registration.employerRegisterUrl || ""
          : registration.seekerRegisterUrl || "",
      }),
    ]
      .filter((line) => line.trim())
      .join("\n");
  }
  if (situation === "clarify") {
    const missing = String(facts.missing ?? "");
    if (missing === "location") return askLocationCopy(language);
    if (missing === "which_account_data") return clarifyAmbiguousCopy(language);
    return clarifyJobTitle(language);
  }
  if (situation === "profile") {
    return profileCopy({
      language,
      name: String(facts.name ?? ""),
      role: String(facts.role ?? ""),
      skills: Array.isArray(facts.skills) ? facts.skills.map((item) => String(item)) : [],
    });
  }
  if (situation === "jobs" || situation === "job_details") {
    const jobs = Array.isArray(facts.jobs)
      ? (facts.jobs as Array<Record<string, unknown>>)
      : [];
    return renderJobSearchReply({
      language,
      location: String(facts.location ?? ""),
      jobTitle: String(facts.role ?? ""),
      jobs: jobs.map((job) => ({
        jobTitle: String(job.jobTitle ?? ""),
        companyName: String(job.companyName ?? ""),
        cityName: String(job.cityName ?? ""),
        stateName: "",
        jobId: "",
        salaryLabel: String(job.salary ?? job.salaryLabel ?? ""),
      })),
      widenedTo: facts.widenedTo ? String(facts.widenedTo) : undefined,
      total: typeof facts.total === "number" ? facts.total : undefined,
    });
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
          `${index + 1}. ${item.jobTitle ?? ""} — ${item.companyName ?? ""} (${item.status ?? ""})`,
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
  const employer = /\b(employer|hiring|hire)\b|నియమించ|भर्ती|ஆள் எடுக்க|ನೇಮಕ|നിയമിക്ക/i.test(trimmed);
  const seeker = /\b(job seeker|looking for a job|need a job|find a job)\b|ఉద్యోగం కావాలి|नौकरी चाहिए|வேலை வேண்டும்|ಕೆಲಸ ಬೇಕು|ജോലി വേണം/i.test(
    trimmed,
  );
  if (employer && !seeker) return "employer";
  if (seeker && !employer) return "seeker";
  return null;
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
    return "Your WhatsApp number is linked to more than one AsliJobs account. Continue as a job seeker or as an employer?";
  }
  if (input.account === "none") {
    if (input.language === "te") {
      return "హాయ్ 👋 AsliJobs కి స్వాగతం. ఇక్కడ ఉద్యోగాలు వెతకొచ్చు, employers కార్మికులను నియమించుకోవచ్చు. మీరు ఉద్యోగం వెతుకుతున్నారా, లేక నియమించాలనుకుంటున్నారా?";
    }
    if (input.language === "hi") {
      return "नमस्ते 👋 AsliJobs में आपका स्वागत है. यहाँ नौकरी मिल सकती है और employer भर्ती कर सकते हैं. आप नौकरी ढूंढ रहे हैं या भर्ती करना चाहते हैं?";
    }
    return "Hi 👋 Welcome to AsliJobs. People find jobs here, and employers hire workers. Are you looking for a job, or do you want to hire?";
  }
  if (input.account === "employer") {
    const who = name ? ` ${name}` : "";
    if (input.language === "te") {
      return `హాయ్${who} 👋 AsliJobs కి తిరిగి స్వాగతం.\n\nమీరు పోస్ట్ చేసిన ఉద్యోగాలు, వాటి స్థితి, మరియు వచ్చిన దరఖాస్తులు చూడొచ్చు. ఏమి తెలుసుకోవాలి?`;
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
    return `Hi${who} 👋 Welcome back to AsliJobs.\n\nYou can view your posted jobs, their status, and the applications they received. What would you like to know?`;
  }
  const who = name ? ` ${name}` : "";
  if (input.language === "te") {
    return `హాయ్${who} 👋 AsliJobs కి తిరిగి స్వాగతం.\n\nఉద్యోగాలు వెతకొచ్చు, మీ దరఖాస్తులు మరియు వాటి స్థితి చూడొచ్చు, మీ ప్రొఫైల్‌కు సరిపోయే ఉద్యోగాలు అడగొచ్చు. ఏ ఉద్యోగం కావాలి?`;
  }
  if (input.language === "hi") {
    return `नमस्ते${who} 👋 AsliJobs में वापस स्वागत है.\n\nनौकरी खोज, आपके आवेदन और उनकी स्थिति, और प्रोफाइल के अनुसार नौकरियां पूछ सकते हैं. कौन सी नौकरी चाहिए?`;
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
  return `Hi${who} 👋 Welcome back to AsliJobs.\n\nYou can find jobs, check your applications and their status, and ask for jobs that match your profile. What kind of job are you looking for?`;
}

export function registrationCopy(input: {
  language: BotLanguage;
  role: "seeker" | "employer";
  url: string;
}): string {
  if (input.role === "employer") {
    if (input.language === "te") return `Employer ఖాతా ఇక్కడ రిజిస్టర్ చేయండి: ${input.url}`;
    if (input.language === "hi") return `Employer खाता यहाँ रजिस्टर करें: ${input.url}`;
    return `Register your employer account here: ${input.url}`;
  }
  if (input.language === "te") return `ఉద్యోగం కోసం ఇక్కడ రిజిస్టర్ చేయండి: ${input.url}`;
  if (input.language === "hi") return `नौकरी के लिए यहाँ रजिस्टर करें: ${input.url}`;
  return `Register as a job seeker here: ${input.url}`;
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

function extractPlace(text: string): string {
  const hit = PLACES.find((place) =>
    place.forms.some((form) => text.toLowerCase().includes(form.toLowerCase())),
  );
  return hit?.canonical ?? "";
}

export function matchesRequestedRole(title: string, role: string): boolean {
  const requested = role.trim();
  if (!requested) return true;
  const folded = title.toLowerCase();
  const canonical = extractRole(requested) || requested;
  const forms = ROLES.find((item) => item.canonical === canonical)?.forms ?? [canonical];
  return forms.some((form) => folded.includes(form.toLowerCase()));
}

function extractRole(text: string): string {
  const hit = ROLES.find((role) =>
    role.forms.some((form) => text.toLowerCase().includes(form.toLowerCase())),
  );
  return hit?.canonical ?? "";
}

function normalizePlace(value: string): string {
  return value ? extractPlace(value) || value : "";
}

function normalizeRole(value: string): string {
  return value ? extractRole(value) || value : "";
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
