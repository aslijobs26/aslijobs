import type { AccountKind, BotIntent, BotLanguage } from "./whatsapp-bot.logic.js";
import { roleRedirectCopy } from "./whatsapp-bot.logic.js";

/** Role an intent requires. Shared/neutral intents do not require a specific role. */
export type RequiredWhatsAppRole = "employer" | "seeker" | "none";

export type WhatsAppRoleDecision =
  | { allowed: true; reason: "ok" | "neutral" | "unregistered_public" | "both_active" }
  | {
      allowed: false;
      reason: "employer_blocked_seeker" | "seeker_blocked_employer" | "both_needs_role";
      redirectTo: "seeker" | "employer" | "";
    };

/** Employer-only product intents. */
export const EMPLOYER_REQUIRED_INTENTS = new Set<BotIntent>([
  "POST_JOB",
  "EMPLOYER_JOBS",
  "EMPLOYER_JOB_STATUS",
  "EMPLOYER_APPLICATION_COUNT",
]);

/** Job-seeker-only product intents (includes public job discovery for registered seekers / guests). */
export const SEEKER_REQUIRED_INTENTS = new Set<BotIntent>([
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

/**
 * Shared intents — no cross-role gate.
 * ACCOUNT_STATUS is answered from the linked account's own profile/verification facts.
 */
export const NEUTRAL_INTENTS = new Set<BotIntent>([
  "GREETING",
  "HELP",
  "CLARIFY",
  "UNRELATED",
  "UNKNOWN",
  "ACCOUNT_STATUS",
]);

export function requiredRoleForIntent(intent: BotIntent): RequiredWhatsAppRole {
  if (EMPLOYER_REQUIRED_INTENTS.has(intent)) return "employer";
  if (SEEKER_REQUIRED_INTENTS.has(intent)) return "seeker";
  return "none";
}

/**
 * Central authorization gate: account role vs intent required role.
 * Call after intent classification; do not call role-specific services when denied.
 */
export function authorizeWhatsAppRole(input: {
  account: AccountKind;
  intent: BotIntent;
  /** For dual-role phones — which product surface is active. */
  activeRole?: "" | "seeker" | "employer";
}): WhatsAppRoleDecision {
  const required = requiredRoleForIntent(input.intent);
  if (required === "none") {
    return { allowed: true, reason: "neutral" };
  }

  const { account } = input;
  if (account === "none") {
    // Unregistered: seeker public job search / registration flows stay allowed;
    // employer intents go through employer registration (unknownUserAction).
    return { allowed: true, reason: "unregistered_public" };
  }

  if (account === "both") {
    const active = input.activeRole === "seeker" || input.activeRole === "employer"
      ? input.activeRole
      : "";
    // No active surface yet: preserve existing dual-role flows (public search /
    // choose_account in buildReply). Only gate once a role is selected.
    if (!active) {
      return { allowed: true, reason: "both_active" };
    }
    if (active === "employer" && required === "seeker") {
      return { allowed: false, reason: "employer_blocked_seeker", redirectTo: "seeker" };
    }
    if (active === "seeker" && required === "employer") {
      return { allowed: false, reason: "seeker_blocked_employer", redirectTo: "employer" };
    }
    return { allowed: true, reason: "both_active" };
  }

  if (account === "employer" && required === "seeker") {
    return { allowed: false, reason: "employer_blocked_seeker", redirectTo: "seeker" };
  }
  if (account === "seeker" && required === "employer") {
    return { allowed: false, reason: "seeker_blocked_employer", redirectTo: "employer" };
  }
  return { allowed: true, reason: "ok" };
}

/** Localized restriction copy — uses existing roleRedirectCopy wording/links. */
export function roleRestrictionReply(input: {
  language: BotLanguage;
  redirectTo: "seeker" | "employer";
  seekerRegisterUrl: string;
  employerRegisterUrl: string;
}): string {
  const url =
    input.redirectTo === "seeker" ? input.seekerRegisterUrl : input.employerRegisterUrl;
  return roleRedirectCopy(input.language, input.redirectTo, url);
}

/** Media/resume job-matching is a seeker-only product surface. */
export function mediaRequiresSeekerRole(messageType: string | undefined): boolean {
  return messageType === "image" || messageType === "document";
}
