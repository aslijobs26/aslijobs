import type { BotIntent, BotLanguage, BotUnderstanding } from "./whatsapp-bot.logic.js";
import type { NoMatchChoice } from "./whatsapp-conversation-orchestrator.js";

/**
 * Slots the live turn already stores on WhatsAppSession.
 * This resolver reads them. It does not query Mongo or call a model.
 */
export type ClarificationSession = {
  pendingClarification?: string;
  lastClarifyMissing?: string;
  pendingIntent?: string;
  pendingLocation?: string;
  pendingCategory?: string;
  pendingOpenSearch?: boolean;
  pendingNearbyCity?: string;
  lastIntent?: string;
  lastCategory?: string;
  lastLocation?: string;
  lastMinSalary?: number | null;
  lastJobs?: Array<{ jobTitle?: string; salaryLabel?: string }>;
};

export function clarificationIsPending(
  session: ClarificationSession | null | undefined,
): boolean {
  if (!session) return false;
  return Boolean(
    session.pendingClarification?.trim() ||
      session.lastClarifyMissing?.trim() ||
      session.pendingIntent?.trim(),
  );
}

/** Yes/no while a clarify is open must not become a dead-end "Okay". */
export function shouldDeferProtocolAck(
  protocol: "greeting" | "thanks" | "ack" | null,
  session: ClarificationSession | null | undefined,
): boolean {
  return protocol === "ack" && clarificationIsPending(session);
}

export function isAffirmativeReply(text: string): boolean {
  return /^(yes|yeah|yep|yup|ok|okay|oke|haan|han|ha|avunu|sare|అవును|సరే|हाँ|हां|ठीक|सही|ஆம்|சரி|ಹೌದು|ಸರಿ|അതെ|ശരി)\.?$/i.test(
    text.trim(),
  );
}

export function isNegativeReply(text: string): boolean {
  return /^(no|nope|nahi|nahin|kadu|కాదు|నహీ|नहीं|இல்லை|ಇಲ್ಲ|ഇല്ല)\.?$/i.test(text.trim());
}

export type ClarificationAck =
  | { kind: "ack" }
  | { kind: "reask"; missing: string }
  | { kind: "no_match"; choice: NoMatchChoice };

/**
 * Map a short yes/no onto the open slot.
 * A location/role question cannot be answered with yes, so we ask again.
 * A no-match menu treats yes as the permission the copy asked for
 * (nearby city when one was offered, otherwise relax salary), and no as wait.
 */
export function resolveClarificationAck(
  text: string,
  session: ClarificationSession | null | undefined,
): ClarificationAck {
  if (!clarificationIsPending(session) || !session) return { kind: "ack" };
  const yes = isAffirmativeReply(text);
  const no = isNegativeReply(text);

  if (session.pendingClarification === "job_search_no_match") {
    if (no) return { kind: "no_match", choice: "wait" };
    if (yes && session.pendingNearbyCity?.trim()) {
      return { kind: "no_match", choice: "use_nearby" };
    }
    if (yes && (session.lastMinSalary ?? 0) > 0) {
      return { kind: "no_match", choice: "relax_salary" };
    }
    if (yes) return { kind: "no_match", choice: "wait" };
    return { kind: "reask", missing: "no_match" };
  }

  const missing =
    session.lastClarifyMissing?.trim() ||
    (session.pendingLocation?.trim() ? "role" : "location");
  if (yes || no) return { kind: "reask", missing: missing || "location" };
  return { kind: "ack" };
}

export function searchContextIsActive(
  session: ClarificationSession | null | undefined,
): boolean {
  if (!session) return false;
  return Boolean(
    session.lastCategory?.trim() ||
      session.lastLocation?.trim() ||
      session.pendingIntent?.trim() ||
      session.pendingCategory?.trim() ||
      (session.lastJobs?.length ?? 0) > 0,
  );
}

/** Full-message reset. A bare hello is not a reset. */
export function looksLikeIntentionalSearchReset(text: string): boolean {
  return /^(start over|start again|reset|new search|fresh start|kotha search|malli start)\.?$/i.test(
    text.trim(),
  );
}

export function shouldClearSearchOnGreeting(
  text: string,
  session: ClarificationSession | null | undefined,
): boolean {
  if (looksLikeIntentionalSearchReset(text)) return true;
  return !searchContextIsActive(session);
}

export type StructuredTurn = {
  intent: BotIntent;
  language: BotLanguage;
  accountRole: string;
  action: string;
  category: string;
  location: string;
  experience: string;
  minSalary: number | null;
  maxSalary: number | null;
  employmentType: string;
  shift: "" | "unsupported";
  clarificationAnswer: string;
  previousIntent: string;
  filtersAdded: string[];
  filtersRemoved: string[];
  refersToShownJobs: boolean;
  needsClarification: boolean;
  confidence: number;
};

/** Compact view of one turn for logs and tests. Built from the merged understanding. */
export function describeStructuredTurn(input: {
  understanding: BotUnderstanding;
  accountRole: string;
  previousIntent?: string;
  userText: string;
  clarificationAnswer?: string;
  shiftUnsupported?: boolean;
  refersToShownJobs?: boolean;
}): StructuredTurn {
  const understanding = input.understanding;
  const filtersAdded: string[] = [];
  if (understanding.location) filtersAdded.push(`location:${understanding.location}`);
  if (understanding.category) filtersAdded.push(`role:${understanding.category}`);
  if (understanding.minSalary != null) filtersAdded.push(`minSalary:${understanding.minSalary}`);
  if (understanding.experienceLevel) filtersAdded.push(`experience:${understanding.experienceLevel}`);
  const filtersRemoved: string[] = [];
  if (understanding.clearExperience) filtersRemoved.push("experience");
  if (understanding.anyLocation) filtersRemoved.push("location");
  const needsClarification = Boolean(
    understanding.clarifyField ||
      understanding.intent === "CLARIFY" ||
      understanding.intent === "UNKNOWN",
  );
  return {
    intent: understanding.intent,
    language: understanding.language,
    accountRole: input.accountRole,
    action: understanding.showMore
      ? "show_more"
      : understanding.compareShownSalaries
        ? "compare_shown_salaries"
        : understanding.intent,
    category: understanding.category,
    location: understanding.location,
    experience: understanding.experienceLevel || "",
    minSalary: understanding.minSalary ?? null,
    maxSalary: understanding.maxSalary ?? null,
    employmentType: "",
    shift: input.shiftUnsupported ? "unsupported" : "",
    clarificationAnswer: input.clarificationAnswer || "",
    previousIntent: input.previousIntent || "",
    filtersAdded,
    filtersRemoved,
    refersToShownJobs: Boolean(input.refersToShownJobs || understanding.compareShownSalaries),
    needsClarification,
    confidence: understanding.confidence,
  };
}
