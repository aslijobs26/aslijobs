import { createHash } from "node:crypto";
import { env } from "../../config/env.js";
import { applicationService } from "../applications/application.service.js";
import { JobModel } from "../jobs/job.model.js";
import { parseJobContentLanguage } from "../jobs/job-content-language.js";
import { resolveJobContent } from "../jobs/job-content-translation.js";
import { jobService, toLocationSlug } from "../jobs/job.service.js";
import {
  listEmployerJobsQuerySchema,
  publicJobsQuerySchema,
} from "../jobs/job.validation.js";
import { resolveWhatsAppLinkedAccount } from "../accounts/phone-account.service.js";
import { persistJobSeekerWhatsAppLanguage } from "./job-seeker-whatsapp-language.js";
import { appendSiteLanguageQuery } from "../../utils/site-language-url.js";
import { WhatsAppSessionModel } from "./whatsapp-session.model.js";
import { WhatsAppService } from "./whatsapp.service.js";
import { formatAppliedFilters } from "./whatsapp-bot.criteria.js";
import { runInPhoneOrder } from "./whatsapp-phone-order.js";
import { transcribeWhatsAppAudio, understandMessage } from "./sarvam.client.js";
import { localizeDeterministicReply, whatsappAiCallPlan } from "./sarvam-translate.client.js";
import { assistWhatsAppReply } from "./openai-assist.client.js";
import { shouldUseOpenAiAssist } from "./openai-assist.routing.js";
import { understandInboundWhatsAppMedia } from "./whatsapp-media-understand.service.js";
import { mediaProgressCopy } from "./whatsapp-media-messages.js";
import {
  authorizeWhatsAppRole,
  mediaRequiresSeekerRole,
  roleRestrictionReply,
} from "./whatsapp-role-policy.js";
import {
  applyNoMatchChoiceToSearch,
  noMatchWaitCopy,
  resolveNoMatchChoice,
} from "./whatsapp-conversation-orchestrator.js";
import { selectWhatsAppTool } from "./whatsapp-bot-tools.js";
import {
  activeSearchContext,
  applyAccountAwareIntent,
  applyRoleHints,
  conversationStateForAccount,
  detectLanguage,
  detectMenuSelection,
  detectProtocolTurn,
  formatSalaryLabel,
  isFollowUpFragment,
  isNoResumeMessage,
  languageFromHint,
  lookingAtQuestionCopy,
  menuUnderstanding,
  nationalPhone,
  nextClarifyLoopState,
  parentCity,
  placeCityAliases,
  publicJobFilters,
  PUBLIC_JOB_FETCH_LIMIT,
  resolveTurnUnderstanding,
  selectVerifiedJobsForReply,
  protocolReply,
  serviceErrorCopy,
  shouldUseLlmFallback,
  understandLocally,
  unknownUserAction,
  voiceUnclearCopy,
  type AccountKind,
  type BotLanguage,
  type BotUnderstanding,
  type ConversationState,
  type PublicJobFact,
} from "./whatsapp-bot.logic.js";

const whatsAppService = new WhatsAppService();

const recentReplies = new Map<string, number[]>();
const ACCOUNT_CACHE_MS = 60_000;
const accountCache = new Map<string, { value: LinkedAccount; expires: number }>();

function allowReply(phone: string): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const hits = (recentReplies.get(phone) ?? []).filter((time) => time > windowStart);
  if (hits.length >= 20) {
    recentReplies.set(phone, hits);
    return false;
  }
  hits.push(now);
  recentReplies.set(phone, hits);
  return true;
}

const mediaProgressAcked = new Set<string>();

async function acknowledgeMediaProcessing(input: {
  from: string;
  phone: string;
  messageId?: string;
  messageType: "image" | "document" | "audio";
  language: "en" | "hi" | "te" | "ta" | "kn" | "ml";
  priorProgressId: string;
}): Promise<void> {
  const messageId = input.messageId?.trim() ?? "";
  if (messageId && (mediaProgressAcked.has(messageId) || input.priorProgressId === messageId)) {
    return;
  }
  if (messageId) mediaProgressAcked.add(messageId);
  // Official Cloud API: mark read + typing indicator (dismisses on reply or ~25s).
  await whatsAppService.markReadWithTyping(messageId || undefined);
  await whatsAppService.sendTextMessage(
    input.from,
    mediaProgressCopy(input.language, input.messageType),
  );
  if (messageId) {
    await WhatsAppSessionModel.findOneAndUpdate(
      { phone: input.phone },
      { phone: input.phone, lastMediaProgressMessageId: messageId },
      { upsert: true },
    ).catch(() => undefined);
  }
}

function phoneHash(phone: string): string {
  return createHash("sha256").update(phone).digest("hex").slice(0, 12);
}

function maskPhone(phone: string): string {
  return phone.length <= 4 ? "****" : `****${phone.slice(-4)}`;
}

function accountLabel(kind: AccountKind): string {
  if (kind === "seeker") return "JOB_SEEKER";
  if (kind === "employer") return "EMPLOYER";
  if (kind === "both") return "BOTH";
  return "NEW_USER";
}

type LinkedAccount = {
  seeker: {
    _id: { toString(): string };
    fullName?: string;
    city?: string;
    jobRole?: string;
    skills?: string[];
    preferredJobLocation?: string;
    registrationStatus?: string;
    isWhatsappVerified?: boolean;
    accountStatus?: string;
  } | null;
  employer: {
    _id: { toString(): string };
    companyName?: string;
    verificationStatus?: "pending" | "verified" | "rejected";
    isProfileComplete?: boolean;
    verificationRemarks?: string;
  } | null;
  linked: AccountKind;
  seekerId: string;
  employerId: string;
  progress: "registered" | "unregistered" | "incomplete_seeker" | "incomplete_employer" | "incomplete_both";
};

function toAccountKind(kind: "job_seeker" | "employer" | "none" | "both"): AccountKind {
  if (kind === "job_seeker") return "seeker";
  if (kind === "employer") return "employer";
  if (kind === "both") return "both";
  return "none";
}

async function lookupAccount(
  phone: string,
  options?: { bypassCache?: boolean },
): Promise<LinkedAccount> {
  if (!options?.bypassCache) {
    const cached = accountCache.get(phone);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }
  }
  const resolved = await resolveWhatsAppLinkedAccount(phone);
  const linked = toAccountKind(resolved.kind);
  const value: LinkedAccount = {
    seeker: resolved.jobSeeker,
    employer: resolved.employer,
    linked,
    seekerId: resolved.jobSeeker?._id.toString() ?? "",
    employerId: resolved.employer?._id.toString() ?? "",
    progress: resolved.progress,
  };
  accountCache.set(phone, { value, expires: Date.now() + ACCOUNT_CACHE_MS });
  return value;
}

function siteUrls(language?: string): {
  seekerRegisterUrl: string;
  employerRegisterUrl: string;
  postJobUrl: string;
  employerProfileUrl: string;
} {
  const origin = env.FRONTEND_URL.replace(/\/+$/, "");
  return {
    seekerRegisterUrl: appendSiteLanguageQuery(
      `${origin}/job-seeker/register`,
      language,
    ),
    employerRegisterUrl: `${origin}/employer/register`,
    postJobUrl: `${origin}/post-job`,
    employerProfileUrl: `${origin}/employer/company-profile`,
  };
}

function describeTurn(
  understanding: BotUnderstanding,
  turn: BotTurn,
): { allowed: boolean; scope: string; service: string; filters: string; resultCount: number } {
  const situation = String(turn.facts.situation ?? "");
  const jobs = Array.isArray(turn.facts.jobs) ? turn.facts.jobs.length : turn.shownJobs.length;
  const total = typeof turn.facts.total === "number" ? turn.facts.total : jobs;
  const denied = situation === "denied" || (situation === "new_user" && understanding.requiresAuth);
  const service =
    situation === "jobs" || situation === "job_details"
      ? "listPublicActiveJobs"
      : situation === "count" || situation === "status" || situation === "list" || situation === "applied_coverage"
        ? "listForSeeker"
        :         situation.startsWith("EMPLOYER_") || situation === "post_job" || situation === "account_status"
          ? "listEmployerJobs"
          : situation === "profile"
            ? "jobSeekerProfile"
            : "none";
  return {
    allowed: !denied,
    scope: understanding.scope,
    service,
    filters: `role=${understanding.category || "-"} city=${understanding.locationKind === "state" ? "-" : understanding.location || "-"} state=${understanding.locationKind === "state" ? understanding.location || "-" : "-"} experience=${understanding.experienceLevel || "-"}`,
    resultCount: typeof turn.facts.totalApplications === "number" ? turn.facts.totalApplications : total,
  };
}

function logWhatsAppBot(event: string, details = ""): void {
  console.info(`[WHATSAPP-BOT] ${event}${details ? ` ${details}` : ""}`);
}

export function handleConversationalMessage(input: {
  from: string;
  text?: string;
  languageHint?: string;
  messageId?: string;
  messageType?: string;
  mediaId?: string;
  mimeType?: string;
}): Promise<void> {
  return runInPhoneOrder(nationalPhone(input.from), () => processInboundTurn(input));
}

async function processInboundTurn(input: {
  from: string;
  text?: string;
  languageHint?: string;
  messageId?: string;
  messageType?: string;
  mediaId?: string;
  mimeType?: string;
  fileName?: string;
}): Promise<void> {
  const phone = nationalPhone(input.from);
  if (!allowReply(phone)) {
    return;
  }

  const { isBotPausedForPhone } = await import("./inbox/whatsapp-inbox-store.js");
  if (await isBotPausedForPhone(phone)) {
    console.info(
      `[WhatsAppBot] skipped auto-reply phone=${maskPhone(phone)} reason=human_handoff`,
    );
    return;
  }

  const started = Date.now();
  const timing = {
    account_lookup: 0,
    session_lookup: 0,
    sarvam_understand: 0,
    db_query: 0,
    whatsapp_send: 0,
  };
  try {
    const lookupStarted = Date.now();
    type SessionLean = {
      language?: BotLanguage;
      conversationState?: string;
      activeRole?: string;
      pendingLocation?: string;
      pendingCategory?: string;
      pendingOpenSearch?: boolean;
      pendingIntent?: string;
      lastIntent?: string;
      pendingClarification?: string;
      lastClarifyMissing?: string;
      clarifyAttempts?: number;
      pendingNearbyCity?: string;
      lastLocation?: string;
      lastCategory?: string;
      lastMinSalary?: number | null;
      lastMaxSalary?: number | null;
      lastSalaryBasis?: string;
      locationKind?: string;
      lastJobs?: Array<Record<string, string>>;
      lastResumeSkills?: string[];
      lastResumeAt?: Date | null;
      lastMediaProgressMessageId?: string;
    };
    let session: SessionLean | null = null;
    let identity: LinkedAccount;
    try {
      // Always re-resolve account at turn start (queue delay / role change).
      const [foundSession, foundIdentity] = await Promise.all([
        WhatsAppSessionModel.findOne({ phone }).lean(),
        lookupAccount(phone, { bypassCache: true }),
      ]);
      session = (foundSession as SessionLean | null) ?? null;
      identity = foundIdentity;
    } catch (error) {
      console.error(
        `[WhatsAppBot] account_lookup_failed phone=${phoneHash(phone)} reason=${
          error instanceof Error ? error.name : "unknown"
        }`,
      );
      await whatsAppService.sendTextMessage(
        input.from,
        serviceErrorCopy("en"),
      );
      return;
    }
    timing.account_lookup = Date.now() - lookupStarted;
    timing.session_lookup = timing.account_lookup;
    logWhatsAppBot(
      "ACCOUNT_RESOLVED",
      `accountType=${accountLabel(identity.linked)} seeker=${identity.seekerId ? "yes" : "no"} employer=${identity.employerId ? "yes" : "no"}`,
    );

    let text = input.text?.trim() ?? "";
    let languageHint = input.languageHint;
    const sessionLanguage =
      (session?.language as "en" | "hi" | "te" | "ta" | "kn" | "ml") ?? "en";

    // Image / document: never run STT. Feature-flagged content understanding.
    if (
      input.mediaId &&
      (input.messageType === "image" || input.messageType === "document")
    ) {
      const mediaActiveRole =
        session?.activeRole === "seeker" || session?.activeRole === "employer"
          ? session.activeRole
          : "";
      // Resume / OCR matching is seeker-only. Do not OCR for employer accounts.
      if (
        mediaRequiresSeekerRole(input.messageType) &&
        (identity.linked === "employer" ||
          (identity.linked === "both" && mediaActiveRole === "employer"))
      ) {
        const urls = siteUrls(sessionLanguage);
        const restriction = roleRestrictionReply({
          language: sessionLanguage,
          redirectTo: "seeker",
          seekerRegisterUrl: urls.seekerRegisterUrl,
          employerRegisterUrl: urls.employerRegisterUrl,
        });
        await WhatsAppSessionModel.findOneAndUpdate(
          { phone },
          { phone, lastInteractionAt: new Date() },
          { upsert: true },
        );
        await whatsAppService.sendTextMessage(input.from, restriction);
        console.info(
          `[WA-FLOW] accountType=${accountLabel(identity.linked)} intent=MEDIA_ROLE_BLOCK language=${sessionLanguage} understandingMode=GATE llmUsed=false responseType=role_redirect latency=${Date.now() - started}`,
        );
        return;
      }
      await acknowledgeMediaProcessing({
        from: input.from,
        phone,
        messageId: input.messageId,
        messageType: input.messageType,
        language: sessionLanguage,
        priorProgressId: session?.lastMediaProgressMessageId ?? "",
      });
      const mediaOutcome = await understandInboundWhatsAppMedia({
        mediaId: input.mediaId,
        mimeType: input.mimeType,
        fileName: input.fileName,
        messageType: input.messageType,
        language: sessionLanguage,
        phoneHash: phoneHash(phone),
        caption: text || undefined,
      });
      await WhatsAppSessionModel.findOneAndUpdate(
        { phone },
        {
          phone,
          lastInteractionAt: new Date(),
          ...(mediaOutcome.status === "completed"
            ? {
                lastResumeSkills: mediaOutcome.skills.slice(0, 12),
                lastResumeAt: new Date(),
              }
            : {}),
          ...(input.messageId
            ? { lastMediaProgressMessageId: input.messageId }
            : {}),
        },
        { upsert: true },
      );
      await whatsAppService.sendTextMessage(input.from, mediaOutcome.replyText);
      console.info(
        `[WA-FLOW] accountType=${accountLabel(identity.linked)} intent=MEDIA language=${sessionLanguage} understandingMode=MEDIA llmUsed=false responseType=media status=${mediaOutcome.status} latency=${Date.now() - started}`,
      );
      return;
    }

    if (input.mediaId && input.messageType === "audio" && !text) {
      await acknowledgeMediaProcessing({
        from: input.from,
        phone,
        messageId: input.messageId,
        messageType: "audio",
        language: sessionLanguage,
        priorProgressId: session?.lastMediaProgressMessageId ?? "",
      });
      try {
        const media = await whatsAppService.downloadMedia(input.mediaId);
        const speech = await transcribeWhatsAppAudio({
          buffer: media.buffer,
          mimeType: input.mimeType || media.mimeType,
          languageHint: session?.language,
        });
        text = speech.transcript.trim();
        languageHint = speech.languageHint || languageHint;
        console.info("[WhatsApp] voice transcript ready");
      } catch (error) {
        console.error(
          `[WhatsApp] voice failed reason=${error instanceof Error ? error.name : "unknown"}`,
        );
        await whatsAppService.sendTextMessage(
          input.from,
          voiceUnclearCopy(sessionLanguage),
        );
        return;
      }
      if (!text) {
        await whatsAppService.sendTextMessage(
          input.from,
          voiceUnclearCopy(sessionLanguage),
        );
        return;
      }
    }
    if (!text) {
      return;
    }

    if (isNoResumeMessage(text)) {
      const language = detectLanguage(text, session?.language, languageFromHint(languageHint), true);
      const turnFacts = { situation: "no_resume" as const };
      const localized = await localizeDeterministicReply({
        language,
        facts: turnFacts,
      });
      await WhatsAppSessionModel.findOneAndUpdate(
        { phone },
        { phone, language, lastInteractionAt: new Date() },
        { upsert: true },
      );
      await whatsAppService.sendTextMessage(input.from, localized.text);
      console.info(
        `[WA-FLOW] accountType=${accountLabel(identity.linked)} intent=NO_RESUME language=${language} understandingMode=RULE llmUsed=false responseType=deterministic latency=${Date.now() - started}`,
      );
      return;
    }

    const hint = languageFromHint(languageHint);
    const protocol = detectProtocolTurn(text);
    if (protocol) {
      const language = detectLanguage(text, session?.language, hint, true);
      const name =
        identity.linked === "employer"
          ? identity.employer?.companyName?.trim() || ""
          : identity.seeker?.fullName?.trim() || "";
      const reply = protocolReply(protocol, language, identity.linked, name);
      const conversationState =
        protocol === "greeting"
          ? conversationStateForAccount(identity.linked)
          : ((session?.conversationState as ConversationState | undefined) ?? "");
      await WhatsAppSessionModel.findOneAndUpdate(
        { phone },
        { phone, language, conversationState, lastInteractionAt: new Date() },
        { upsert: true },
      );
      void persistJobSeekerWhatsAppLanguage({
        phone,
        language,
        jobSeekerId: identity.seekerId,
      });
      const sendStarted = Date.now();
      await whatsAppService.sendTextMessage(input.from, reply);
      timing.whatsapp_send = Date.now() - sendStarted;
      const plan = whatsappAiCallPlan({ protocol: true, voice: input.messageType === "audio", needsTranslation: false });
      logWhatsAppBot("LANGUAGE_DETECTED", `language=${language} source=current_message`);
      logWhatsAppBot("LOCAL_INTENT", `intent=${protocol.toUpperCase()} confidence=1 source=protocol`);
      logWhatsAppBot("LLM_SKIPPED", "reason=protocol_template");
      logWhatsAppBot("TEMPLATE_USED", `situation=${protocol}`);
      logWhatsAppBot("REPLY_SENT", `language=${language} protocol=${protocol}`);
      console.info(
        `[WA-FLOW] accountType=${accountLabel(identity.linked)} intent=${protocol.toUpperCase()} language=${language} understandingMode=PROTOCOL llmUsed=false llmCalls=0 dbService=none responseType=template latency=${Date.now() - started}`,
      );
      console.info(
        `[WA-TRACE] messageId=${input.messageId ?? "-"} phone=${maskPhone(phone)} accountType=${accountLabel(identity.linked)} protocol=${protocol} understand=skip db=skip translation=skip chatLlmCalls=${plan.chatLlmCalls} translateCalls=${plan.translateCalls} finalChatLlmCalls=${plan.finalChatLlmCalls} totalMs=${Date.now() - started}`,
      );
      console.info(
        `[WA-AI-COST] stage=PROTOCOL provider=none model=none inputTokens=0 outputTokens=0 totalTokens=0 durationMs=${Date.now() - started}`,
      );
      console.info(
        `[WA-PERF] protocol=${protocol} account_lookup=${timing.account_lookup}ms session_lookup=${timing.session_lookup}ms sarvam_understand=0ms db_query=0ms translate=0ms whatsapp_send=${timing.whatsapp_send}ms total=${Date.now() - started}ms`,
      );
      return;
    }

    const understandStarted = performance.now();
    const followUp = isFollowUpFragment(text);
    const prior = {
      accountType: accountLabel(identity.linked),
      priorLocation: followUp ? session?.pendingLocation || session?.lastLocation || "" : "",
      priorRole: followUp ? session?.pendingCategory || session?.lastCategory || "" : "",
    };
    const menuIntent = detectMenuSelection(text, session?.conversationState);
    let understood: Awaited<ReturnType<typeof understandMessage>>;
    if (menuIntent) {
      const language = detectLanguage(text, session?.language, hint, true);
      understood = { understanding: menuUnderstanding(menuIntent, language), source: "local" };
      timing.sarvam_understand = 0;
      console.info(`[WhatsApp] intent_detection: 0ms source=menu`);
    } else {
      const local = applyAccountAwareIntent(
        applyRoleHints(text, understandLocally(text, session?.language, hint), identity.linked),
        identity.linked,
      );
      const localMs = performance.now() - understandStarted;
      if (!shouldUseLlmFallback(local, text)) {
        understood = { understanding: local, source: "local" };
        timing.sarvam_understand = 0;
        logWhatsAppBot("LANGUAGE_DETECTED", `language=${local.language} source=local`);
        logWhatsAppBot(
          "LOCAL_INTENT",
          `intent=${local.intent} confidence=${local.confidence} location=${local.location || "-"} role=${local.category || "-"}`,
        );
        logWhatsAppBot("LLM_SKIPPED", "reason=confident_local");
        console.info(`[WhatsApp] language_detection: ${Math.round(localMs)}ms`);
        console.info(`[WhatsApp] intent_detection: ${Math.round(localMs)}ms source=local`);
      } else {
        const languageForAck = detectLanguage(text, session?.language, hint);
        logWhatsAppBot(
          "LLM_FALLBACK",
          `reason=ambiguous_or_low_confidence localIntent=${local.intent} confidence=${local.confidence} language=${languageForAck}`,
        );
        const llmStarted = performance.now();
        const [remote] = await Promise.all([
          understandMessage(text, session?.language, hint, prior),
          whatsAppService
            .sendTextMessage(input.from, lookingAtQuestionCopy(languageForAck))
            .catch((error: unknown) => {
              console.error(
                `[WhatsApp] ack_failed reason=${error instanceof Error ? error.name : "unknown"}`,
              );
            }),
        ]);
        understood = {
          understanding: applyAccountAwareIntent(
            applyRoleHints(text, remote.understanding, identity.linked),
            identity.linked,
          ),
          source: remote.source,
        };
        timing.sarvam_understand = performance.now() - understandStarted;
        logWhatsAppBot(
          "LLM_FALLBACK",
          `result=${understood.understanding.intent} language=${understood.understanding.language} source=${understood.source} latencyMs=${Math.round(performance.now() - llmStarted)} success=${understood.source === "sarvam"}`,
        );
        logWhatsAppBot("LANGUAGE_DETECTED", `language=${understood.understanding.language} source=${understood.source}`);
        logWhatsAppBot(
          "LOCAL_INTENT",
          `intent=${understood.understanding.intent} confidence=${understood.understanding.confidence} location=${understood.understanding.location || "-"} role=${understood.understanding.category || "-"}`,
        );
        console.info(`[WhatsApp] language_detection: ${Math.round(localMs)}ms`);
        console.info(
          `[WhatsApp] intent_detection: ${Math.round(timing.sarvam_understand)}ms source=${understood.source}`,
        );
      }
    }
    let merged = applyAccountAwareIntent(
      resolveTurnUnderstanding(
        text,
        understood.understanding,
        activeSearchContext(session),
        session?.lastIntent ?? "",
      ),
      identity.linked,
    );

    // No-match menu follow-up (1–4) after salary-constrained empty search.
    let noMatchWaitOnly = false;
    if (session?.pendingClarification === "job_search_no_match") {
      const choice = resolveNoMatchChoice(text);
      const applied = applyNoMatchChoiceToSearch(
        choice,
        {
          lastCategory: session.lastCategory,
          lastLocation: session.lastLocation,
          lastMinSalary: session.lastMinSalary,
          lastMaxSalary: session.lastMaxSalary,
          lastSalaryBasis: session.lastSalaryBasis,
          locationKind: session.locationKind,
          pendingNearbyCity: session.pendingNearbyCity,
          pendingClarification: session.pendingClarification,
        },
        merged.language,
      );
      if (applied === "wait") {
        noMatchWaitOnly = true;
        logWhatsAppBot("NO_MATCH_CHOICE", "choice=wait");
      } else if (applied) {
        merged = applyAccountAwareIntent(applied, identity.linked);
        logWhatsAppBot(
          "NO_MATCH_CHOICE",
          `choice=${choice} role=${merged.category || "-"} location=${merged.location || "-"} minSalary=${merged.minSalary ?? "-"}`,
        );
      }
    }

    if (noMatchWaitOnly) {
      const language = merged.language;
      await WhatsAppSessionModel.findOneAndUpdate(
        { phone },
        {
          phone,
          language,
          pendingClarification: "",
          pendingNearbyCity: "",
          lastInteractionAt: new Date(),
        },
        { upsert: true },
      );
      await whatsAppService.sendTextMessage(input.from, noMatchWaitCopy(language));
      console.info(
        `[WA-FLOW] accountType=${accountLabel(identity.linked)} intent=JOB_SEARCH_WAIT language=${language} understandingMode=ORCHESTRATOR llmUsed=false responseType=no_match_wait latency=${Date.now() - started}`,
      );
      return;
    }

    // Central role-permission gate: after classify + account resolve, before any
    // role-specific handler / resume match / OpenAI. Session history cannot override.
    const gateActiveRole =
      session?.activeRole === "seeker" || session?.activeRole === "employer"
        ? session.activeRole
        : "";
    const roleDecision = authorizeWhatsAppRole({
      account: identity.linked,
      intent: merged.intent,
      activeRole: gateActiveRole,
    });
    if (!roleDecision.allowed && roleDecision.redirectTo) {
      merged = {
        ...merged,
        crossRole: roleDecision.redirectTo,
        scope: "NONE",
        requiresAuth: false,
      };
      logWhatsAppBot(
        "ROLE_GATE",
        `denied account=${accountLabel(identity.linked)} intent=${merged.intent} redirect=${roleDecision.redirectTo} reason=${roleDecision.reason}`,
      );
    } else if (merged.crossRole === "seeker" || merged.crossRole === "employer") {
      logWhatsAppBot(
        "ROLE_GATE",
        `denied account=${accountLabel(identity.linked)} intent=${merged.intent} redirect=${merged.crossRole} reason=cross_role`,
      );
    }

    // Resume follow-up: seeker-only. Never apply for employer / redirected turns.
    const roleBlocked =
      merged.crossRole === "seeker" || merged.crossRole === "employer";
    const wantsResumeMatch =
      !roleBlocked &&
      /match(ing)?\s+(my\s+)?(resume|cv)|jobs?\s+(for|matching)\s+me|రెజ్యూమ్.?కు సరిపో|रिज़्यूमे के अनुसार|^1[).:]?\s*$/i.test(
        text.trim(),
      );
    const resumeSkills = (session?.lastResumeSkills ?? []).filter(Boolean);
    const resumeFresh =
      session?.lastResumeAt &&
      Date.now() - new Date(session.lastResumeAt).getTime() < 24 * 60 * 60 * 1000;
    if (
      wantsResumeMatch &&
      resumeFresh &&
      resumeSkills.length > 0 &&
      (merged.intent === "JOB_SEARCH" || merged.intent === "UNKNOWN" || merged.intent === "HELP") &&
      !merged.category
    ) {
      const resumeGate = authorizeWhatsAppRole({
        account: identity.linked,
        intent: "JOB_SEARCH",
        activeRole: gateActiveRole,
      });
      if (resumeGate.allowed) {
        merged = {
          ...merged,
          intent: "JOB_SEARCH",
          openSearch: true,
          scope: "PUBLIC_JOBS",
          requiresAuth: false,
          confidence: Math.max(merged.confidence, 0.9),
          // Do not invent a job title from soft skills like "excel" — ask location then browse.
          category: "",
          jobQuery: resumeSkills.slice(0, 3).join(" "),
          crossRole: "",
        };
      } else if (resumeGate.redirectTo) {
        merged = {
          ...merged,
          intent: "JOB_SEARCH",
          crossRole: resumeGate.redirectTo,
          scope: "NONE",
          requiresAuth: false,
        };
      }
    }
    const remembered = (session?.lastJobs ?? []).map((job) => ({
      jobId: job.jobId ?? "",
      jobTitle: job.jobTitle ?? "",
      companyName: job.companyName ?? "",
      cityName: job.cityName ?? "",
      stateName: "",
      salaryLabel: job.salaryLabel ?? "",
    }));

    const dbStarted = Date.now();
    const turn = await buildReply(
      identity,
      merged,
      !roleBlocked &&
        (merged.intent === "JOB_DETAILS" ||
          merged.intent === "JOB_SEARCH" ||
          merged.intent === "JOB_COUNT")
        ? remembered
        : [],
      session?.activeRole ?? "",
    );
    timing.db_query = Date.now() - dbStarted;
    const redirected = merged.crossRole === "seeker" || merged.crossRole === "employer";
    let situation = String(turn.facts.situation ?? "");
    const clarifyLoop = nextClarifyLoopState({
      situation,
      missing: String(turn.facts.missing ?? ""),
      priorMissing: session?.lastClarifyMissing ?? "",
      priorAttempts: session?.clarifyAttempts ?? 0,
    });
    if (clarifyLoop.exhausted) {
      turn.facts = {
        ...turn.facts,
        situation: "clarify_exhausted",
        knownRole: merged.category || session?.lastCategory || "",
        knownLocation: merged.location || session?.lastLocation || "",
        knownMinSalary: merged.minSalary ?? session?.lastMinSalary ?? null,
      };
      situation = "clarify_exhausted";
      logWhatsAppBot(
        "CLARIFY_LOOP_BREAK",
        `missing=${String(turn.facts.missing ?? "-")} priorAttempts=${session?.clarifyAttempts ?? 0}`,
      );
    } else if (clarifyLoop.attempts > 1) {
      logWhatsAppBot(
        "CLARIFY_REPEAT",
        `missing=${clarifyLoop.missing} attempts=${clarifyLoop.attempts}`,
      );
    }
    const toolSelected = selectWhatsAppTool(merged.intent);
    logWhatsAppBot(
      "TOOL_SELECTED",
      `tool=${toolSelected} intent=${merged.intent} situation=${situation || "-"}`,
    );
    const waitingForLocation =
      !redirected &&
      merged.intent === "JOB_SEARCH" &&
      !merged.location &&
      Boolean(merged.category || merged.openSearch);
    const waitingForRole =
      !redirected &&
      merged.intent === "JOB_SEARCH" &&
      Boolean(merged.location) &&
      !merged.category &&
      !merged.openSearch;
    const rememberSearch =
      !redirected &&
      (merged.intent === "JOB_SEARCH" || merged.intent === "JOB_COUNT" || merged.intent === "JOB_DETAILS");
    const rememberGoal = rememberSearch || (!redirected && merged.intent === "POST_JOB");
    const noMatchPending = situation === "job_search_no_match";
    const sessionWrite = WhatsAppSessionModel.findOneAndUpdate(
      { phone },
      {
        phone,
        language: merged.language,
        activeRole: turn.activeRole,
        pendingLocation: waitingForRole ? merged.location : "",
        pendingCategory: waitingForLocation ? merged.category : "",
        pendingOpenSearch: waitingForLocation && merged.openSearch,
        pendingIntent: waitingForLocation || waitingForRole ? merged.intent : "",
        pendingClarification: noMatchPending ? "job_search_no_match" : "",
        pendingNearbyCity: noMatchPending ? String(turn.facts.nearbyCity ?? "") : "",
        lastClarifyMissing: clarifyLoop.missing,
        clarifyAttempts: clarifyLoop.attempts,
        // Persist product intent for follow-ups; clear on role redirect noise.
        lastIntent: redirected ? session?.lastIntent || "" : merged.intent,
        lastLocation: rememberGoal
          ? merged.location || session?.lastLocation || ""
          : session?.lastLocation || "",
        lastCategory: rememberSearch
          ? merged.openSearch
            ? ""
            : merged.category || session?.lastCategory || ""
          : rememberGoal
            ? merged.category || session?.lastCategory || ""
            : session?.lastCategory || "",
        ...(rememberSearch && (merged.intent === "JOB_SEARCH" || merged.intent === "JOB_COUNT")
          ? {
              lastExperience: merged.experienceLevel || "",
              lastExperienceYears: merged.originalExperienceYears ?? null,
              lastExperienceRange: merged.experienceRangeLabel || "",
              lastMinSalary: merged.minSalary ?? null,
              lastMaxSalary: merged.maxSalary ?? null,
              lastSalaryBasis: merged.salaryBasis || "",
              locationKind: merged.locationKind || "",
            }
          : {}),
        ...(rememberSearch
          ? turn.shownJobs.length > 0
            ? {
                lastJobs: turn.shownJobs.slice(0, 3).map((job) => ({
                  jobId: job.jobId,
                  jobTitle: job.jobTitle,
                  companyName: job.companyName,
                  cityName: job.cityName,
                  salaryLabel: job.salaryLabel,
                })),
              }
            : {}
          : redirected
            ? {}
            : { lastJobs: [] }),
        lastInteractionAt: new Date(),
        conversationState:
          merged.intent === "GREETING"
            ? conversationStateForAccount(identity.linked)
            : menuIntent
              ? ""
              : ((session?.conversationState as ConversationState | undefined) ?? ""),
      },
      { upsert: true },
    );
    void persistJobSeekerWhatsAppLanguage({
      phone,
      language: merged.language,
      jobSeekerId: identity.seekerId,
    });
    const localizeStarted = performance.now();
    const [localized] = await Promise.all([
      localizeDeterministicReply({
        language: merged.language,
        facts: {
          ...turn.facts,
          intent: merged.intent,
          accountType: turn.accountType,
          applyOrigin: env.FRONTEND_URL,
        },
      }),
      sessionWrite,
    ]);
    const translateMs = performance.now() - localizeStarted;
    let replyText = localized.text;
    let openAiUsed = false;
    if (localized.skipped) {
      logWhatsAppBot("TEMPLATE_USED", `situation=${String(turn.facts.situation ?? "-")} language=${merged.language}`);
    }
    const assistEligible = shouldUseOpenAiAssist({
      enabled: env.WHATSAPP_OPENAI_ASSIST_ENABLED,
      hasApiKey: Boolean(env.OPENAI_API_KEY.trim()),
      model: env.OPENAI_MODEL,
      protocol: false,
      menuIntent: Boolean(menuIntent),
      situation: String(turn.facts.situation ?? ""),
      userText: text,
      understandingSource: menuIntent
        ? "menu"
        : understood.source === "sarvam"
          ? "sarvam"
          : "local",
      language: merged.language,
    });
    if (assistEligible) {
      const assist = await assistWhatsAppReply({
        userText: text,
        language: merged.language,
        deterministicReply: localized.text,
        facts: turn.facts,
        intent: merged.intent,
      });
      if (assist.ok) {
        replyText = assist.response_text;
        openAiUsed = true;
        logWhatsAppBot(
          "OPENAI_ASSIST",
          `situation=${String(turn.facts.situation ?? "-")} model=${assist.model} latencyMs=${assist.latencyMs}`,
        );
      } else {
        logWhatsAppBot(
          "OPENAI_ASSIST_SKIP",
          `reason=${assist.reason} latencyMs=${assist.latencyMs}`,
        );
      }
    }
    const plan = whatsappAiCallPlan({
      protocol: false,
      voice: input.messageType === "audio",
      needsTranslation: !localized.skipped,
      skipUnderstand: understood.source === "local",
    });
    const trace = describeTurn(merged, turn);
    const llmUsed = understood.source === "sarvam";
    console.info(
      `[WA-FLOW] accountType=${accountLabel(identity.linked)} intent=${merged.intent} language=${merged.language} understandingMode=${menuIntent ? "MENU" : llmUsed ? "LLM_FALLBACK" : "RULE"} llmUsed=${llmUsed} openAiAssist=${openAiUsed} llmCalls=${plan.chatLlmCalls} dbService=${trace.service} responseType=${openAiUsed ? "openai_assist" : "deterministic"} latency=${Date.now() - started}`,
    );
    console.info(
      [
        "[WA-TRACE]",
        `messageId=${input.messageId ?? "-"}`,
        `phone=${maskPhone(phone)}`,
        `accountType=${accountLabel(identity.linked)}`,
        `intent=${merged.intent}`,
        `language=${merged.language}`,
        `generatedLanguage=${localized.generatedLanguage}`,
        `role=${merged.category || "ANY"}`,
        `location=${merged.location || "-"}`,
        `source=${understood.source}`,
        `understand=${understood.source === "local" ? "local" : "chat-llm"}`,
        `db=${trace.service}`,
        `response=deterministic`,
        `translation=${localized.skipped ? "skip" : localized.failed ? "failed" : localized.translated ? "once" : "none"}`,
        `chatLlmCalls=${plan.chatLlmCalls}`,
        `finalChatLlmCalls=${plan.finalChatLlmCalls}`,
        `translateCalls=${plan.translateCalls}`,
        `service=${trace.service}`,
        `dbResults=${trace.resultCount}`,
        `facts=${String(turn.facts.situation ?? "-")}`,
        `totalMs=${Date.now() - started}`,
      ].join(" "),
    );
    console.info(
      [
        "[WHATSAPP]",
        `phone=${maskPhone(phone)}`,
        `messageType=${input.messageType ?? "text"}`,
        "[ACCOUNT]",
        `accountType=${accountLabel(identity.linked)}`,
        `seekerId=${identity.seekerId || "-"}`,
        `employerId=${identity.employerId || "-"}`,
        "[SARVAM UNDERSTANDING]",
        `source=${understood.source}`,
        `textChars=${text.trim().length}`,
        `intent=${merged.intent}`,
        `language=${merged.language}`,
        `location=${merged.location || "-"}`,
        `role=${merged.category || "-"}`,
        `confidence=${merged.confidence}`,
        "[AUTHORIZATION]",
        `allowed=${trace.allowed}`,
        `scope=${trace.scope}`,
        "[DATABASE]",
        `service=${trace.service}`,
        `filters=${trace.filters}`,
        `resultCount=${trace.resultCount}`,
        "[REPLY]",
        `language=${merged.language}`,
        `deterministic=${openAiUsed ? "base" : "yes"}`,
        `openAiAssist=${openAiUsed ? "yes" : "no"}`,
        `chatLlmFinal=no`,
        `translated=${localized.translated ? "yes" : "no"}`,
      ].join(" "),
    );
    const sendStarted = Date.now();
    await whatsAppService.sendTextMessage(input.from, replyText);
    timing.whatsapp_send = Date.now() - sendStarted;
    logWhatsAppBot(
      "REPLY_SENT",
      `language=${merged.language} intent=${merged.intent} situation=${String(turn.facts.situation ?? "-")} llm=${understood.source === "sarvam"}`,
    );
    const totalMs = Date.now() - started;
    console.info(`[WhatsApp] job_search: ${timing.db_query}ms`);
    console.info(`[WhatsApp] LLM: ${Math.round(timing.sarvam_understand)}ms`);
    console.info(`[WhatsApp] translation: ${Math.round(translateMs)}ms`);
    console.info(`[WhatsApp] whatsapp_send: ${timing.whatsapp_send}ms`);
    console.info(`[WhatsApp] total: ${totalMs}ms`);
    console.info(
      `[WA-PERF] account_lookup=${timing.account_lookup}ms session_lookup=${timing.session_lookup}ms sarvam_understand=${timing.sarvam_understand}ms db_query=${timing.db_query}ms translate=${translateMs}ms whatsapp_send=${timing.whatsapp_send}ms total=${Date.now() - started}ms`,
    );
  } catch (error) {
    console.error(
      `[WhatsAppBot] failed phone=${phoneHash(phone)} messageId=${input.messageId ?? "-"} type=${input.messageType ?? "text"} ms=${Date.now() - started} reason=${
        error instanceof Error ? error.name : "unknown"
      }`,
    );
    await whatsAppService.sendTextMessage(
      input.from,
      serviceErrorCopy(detectLanguage(input.text ?? "", undefined, undefined, true)),
    );
  }
}

type BotTurn = {
  text: string;
  facts: Record<string, unknown>;
  shownJobs: PublicJobFact[];
  accountType: AccountKind;
  activeRole: "" | "seeker" | "employer";
};

function say(
  text: string,
  shownJobs: PublicJobFact[] = [],
  meta: { accountType: AccountKind; activeRole: "" | "seeker" | "employer" } = {
    accountType: "none",
    activeRole: "",
  },
  facts: Record<string, unknown> = {},
): BotTurn {
  return {
    text,
    facts: Object.keys(facts).length > 0 ? facts : { note: text },
    shownJobs,
    ...meta,
  };
}

function resolveActiveRole(
  linked: AccountKind,
  saved: string,
  picked: "seeker" | "employer" | null,
): "" | "seeker" | "employer" {
  if (linked === "seeker") return "seeker";
  if (linked === "employer") return "employer";
  if (linked !== "both") return "";
  if (picked) return picked;
  if (saved === "seeker" || saved === "employer") return saved;
  return "";
}

async function buildReply(
  identity: LinkedAccount,
  understanding: BotUnderstanding,
  remembered: PublicJobFact[],
  savedRole: string,
): Promise<BotTurn> {
  const { seeker, employer, linked } = identity;
  const activeRole = resolveActiveRole(
    linked,
    savedRole,
    understanding.scope === "OWN_EMPLOYER_DATA"
      ? "employer"
      : understanding.scope === "OWN_DATA"
        ? "seeker"
        : null,
  );
  const accountType: AccountKind =
    linked === "both" ? (activeRole === "employer" ? "employer" : activeRole === "seeker" ? "seeker" : "both") : linked;
  const meta = { accountType: linked === "both" && !activeRole ? "both" : accountType, activeRole };
  const reply = (facts: Record<string, unknown>, shownJobs: PublicJobFact[] = []) =>
    say(
      "",
      shownJobs,
      meta,
      linked === "none"
        ? { ...facts, registration: siteUrls(understanding.language) }
        : facts,
    );
  const asSeeker = accountType === "seeker";
  const asEmployer = accountType === "employer";

  const displayName = asEmployer
    ? employer?.companyName?.trim() || ""
    : seeker?.fullName?.trim() || "";

  if (understanding.crossRole === "employer" || understanding.crossRole === "seeker") {
    const urls = siteUrls(understanding.language);
    return reply({
      situation: "role_redirect",
      target: understanding.crossRole,
      url: understanding.crossRole === "employer" ? urls.employerRegisterUrl : urls.seekerRegisterUrl,
    });
  }
  if (
    linked === "both" &&
    !activeRole &&
    understanding.scope !== "PUBLIC_JOBS"
  ) {
    return reply({ situation: "choose_account", accountType: "both" });
  }
  if (linked === "none") {
    const action = unknownUserAction(understanding);
    logWhatsAppBot(
      "UNKNOWN_USER",
      `action=${action} intent=${understanding.intent} location=${understanding.location || "-"} role=${understanding.category || "-"}`,
    );
    if (action === "greeting") {
      return reply({ situation: "greeting", accountType: "none", name: "" });
    }
    if (action === "employer_register") {
      const incomplete =
        identity.progress === "incomplete_employer" || identity.progress === "incomplete_both";
      return reply({
        situation: "new_user",
        reason: incomplete ? "incomplete_employer" : "employer_account_required",
      });
    }
    if (action === "seeker_register") {
      const incomplete =
        identity.progress === "incomplete_seeker" || identity.progress === "incomplete_both";
      return reply({
        situation: "new_user",
        reason: incomplete ? "incomplete_seeker" : "job_seeker_account_required",
      });
    }
    if (action === "how_to_apply") {
      return reply({ situation: "how_to_apply", accountType: "none" });
    }
    if (action === "out_of_scope") {
      return reply({ situation: "out_of_scope", accountType: "none" });
    }
    if (action === "clarify") {
      return reply({ situation: "clarify", missing: "purpose" });
    }
  }

  switch (understanding.intent) {
    case "GREETING":
      return reply({ situation: "greeting", accountType, name: displayName });
    case "HELP":
    case "UNRELATED":
      return reply({ situation: understanding.intent === "UNRELATED" ? "out_of_scope" : "help", accountType });
    case "CLARIFY":
      return reply({ situation: "clarify", accountType, missing: "which_account_data" });
    case "HOW_TO_APPLY":
      return reply({ situation: "how_to_apply", accountType });
    case "MY_SKILLS":
      if (!asSeeker || !seeker) return reply({ situation: "denied", reason: "seeker_required" });
      return reply({
        situation: "profile",
        name: seeker.fullName,
        role: seeker.jobRole || "",
        skills: (seeker.skills ?? []).slice(0, 12),
      });
    case "JOB_DETAILS": {
      const ordinal = understanding.jobOrdinal ?? 0;
      const picked = ordinal > 0 ? remembered[ordinal - 1] : undefined;
      if (ordinal > 0 && !picked) return reply({ situation: "clarify", missing: "which_job" });
      const jobs = picked ? [picked] : remembered;
      if (jobs.length === 0) return reply({ situation: "clarify", missing: "which_job" });
      return reply(
        {
          situation: "job_details",
          focus: understanding.focus || "list",
          jobs: jobs.map(publicJobFact),
        },
        jobs,
      );
    }
    case "PROFILE_MATCH":
    case "PROFILE_JOBS": {
      if (!asSeeker || !seeker) return reply({ situation: "denied", reason: "seeker_required" });
      const location =
        understanding.location || seeker.preferredJobLocation || seeker.city || "";
      return searchJobs(
        {
          ...understanding,
          category: seeker.jobRole?.trim() || "",
          location,
          openSearch: !seeker.jobRole?.trim(),
        },
        seeker._id.toString(),
        meta,
        understanding.language,
      );
    }
    case "APPLIED_COVERAGE": {
      if (!asSeeker || !seeker) return reply({ situation: "denied", reason: "seeker_required" });
      return coverageReply(
        understanding,
        seeker._id.toString(),
        seeker.city || "",
        meta,
        understanding.language,
      );
    }
    case "MY_APPLICATIONS":
    case "APPLICATION_COUNT":
    case "APPLICATION_STATUS": {
      if (!asSeeker || !seeker) return reply({ situation: "denied", reason: "seeker_required" });
      const result = await applicationService.listForSeeker({
        jobSeekerId: seeker._id.toString(),
        search: understanding.category || understanding.jobQuery,
        limit: 3,
        page: 1,
        sort: "newest",
      });
      const mode =
        understanding.intent === "APPLICATION_COUNT"
          ? "count"
          : understanding.intent === "APPLICATION_STATUS"
            ? "status"
            : "list";
      return reply({
        situation: mode,
        total: result.pagination.total,
        applications: result.applications.slice(0, 3).map((item) => ({
          jobTitle: item.jobTitle,
          companyName: item.companyName,
          status: item.status,
        })),
      });
    }
    case "EMPLOYER_JOBS":
    case "EMPLOYER_JOB_STATUS":
    case "EMPLOYER_APPLICATION_COUNT": {
      if (!asEmployer || !employer) return reply({ situation: "denied", reason: "employer_required" });
      const query = listEmployerJobsQuerySchema.parse({
        limit: 5,
        page: 1,
        search: understanding.category || "",
      });
      const listed = await jobService.listEmployerJobs(employer._id.toString(), query);
      const ranked = [...listed.jobs].sort((a, b) => b.applications - a.applications);
      const totalApplications = ranked.reduce((sum, job) => sum + job.applications, 0);
      return reply({
        situation: understanding.intent,
        totalApplications,
        jobs: ranked.slice(0, 3).map((job) => ({
          jobTitle: job.jobTitle,
          status: job.status,
          applications: job.applications,
        })),
      });
    }
    case "POST_JOB": {
      if (!asEmployer || !employer) return reply({ situation: "denied", reason: "employer_required" });
      const urls = siteUrls(understanding.language);
      const canPost =
        employer.verificationStatus === "verified" &&
        (employer.isProfileComplete == null || employer.isProfileComplete);
      const verification = employer.verificationStatus === "rejected"
        ? "rejected"
        : canPost
          ? "verified"
          : "pending";
      return reply({
        situation: "post_job",
        verification,
        name: employer.companyName || "",
        role: understanding.category,
        location: understanding.location,
        postJobUrl: urls.postJobUrl,
        profileUrl: urls.employerProfileUrl,
      });
    }
    case "ACCOUNT_STATUS": {
      if (understanding.jobQuery === "verification_timeline") {
        return reply({ situation: "verification_timeline_unknown", accountType });
      }
      if (asEmployer && employer) {
        const urls = siteUrls(understanding.language);
        return reply({
          situation: "account_status",
          accountType: "employer",
          verification: employer.verificationStatus || "pending",
          name: employer.companyName || "",
          profileUrl: urls.employerProfileUrl,
          remarks: employer.verificationRemarks || "",
        });
      }
      if (asSeeker && seeker) {
        return reply({
          situation: "account_status",
          accountType: "seeker",
          registrationStatus: seeker.registrationStatus || "",
          whatsappVerified: Boolean(seeker.isWhatsappVerified),
          accountStatus: seeker.accountStatus || "active",
          name: seeker.fullName || "",
          role: seeker.jobRole || "",
        });
      }
      if (linked === "both" && !activeRole) {
        return reply({ situation: "choose_account", accountType: "both" });
      }
      return reply({
        situation: "denied",
        reason: asEmployer ? "employer_required" : "seeker_required",
      });
    }
    case "JOB_COUNT":
    case "JOB_SEARCH":
    default: {
      if (understanding.intent === "UNKNOWN") {
        return reply({ situation: "clarify", missing: linked === "none" ? "purpose" : "intent" });
      }
      if (!understanding.location && !understanding.anyLocation) {
        return reply({ situation: "clarify", missing: "location" });
      }
      if (!understanding.category && !understanding.openSearch) {
        return reply({ situation: "clarify", missing: "role" });
      }
      return searchJobs(
        understanding,
        asSeeker ? seeker?._id.toString() : undefined,
        meta,
        understanding.language,
        remembered,
      );
    }
  }
}

/**
 * Runtime job search path (authorized):
 * 1. processInboundTurn → authorizeWhatsAppRole(intent)
 * 2. buildReply → searchJobs (defensive employer block again)
 * 3. loadJobs → jobService.listPublicActiveJobs
 *
 * Typed tools (`executeSearchPublicJobs`) share the same role gate + jobService
 * but are not yet the sole call site — they are the authorized capability surface
 * for tests / future tool-calling. Do not treat tool.ok empty as a DB failure.
 */
async function searchJobs(
  understanding: BotUnderstanding,
  jobSeekerId: string | undefined,
  meta: { accountType: AccountKind; activeRole: "" | "seeker" | "employer" },
  language?: string,
  remembered: PublicJobFact[] = [],
): Promise<BotTurn> {
  // Defensive: employer accounts must never reach public candidate job search.
  if (meta.accountType === "employer" || meta.activeRole === "employer") {
    const urls = siteUrls(language);
    return say("", [], meta, {
      situation: "role_redirect",
      target: "seeker",
      url: urls.seekerRegisterUrl,
    });
  }
  try {
    return await runAuthorizedJobSearch(understanding, jobSeekerId, meta, language, remembered);
  } catch (error) {
    logWhatsAppBot(
      "JOB_SEARCH_FAILED",
      `accountType=${meta.accountType} reason=${error instanceof Error ? error.name : "unknown"}`,
    );
    // Never present a database/timeout failure as situation=jobs with empty=true.
    return say("", [], meta, {
      situation: "search_failed",
      location: understanding.location,
      role: understanding.category,
      accountType: meta.accountType,
    });
  }
}

async function runAuthorizedJobSearch(
  understanding: BotUnderstanding,
  jobSeekerId: string | undefined,
  meta: { accountType: AccountKind; activeRole: "" | "seeker" | "employer" },
  language: string | undefined,
  remembered: PublicJobFact[],
): Promise<BotTurn> {
  const lookup = publicJobFilters(understanding);
  const role = lookup.search || "ANY";
  const appliedFilters = formatAppliedFilters(understanding);
  const excludeIds = understanding.showMore
    ? new Set(remembered.map((job) => job.jobId).filter(Boolean))
    : new Set<string>();
  logWhatsAppBot(
    "JOB_SEARCH",
    `accountType=${meta.accountType} location=${lookup.city || lookup.state || "-"} role=${role} experience=${lookup.experience || "-"} minSalary=${lookup.minSalary ?? "-"} showMore=${Boolean(understanding.showMore)} language=${language || "-"}`,
  );
  const primaryRaw = await loadJobs(lookup, jobSeekerId, language);
  const primaryJobs = primaryRaw.jobs.filter((job) => !excludeIds.has(job.jobId));
  const primary = {
    ...primaryRaw,
    jobs: primaryJobs,
    total: Math.max(0, primaryRaw.total - (primaryRaw.jobs.length - primaryJobs.length)),
  };
  if (primary.jobs.length > 0) {
    logWhatsAppJobs({
      intent: understanding.intent,
      location: lookup.city,
      role,
      dbMatches: primary.dbMatches,
      jobsReturned: primary.jobs.length,
      jobsForAI: primary.jobs.length,
      path: "primary",
      cities: primary.jobs.map((job) => job.cityName),
    });
    console.info(
      `[WHATSAPP-BOT] JOB_RESULTS accountType=${meta.accountType} location=${lookup.city || "-"} role=${role} count=${primary.jobs.length}`,
    );
    return say("", primary.jobs, meta, publicJobReplyFacts(meta, {
      situation: "jobs",
      location: understanding.location,
      role: understanding.category,
      appliedFilters,
      empty: false,
      total: primary.total,
      more: primary.hasMore,
      jobs: primary.jobs.map(publicJobFact),
    }, language));
  }

  // Salary-constrained empty search: never silently show a lower-paying job as a match.
  if (understanding.minSalary != null && understanding.location) {
    const unconstrained = await loadJobs(
      { ...lookup, minSalary: undefined, maxSalary: undefined },
      jobSeekerId,
      language,
    );
    const lowerSalaryJobs = unconstrained.jobs.filter((job) => {
      const maxKnown = parseSalaryLabelMax(job.salaryLabel);
      return maxKnown != null && maxKnown < Number(understanding.minSalary);
    });
    const undisclosedJobs = unconstrained.jobs.filter((job) => !job.salaryLabel.trim());
    const nearbyCity = parentCity(understanding.location);
    return say("", [], meta, publicJobReplyFacts(meta, {
      situation: "job_search_no_match",
      location: understanding.location,
      role: understanding.category,
      minSalary: understanding.minSalary,
      appliedFilters,
      lowerSalaryCount: lowerSalaryJobs.length,
      undisclosedCount: undisclosedJobs.length,
      nearbyCity: nearbyCity || "",
      showMore: Boolean(understanding.showMore),
    }, language));
  }

  if (understanding.showMore) {
    return say("", [], meta, publicJobReplyFacts(meta, {
      situation: "job_search_no_more",
      location: understanding.location,
      role: understanding.category,
      minSalary: understanding.minSalary ?? null,
      appliedFilters,
    }, language));
  }

  // Neighbourhood → parent city only when no salary constraint (existing behaviour).
  const widerCity = parentCity(understanding.location);
  const wider = widerCity
    ? await loadJobs({ ...lookup, city: widerCity, state: "" }, jobSeekerId, language)
    : { jobs: [], total: 0, dbMatches: 0, hasMore: false };
  logWhatsAppJobs({
    intent: understanding.intent,
    location: wider.jobs.length > 0 ? widerCity : lookup.city,
    role,
    dbMatches: wider.dbMatches,
    jobsReturned: wider.jobs.length,
    jobsForAI: wider.jobs.length,
    path: wider.jobs.length > 0 ? "parent_city" : "empty",
    cities: wider.jobs.map((job) => job.cityName),
  });
  console.info(
    `[WHATSAPP-BOT] ${wider.jobs.length > 0 ? "JOB_RESULTS" : "JOB_SEARCH_EMPTY"} accountType=${meta.accountType} location=${wider.jobs.length > 0 ? widerCity : lookup.city || "-"} role=${role} count=${wider.jobs.length} path=${wider.jobs.length > 0 ? "parent_city" : "empty"}`,
  );
  return say("", wider.jobs, meta, publicJobReplyFacts(meta, {
    situation: "jobs",
    location: understanding.location,
    role: understanding.category,
    appliedFilters,
    empty: wider.total === 0,
    total: wider.total,
    more: wider.hasMore,
    widenedTo: wider.jobs.length > 0 ? widerCity : "",
    jobs: wider.jobs.map(publicJobFact),
  }, language));
}

function parseSalaryLabelMax(label: string): number | null {
  const cleaned = label.replace(/,/g, "");
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

function publicJobReplyFacts(
  meta: { accountType: AccountKind },
  facts: Record<string, unknown>,
  language?: string,
): Record<string, unknown> {
  return {
    ...facts,
    accountType: meta.accountType,
    ...(meta.accountType === "none" ? { registration: siteUrls(language) } : {}),
  };
}

function publicJobFact(job: PublicJobFact) {
  return {
    jobTitle: job.jobTitle,
    companyName: job.companyName,
    cityName: job.cityName,
    salary: job.salaryLabel,
    jobId: job.jobId,
  };
}

async function coverageReply(
  understanding: BotUnderstanding,
  jobSeekerId: string,
  profileCity: string,
  meta: { accountType: AccountKind; activeRole: "" | "seeker" | "employer" },
  language?: string,
): Promise<BotTurn> {
  const lookup = publicJobFilters({
    category: understanding.category,
    location: understanding.location || profileCity,
    openSearch: !understanding.category,
    locationKind: understanding.location ? understanding.locationKind : "city",
  });
  const [jobs, applications] = await Promise.all([
    loadJobs(lookup, jobSeekerId, language),
    applicationService.listForSeeker({
      jobSeekerId,
      limit: 10,
      page: 1,
      sort: "newest",
    }),
  ]);
  const appliedIds = new Set(applications.applications.map((item) => item.publicJobId));
  const matched = jobs.jobs.filter((job) => appliedIds.has(job.jobId)).length;
  return say("", [], meta, {
    situation: "applied_coverage",
    applied: applications.pagination.total,
    compared: jobs.jobs.length,
    matched,
    totalListed: jobs.total,
    bounded: jobs.total > jobs.jobs.length,
  });
}

function logWhatsAppJobs(input: {
  intent: string;
  location: string;
  role: string;
  dbMatches: number;
  jobsReturned: number;
  jobsForAI: number;
  path?: "primary" | "parent_city" | "empty";
  cities?: string[];
}): void {
  const cities = [...new Set(input.cities ?? [])].join("|") || "-";
  console.info(
    `[WA-JOBS] intent=${input.intent} location=${input.location || "-"} role=${input.role} dbMatches=${input.dbMatches} jobsReturned=${input.jobsReturned} jobsForAI=${input.jobsForAI} path=${input.path ?? "-"} cities=${cities}`,
  );
}

/**
 * Matches roles on canonical source titles (list API without language), then
 * overlays a stored Mongo translation for display. Never enqueues translation.
 */
async function loadJobs(
  filters: {
    search: string;
    city: string;
    state: string;
    experience: string;
    minSalary?: number;
    maxSalary?: number;
  },
  jobSeekerId?: string,
  language?: string,
): Promise<{ jobs: PublicJobFact[]; total: number; dbMatches: number; hasMore: boolean }> {
  const cityAliases = placeCityAliases(filters.city);
  const query = publicJobsQuerySchema.parse({
    search: filters.search,
    city: cityAliases.join(","),
    ...(filters.state ? { state: filters.state } : {}),
    ...(filters.experience ? { experience: filters.experience } : {}),
    ...(filters.minSalary != null ? { minSalary: filters.minSalary } : {}),
    ...(filters.maxSalary != null ? { maxSalary: filters.maxSalary } : {}),
    limit: PUBLIC_JOB_FETCH_LIMIT,
    page: 1,
    sort: "latest",
  });
  const result = await jobService.listPublicActiveJobs(query, jobSeekerId);
  const citySlugs = new Set(cityAliases.map(toLocationSlug));
  const inCity =
    citySlugs.size > 0
      ? result.jobs.filter(
          (job) =>
            citySlugs.has(toLocationSlug(job.city)) || citySlugs.has(toLocationSlug(job.cityName)),
        )
      : result.jobs;
  const selected = selectVerifiedJobsForReply(
    inCity,
    filters.search,
    result.pagination.total - (result.jobs.length - inCity.length),
  );
  const jobs = await overlayStoredWhatsAppJobTitles(
    selected.jobs.map((job) => ({
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      cityName: job.cityName,
      stateName: job.stateName,
      jobId: job.jobId,
      salaryLabel: formatSalaryLabel(job),
    })),
    language,
  );
  return {
    total: selected.total,
    dbMatches: result.pagination.total,
    hasMore: selected.hasMore,
    jobs,
  };
}

async function overlayStoredWhatsAppJobTitles(
  jobs: PublicJobFact[],
  language?: string,
): Promise<PublicJobFact[]> {
  const requested = parseJobContentLanguage(language);
  if (!requested || jobs.length === 0) {
    return jobs;
  }
  const docs = await JobModel.find({ jobId: { $in: jobs.map((job) => job.jobId) } })
    .select("jobId jobTitle description interviewInstructions contentLanguage contentTranslations")
    .lean();
  const byId = new Map(docs.map((doc) => [String(doc.jobId), doc]));
  return jobs.map((job) => {
    const stored = byId.get(job.jobId);
    if (!stored) {
      return job;
    }
    const localized = resolveJobContent(
      {
        jobTitle: String(stored.jobTitle ?? job.jobTitle),
        description: typeof stored.description === "string" ? stored.description : "",
        interviewInstructions:
          typeof stored.interviewInstructions === "string" ? stored.interviewInstructions : "",
        contentLanguage: stored.contentLanguage ?? null,
        contentTranslations:
          stored.contentTranslations && typeof stored.contentTranslations === "object"
            ? (stored.contentTranslations as never)
            : null,
      },
      requested,
    );
    return {
      ...job,
      jobTitle: localized.jobTitle || job.jobTitle,
    };
  });
}
