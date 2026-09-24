export const BOT_INTENTS = [
  "GREETING",
  "JOB_SEARCH",
  "JOB_COUNT",
  "PROFILE_MATCH",
  "PROFILE_JOBS",
  "MY_SKILLS",
  "MY_APPLICATIONS",
  "APPLICATION_STATUS",
  "HOW_TO_APPLY",
  "EMPLOYER_JOBS",
  "EMPLOYER_APPLICATION_COUNT",
  "UNKNOWN",
] as const;

export type BotIntent = (typeof BOT_INTENTS)[number];
export type BotLanguage = "en" | "hi" | "te";

export type BotUnderstanding = {
  intent: BotIntent;
  language: BotLanguage;
  location: string;
  category: string;
  jobQuery: string;
  /** Search jobs in a place without a specific title. */
  openSearch: boolean;
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

const ROMAN_TELUGU =
  /\b(undha|unda|vundha|vunda|unnaya|unnayi|unnai|kavali|kaavali|cheppu|cheppandi|chudandi|chupinchu|naaku|nenu|pani)\b|\blo\b/i;
const ROMAN_HINDI = /\b(kya|hai|hain|mujhe|chahiye|dikhao|naukri)\b/i;

const PLACES: Array<{ canonical: string; forms: string[] }> = [
  { canonical: "Madhapur", forms: ["madhapur", "మాధాపూర్", "మాదాపూర్", "माधापुर"] },
  { canonical: "Gachibowli", forms: ["gachibowli", "గచ్చిబౌలి", "गच्चीबोवली"] },
  { canonical: "Kukatpally", forms: ["kukatpally", "kukatpalli", "కూకట్‌పల్లి", "కూకట్పల్లి", "కూకట్‌పల్లి"] },
  { canonical: "Hyderabad", forms: ["hyderabad", "హైదరాబాద్", "హైదరాబాదు", "हैदराबाद"] },
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
  { canonical: "Driver", forms: ["driver", "డ్రైవర్", "డ్రైవరు", "ड्राइवर"] },
  { canonical: "Delivery", forms: ["delivery", "డెలివరీ", "డెలివరి", "डिलीवरी"] },
  { canonical: "Watchman", forms: ["watchman", "security", "వాచ్‌మన్", "వాచ్మన్", "वॉचमैन"] },
  { canonical: "Electrician", forms: ["electrician", "ఎలక్ట్రీషియన్", "इलेक्ट्रीशियन"] },
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
  "జాబ్స్",
  "పని",
  "नौकरी",
  "नौकरियां",
  "जॉब",
  "जॉब्स",
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

export function detectLanguage(text: string): BotLanguage {
  if (TELUGU_SCRIPT.test(text) || ROMAN_TELUGU.test(text)) return "te";
  if (HINDI_SCRIPT.test(text) || ROMAN_HINDI.test(text)) return "hi";
  return "en";
}

export function nationalPhone(from: string): string {
  const digits = from.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function understandLocally(text: string): BotUnderstanding {
  const language = detectLanguage(text);
  const folded = text.toLowerCase();
  const location = extractPlace(text);
  const category = extractRole(text);
  const mentionsJob = includesAny(text, JOB_WORDS) || /\bjobs?\b/i.test(folded);
  const mentionsRequest = includesAny(text, REQUEST_WORDS);
  const profile =
    /profile|ప్రొఫైల్|సరిపోయే|प्रोफाइल|suitable/i.test(text) &&
    (mentionsJob || mentionsRequest || /jobs?/i.test(folded));
  const applications =
    /applications?|అప్లికేషన్|అప్లికేషన్స్|आवेदन/i.test(text);
  const greeting = /^(హాయ్|హలో|నమస్తే|नमस्ते|हाय|hi|hello|hey|hy)\b/i.test(
    text.trim(),
  );

  let intent: BotIntent = "UNKNOWN";
  if (greeting && text.trim().length < 20) intent = "GREETING";
  else if (profile) intent = "PROFILE_JOBS";
  else if (applications) intent = "MY_APPLICATIONS";
  else if (/how (do|to) i apply|apply cheyya|apply kaise/i.test(folded)) {
    intent = "HOW_TO_APPLY";
  } else if (/my skills|skills unnayi|నైపుణ్యాలు/i.test(text)) intent = "MY_SKILLS";
  else if (/my posted jobs|how many applications/i.test(folded)) {
    intent = /how many applications/i.test(folded)
      ? "EMPLOYER_APPLICATION_COUNT"
      : "EMPLOYER_JOBS";
  } else if (
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

  return {
    intent,
    language,
    location,
    category,
    jobQuery: category,
    openSearch,
  };
}

export function parseUnderstanding(raw: string, fallbackText: string): BotUnderstanding {
  const local = understandLocally(fallbackText);
  try {
    const parsed = JSON.parse(raw) as Partial<BotUnderstanding> & { jobTitle?: string };
    const remoteIntent = BOT_INTENTS.includes(parsed.intent as BotIntent)
      ? (parsed.intent as BotIntent)
      : "UNKNOWN";
    const remoteCategory = normalizeRole(cleanSlot(parsed.jobTitle) || cleanSlot(parsed.category));
    const remoteLocation = normalizePlace(cleanSlot(parsed.location));
    return {
      intent: local.intent !== "UNKNOWN" ? local.intent : remoteIntent,
      language: local.language,
      location: local.location || remoteLocation,
      category: local.category || remoteCategory,
      jobQuery: local.category || remoteCategory,
      openSearch: local.openSearch,
    };
  } catch {
    return local;
  }
}

export function mergePending(
  previous: { location: string; category: string } | null,
  next: BotUnderstanding,
): BotUnderstanding {
  if (!previous) return next;
  const location = next.location || previous.location;
  const category = next.category || previous.category;
  const continued = next.intent === "UNKNOWN" && Boolean(location || category);
  return {
    ...next,
    location,
    category,
    jobQuery: category,
    intent: continued ? "JOB_SEARCH" : next.intent,
    openSearch: next.openSearch && !category,
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
}): string {
  const place = labelPlace(input.location, input.language);
  const role = labelRole(input.jobTitle, input.language);
  const count = input.jobs.length;

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
    return `I could not find ${role || "jobs"}${place ? ` in ${place}` : ""}. Should I look in nearby Hyderabad areas?`;
  }

  const lines = input.jobs.slice(0, 5).map((job, index) => {
    const where = job.cityName || job.stateName;
    const salary = job.salaryLabel ? `\n💰 ${job.salaryLabel}` : "";
    const company = job.companyName ? ` — ${job.companyName}` : "";
    return `${index + 1}. ${job.jobTitle}${company}${where ? `\n📍 ${where}` : ""}${salary}`;
  });

  if (input.language === "te") {
    const lead = input.widenedTo
      ? `${place}లో ${role} జాబ్స్ కనిపించలేదు. ${labelPlace(input.widenedTo, "te")}లో ఇవి ఉన్నాయి:`
      : `అవును 👍 ${place ? `${place}లో ` : ""}${count} ${role} జాబ్స్ ఉన్నాయి.`;
    return `${lead}\n\n${lines.join("\n\n")}\n\nమీకు కావాల్సిన జాబ్‌పై మరిన్ని వివరాలు కావాలంటే చెప్పండి.`;
  }
  if (input.language === "hi") {
    const lead = input.widenedTo
      ? `${place} में ${role} की नौकरी नहीं मिली। ${labelPlace(input.widenedTo, "hi")} में ये मिलीं:`
      : `${place ? `${place} में ` : ""}${count} ${role} की नौकरियां मिली हैं.`;
    return `${lead}\n\n${lines.join("\n\n")}`;
  }
  const lead = input.widenedTo
    ? `No ${role || "jobs"} in ${place}. These are in ${input.widenedTo}:`
    : `I found ${count} active ${role || "job"} listing${count === 1 ? "" : "s"}${place ? ` in ${place}` : ""}.`;
  return `${lead}\n\n${lines.join("\n\n")}`;
}

export function clarifyJobTitle(language: BotLanguage): string {
  if (language === "te") {
    return "మీకు ఏ జాబ్ కావాలో చెప్పండి. ఉదాహరణకు: 'మాధాపూర్‌లో డ్రైవర్ జాబ్ కావాలి'.";
  }
  if (language === "hi") {
    return "आपको कौन सी नौकरी चाहिए बताइए। उदाहरण: 'माधापुर में ड्राइवर की नौकरी चाहिए'.";
  }
  return "Tell me what kind of job you're looking for. For example: 'driver jobs in Madhapur'.";
}

export function greetingCopy(input: {
  language: BotLanguage;
  known: boolean;
  name: string;
}): string {
  if (input.language === "te") {
    return "నమస్తే 👋 AsliJobs కి స్వాగతం!\n\nనేను మీకు:\n• జాబ్స్ వెతకడంలో\n• మీ అప్లికేషన్స్ చెక్ చేయడంలో\n• మీ ప్రొఫైల్‌కు సరిపోయే జాబ్స్ సూచించడంలో\n\nసహాయం చేయగలను.\n\nఉదాహరణ:\n'హైదరాబాద్‌లో డ్రైవర్ జాబ్స్ ఉన్నాయా?' అని అడగండి.";
  }
  if (input.language === "hi") {
    return "नमस्ते 👋 AsliJobs में आपका स्वागत है!\n\nमैं नौकरी खोज, आपके आवेदन, और प्रोफाइल के हिसाब से नौकरियां बता सकता हूँ.\n\nउदाहरण: 'हैदराबाद में ड्राइवर की नौकरी है क्या?'";
  }
  const name = input.known && input.name ? ` ${input.name}` : "";
  return `Hello${name} 👋 Welcome to AsliJobs.\n\nI can search jobs, check your applications, or suggest jobs from your profile.\n\nTry: "Are there driver jobs in Madhapur?"`;
}

export function fallbackCopy(language: BotLanguage): string {
  return clarifyJobTitle(language);
}

export function unauthorizedCopy(language: BotLanguage, kind: "seeker" | "employer"): string {
  if (kind === "employer") {
    if (language === "te") return "ఈ నంబర్ employer account కి లింక్ కాలేదు.";
    if (language === "hi") return "यह नंबर किसी employer account से जुड़ा नहीं है.";
    return "This WhatsApp number is not linked to an employer account.";
  }
  if (language === "te") return "ఈ నంబర్ job seeker account కి లింక్ కాలేదు.";
  if (language === "hi") return "यह नंबर किसी job seeker account से जुड़ा नहीं है.";
  return "This WhatsApp number is not linked to a job seeker account.";
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
