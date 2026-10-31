import type { BotLanguage } from "./whatsapp-bot.logic.js";

/** Situations where OpenAI may rephrase verified facts — never invent new ones. */
const ASSIST_SITUATIONS = new Set([
  "jobs",
  "job_details",
  "clarify",
  "help",
  "out_of_scope",
  "profile",
  "count",
  "status",
  "list",
  "applied_coverage",
  "how_to_apply",
  "account_status",
  "media_resume_summary",
  "media_ask_intent",
]);

/** Deterministic paths that must never call OpenAI. */
const BLOCKED_SITUATIONS = new Set([
  "greeting",
  "choose_account",
  "denied",
  "role_redirect",
  "new_user",
  "post_job",
  "EMPLOYER_JOBS",
  "EMPLOYER_JOB_STATUS",
  "EMPLOYER_APPLICATION_COUNT",
  "job_search_no_match",
  "job_search_no_more",
  "verification_timeline_unknown",
]);

export type OpenAiAssistRouteInput = {
  enabled: boolean;
  hasApiKey: boolean;
  model: string;
  protocol: boolean;
  menuIntent: boolean;
  situation: string;
  userText: string;
  /** Prefer assist when Sarvam already ran (ambiguous) or follow-up clarification. */
  understandingSource: "local" | "sarvam" | "menu" | "protocol";
  language: BotLanguage;
};

/**
 * Selective OpenAI routing. Keep greetings, menus, OTP-adjacent protocol,
 * and employer numeric templates on deterministic / Sarvam paths.
 */
export function shouldUseOpenAiAssist(input: OpenAiAssistRouteInput): boolean {
  if (!input.enabled) return false;
  if (!input.hasApiKey || !input.model.trim()) return false;
  if (input.protocol || input.menuIntent) return false;
  const situation = String(input.situation ?? "").trim();
  if (!situation || BLOCKED_SITUATIONS.has(situation)) return false;
  if (!ASSIST_SITUATIONS.has(situation)) return false;
  const text = input.userText.trim();
  if (text.length < 8) return false;
  // Prefer assist for ambiguous / follow-up turns; still allow for jobs lists
  // when the user asked a natural-language question longer than a keyword.
  if (situation === "jobs" || situation === "job_details") {
    return text.length >= 18 || input.understandingSource === "sarvam";
  }
  if (situation === "clarify" || situation.startsWith("media_")) {
    return true;
  }
  return input.understandingSource === "sarvam" || text.length >= 24;
}

export function openAiAssistAllowlist(): string[] {
  return [...ASSIST_SITUATIONS];
}
