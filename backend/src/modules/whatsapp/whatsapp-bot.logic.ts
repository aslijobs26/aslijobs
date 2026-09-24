export const BOT_INTENTS = [
  "GREETING",
  "JOB_SEARCH",
  "JOB_COUNT",
  "PROFILE_MATCH",
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
};

export type PublicJobFact = {
  jobTitle: string;
  companyName: string;
  cityName: string;
  stateName: string;
  jobId: string;
};

const TELUGU = /[\u0C00-\u0C7F]/;
const HINDI = /[\u0900-\u097F]/;

export function detectLanguage(text: string): BotLanguage {
  if (TELUGU.test(text)) return "te";
  if (HINDI.test(text)) return "hi";
  const lower = text.toLowerCase();
  if (/\b(undha|unnaya|kavali|cheppu|nenu|naaku|lo)\b/.test(lower)) return "te";
  if (/\b(kya|hai|mujhe|chahiye|dikhao|mere)\b/.test(lower)) return "hi";
  return "en";
}

export function nationalPhone(from: string): string {
  const digits = from.replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

export function parseUnderstanding(raw: string, fallbackText: string): BotUnderstanding {
  const language = detectLanguage(fallbackText);
  try {
    const parsed = JSON.parse(raw) as Partial<BotUnderstanding>;
    const intent = BOT_INTENTS.includes(parsed.intent as BotIntent)
      ? (parsed.intent as BotIntent)
      : "UNKNOWN";
    const parsedLanguage =
      parsed.language === "hi" || parsed.language === "te" || parsed.language === "en"
        ? parsed.language
        : language;
    return {
      intent,
      language: parsedLanguage,
      location: cleanSlot(parsed.location),
      category: cleanSlot(parsed.category),
      jobQuery: cleanSlot(parsed.jobQuery),
    };
  } catch {
    return understandLocally(fallbackText);
  }
}

export function understandLocally(text: string): BotUnderstanding {
  const language = detectLanguage(text);
  const lower = text.toLowerCase();
  const location = extractLocation(text);
  const category = extractCategory(lower);

  let intent: BotIntent = "UNKNOWN";
  if (/^(hi|hello|hey|hy|namaste|namaskaram)\b/i.test(lower.trim())) {
    intent = "GREETING";
  } else if (/how (do|to) i apply|apply cheyya|apply kaise/i.test(lower)) {
    intent = "HOW_TO_APPLY";
  } else if (/my skills|skills unnayi|skills kya/i.test(lower)) {
    intent = "MY_SKILLS";
  } else if (/matching jobs|profile ki|suitable/i.test(lower)) {
    intent = "PROFILE_MATCH";
  } else if (/application status|status enti|interview/i.test(lower)) {
    intent = "APPLICATION_STATUS";
  } else if (/my applications|applications chup|apply chesina|jobs did i apply/i.test(lower)) {
    intent = "MY_APPLICATIONS";
  } else if (/how many jobs|jobs are available|enni jobs/i.test(lower) && !/apply/i.test(lower)) {
    intent = "JOB_COUNT";
  } else if (/my posted jobs|my jobs|job status|approval status/i.test(lower)) {
    intent = "EMPLOYER_JOBS";
  } else if (/how many applications/i.test(lower)) {
    intent = "EMPLOYER_APPLICATION_COUNT";
  } else if (/job|driver|delivery|jobs|kavali|undha|unnaya/i.test(lower)) {
    intent = "JOB_SEARCH";
  }

  return {
    intent,
    language,
    location,
    category,
    jobQuery: [category, location].filter(Boolean).join(" "),
  };
}

export function mergePending(
  previous: { location: string; category: string } | null,
  next: BotUnderstanding,
): BotUnderstanding {
  if (!previous) return next;
  return {
    ...next,
    location: next.location || previous.location,
    category: next.category || previous.category,
    jobQuery: next.jobQuery || [next.category || previous.category, next.location || previous.location].filter(Boolean).join(" "),
    intent: next.intent === "UNKNOWN" && (previous.location || previous.category) ? "JOB_SEARCH" : next.intent,
  };
}

export function formatJobFacts(jobs: PublicJobFact[], language: BotLanguage): string {
  if (jobs.length === 0) {
    if (language === "te") {
      return "Ippudu aa search ki active jobs kanipinchaledu. Vere location leda category try cheyyandi.";
    }
    if (language === "hi") {
      return "Is search ke liye abhi koi active job nahi mili. Koi aur location ya category try karein.";
    }
    return "No active jobs matched that search. Try another location or job type.";
  }

  const lines = jobs.slice(0, 5).map((job, index) => {
    const place = [job.cityName, job.stateName].filter(Boolean).join(", ");
    return `${index + 1}. ${job.jobTitle} — ${job.companyName}${place ? ` (${place})` : ""} [${job.jobId}]`;
  });

  const header =
    language === "te"
      ? "Active jobs:"
      : language === "hi"
        ? "Active jobs:"
        : "Active jobs:";
  return `${header}\n${lines.join("\n")}`;
}

export function greetingCopy(input: {
  language: BotLanguage;
  known: boolean;
  name: string;
}): string {
  if (!input.known) {
    if (input.language === "te") {
      return "👋 Welcome to AsliJobs!\n\nMeeru ila adagochu:\n• Hyderabad lo driver job undha?\n• Delivery jobs kavali\n• Na profile ki matching jobs unnaya?\n• Na applications chupinchu";
    }
    if (input.language === "hi") {
      return "👋 Welcome to AsliJobs!\n\nAap pooch sakte hain:\n• Hyderabad mein driver job hai?\n• Delivery jobs chahiye\n• Mere profile ke matching jobs\n• Meri applications dikhao";
    }
    return "👋 Welcome to AsliJobs!\n\nYou can ask me:\n• Driver jobs in Hyderabad\n• Delivery jobs\n• Jobs matching my profile\n• Show my applications";
  }

  const name = input.name ? ` ${input.name}` : "";
  if (input.language === "te") {
    return `👋 Welcome back${name}!\nJobs search, mee applications, leda profile-based jobs adagochu.`;
  }
  if (input.language === "hi") {
    return `👋 Welcome back${name}!\nJobs search, applications, ya profile-based jobs pooch sakte hain.`;
  }
  return `👋 Welcome back${name}!\nI can search jobs, check your applications, or suggest jobs from your profile.`;
}

export function fallbackCopy(language: BotLanguage): string {
  if (language === "te") {
    return "Sorry, ippudu request process cheyyalekapothunnanu. Konchem tarvata try cheyyandi.";
  }
  if (language === "hi") {
    return "Sorry, abhi request process nahi ho payi. Thodi der baad try karein.";
  }
  return "Sorry, I could not process that just now. Please try again in a moment.";
}

export function unauthorizedCopy(language: BotLanguage, kind: "seeker" | "employer"): string {
  if (kind === "employer") {
    if (language === "te") return "Ee number employer account ki link avvaledu.";
    if (language === "hi") return "Yeh number kisi employer account se linked nahi hai.";
    return "This WhatsApp number is not linked to an employer account.";
  }
  if (language === "te") return "Ee number job seeker account ki link avvaledu.";
  if (language === "hi") return "Yeh number kisi job seeker account se linked nahi hai.";
  return "This WhatsApp number is not linked to a job seeker account.";
}

function cleanSlot(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

function extractLocation(text: string): string {
  const match = text.match(
    /\b(hyderabad|secunderabad|gachibowli|madhapur|bangalore|bengaluru|chennai|mumbai|delhi|pune|vijayawada|visakhapatnam|warangal)\b/i,
  );
  return match?.[1] ?? "";
}

function extractCategory(lower: string): string {
  const match = lower.match(
    /\b(driver|delivery|electrician|plumber|cook|security|housekeeping|sales|accountant|nurse|welder)\b/,
  );
  return match?.[1] ?? "";
}
