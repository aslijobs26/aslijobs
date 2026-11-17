import type { BotUnderstanding } from "./whatsapp-bot.logic.js";

/**
 * Pure conversation orchestration helpers.
 * The live turn still runs in whatsapp-bot.service (webhook → queue → processInboundTurn).
 * These functions keep multi-turn decisions testable without competing routers.
 */

export type NoMatchChoice =
  | "relax_salary"
  | "use_nearby"
  | "undisclosed_salary"
  | "wait"
  | "";

export type JobSearchSessionSlots = {
  lastCategory?: string;
  lastLocation?: string;
  lastMinSalary?: number | null;
  lastMaxSalary?: number | null;
  lastSalaryBasis?: string;
  lastExperience?: string;
  lastExperienceYears?: number | null;
  lastExperienceRange?: string;
  locationKind?: string;
  pendingNearbyCity?: string;
  pendingClarification?: string;
};

/** Resolve user reply after a job_search_no_match options message. */
export function resolveNoMatchChoice(text: string): NoMatchChoice {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const lowerSalaryChoice =
    /^1[).:]?$|takkuva|lower\s+salary|less\s+salary|low\s+salary|konchem\s+takkuva/i.test(trimmed) ||
    // Native-language voice transcripts commonly preserve the source script.
    /\u0c24\u0c15\u0c4d\u0c15\u0c41\u0c35.{0,24}\u0c1c\u0c40\u0c24\u0c02/i.test(trimmed) ||
    /\u0915\u092e.{0,16}(?:\u0935\u0947\u0924\u0928|\u0938\u0948\u0932\u0930\u0940|\u0924\u0928\u0916\u094d\u0935\u093e\u0939)/i.test(trimmed) ||
    /\u0b95\u0bc1\u0bb1\u0bc8\u0ba8\u0bcd\u0ba4.{0,20}\u0b9a\u0bae\u0bcd\u0baa\u0bb3\u0bae\u0bcd/i.test(trimmed) ||
    /\u0c95\u0ca1\u0cbf\u0cae\u0cc6.{0,20}\u0cb8\u0c82\u0cac\u0cb3/i.test(trimmed) ||
    /\u0d15\u0d41\u0d31\u0d1e\u0d4d\u0d1e.{0,20}\u0d36\u0d2e\u0d4d\u0d2a\u0d33\u0d02/i.test(trimmed);
  if (lowerSalaryChoice) {
    return "relax_salary";
  }
  if (/^2[).:]?$|nearby|daggar|vere\s+location|other\s+location|near\b/i.test(trimmed)) {
    return "use_nearby";
  }
  if (/^3[).:]?$|undisclosed|mention\s+cheyyani|salary\s+not|no\s+salary/i.test(trimmed)) {
    return "undisclosed_salary";
  }
  if (/^4[).:]?$|later|tarvatha|check\s+again|wait|ippudu\s+vaddu/i.test(trimmed)) {
    return "wait";
  }
  return "";
}

/**
 * Apply a no-match menu choice onto the active search slots.
 * Returns null for "wait" (caller should send a short ack and skip search).
 */
export function applyNoMatchChoiceToSearch(
  choice: NoMatchChoice,
  session: JobSearchSessionSlots,
  language: BotUnderstanding["language"],
): BotUnderstanding | "wait" | null {
  if (!choice) return null;
  if (choice === "wait") return "wait";
  const category = session.lastCategory || "";
  const location =
    choice === "use_nearby" && session.pendingNearbyCity
      ? session.pendingNearbyCity
      : session.lastLocation || "";
  if (!category || !location) return null;
  const clearSalary = choice === "relax_salary" || choice === "undisclosed_salary";
  return {
    intent: "JOB_SEARCH",
    language,
    location,
    category,
    jobQuery: category,
    openSearch: false,
    scope: "PUBLIC_JOBS",
    requiresAuth: false,
    confidence: 0.95,
    focus: "",
    locationKind: (session.locationKind === "state" || session.locationKind === "city"
      ? session.locationKind
      : "city") as BotUnderstanding["locationKind"],
    minSalary: clearSalary ? null : session.lastMinSalary ?? null,
    maxSalary: clearSalary ? null : session.lastMaxSalary ?? null,
    salaryBasis:
      session.lastSalaryBasis === "annual" ? "annual" : "monthly",
    experienceLevel: session.lastExperience || "",
    originalExperienceYears: session.lastExperienceYears ?? null,
    experienceRangeLabel: session.lastExperienceRange || "",
    crossRole: "",
    showMore: false,
  };
}

export function noMatchWaitCopy(language: BotUnderstanding["language"]): string {
  if (language === "te") {
    return "Sare — mee requirements save chesi unnai. Tarvatha malli adagandi, appudu malli search chestha.";
  }
  if (language === "hi") {
    return "ठीक है — आपकी पसंद सेव हैं. बाद में फिर पूछें, तब दोबारा खोजेंगे.";
  }
  return "Okay — I'll keep your preferences. Ask again later and I'll search with the same criteria.";
}

/** Documented turn pipeline stages (for logs/tests — not a second router). */
export const WHATSAPP_TURN_STAGES = [
  "validate_inbound",
  "dedupe_ack",
  "resolve_account",
  "load_session",
  "detect_language",
  "classify_intent",
  "merge_context",
  "authorize_role",
  "select_tool",
  "execute_service",
  "build_facts",
  "optional_openai_assist",
  "localize",
  "send_one_reply",
  "persist_session",
] as const;
