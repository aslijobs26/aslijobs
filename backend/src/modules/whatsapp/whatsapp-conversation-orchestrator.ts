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
  locationKind?: string;
  pendingNearbyCity?: string;
  pendingClarification?: string;
};

/** Resolve user reply after a job_search_no_match options message. */
export function resolveNoMatchChoice(text: string): NoMatchChoice {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (/^1[).:]?$|takkuva|lower\s+salary|less\s+salary|konchem\s+takkuva/i.test(trimmed)) {
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
