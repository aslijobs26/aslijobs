import { createHash } from "node:crypto";
import { env } from "../../config/env.js";
import { applicationService } from "../applications/application.service.js";
import { jobService, toLocationSlug } from "../jobs/job.service.js";
import {
  listEmployerJobsQuerySchema,
  publicJobsQuerySchema,
} from "../jobs/job.validation.js";
import { resolveWhatsAppLinkedAccount } from "../accounts/phone-account.service.js";
import { WhatsAppSessionModel } from "./whatsapp-session.model.js";
import { WhatsAppService } from "./whatsapp.service.js";
import { transcribeWhatsAppAudio, understandMessage } from "./sarvam.client.js";
import { localizeDeterministicReply, whatsappAiCallPlan } from "./sarvam-translate.client.js";
import {
  applyAccountAwareIntent,
  applyRoleHints,
  conversationStateForAccount,
  detectLanguage,
  detectMenuSelection,
  detectProtocolTurn,
  formatSalaryLabel,
  isFollowUpFragment,
  languageFromHint,
  lookingAtQuestionCopy,
  menuUnderstanding,
  nationalPhone,
  parentCity,
  placeCityAliases,
  PUBLIC_JOB_FETCH_LIMIT,
  resolveTurnUnderstanding,
  selectVerifiedJobsForReply,
  protocolReply,
  serviceErrorCopy,
  shouldUseLlmFallback,
  toPublicJobsLookup,
  understandLocally,
  unknownUserAction,
  voiceUnclearCopy,
  type AccountKind,
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
  } | null;
  employer: {
    _id: { toString(): string };
    companyName?: string;
    verificationStatus?: "pending" | "verified" | "rejected";
    isProfileComplete?: boolean;
  } | null;
  linked: AccountKind;
  seekerId: string;
  employerId: string;
};

function toAccountKind(kind: "job_seeker" | "employer" | "none" | "both"): AccountKind {
  if (kind === "job_seeker") return "seeker";
  if (kind === "employer") return "employer";
  if (kind === "both") return "both";
  return "none";
}

async function lookupAccount(phone: string): Promise<LinkedAccount> {
  const cached = accountCache.get(phone);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  const resolved = await resolveWhatsAppLinkedAccount(phone);
  const linked = toAccountKind(resolved.kind);
  const value: LinkedAccount = {
    seeker: resolved.jobSeeker,
    employer: resolved.employer,
    linked,
    seekerId: resolved.jobSeeker?._id.toString() ?? "",
    employerId: resolved.employer?._id.toString() ?? "",
  };
  accountCache.set(phone, { value, expires: Date.now() + ACCOUNT_CACHE_MS });
  return value;
}

function siteUrls(): {
  seekerRegisterUrl: string;
  employerRegisterUrl: string;
  postJobUrl: string;
  employerProfileUrl: string;
} {
  const origin = env.FRONTEND_URL.replace(/\/+$/, "");
  return {
    seekerRegisterUrl: `${origin}/job-seeker/register`,
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
    filters: `role=${understanding.category || "-"} city=${understanding.location || "-"}`,
    resultCount: typeof turn.facts.totalApplications === "number" ? turn.facts.totalApplications : total,
  };
}

function logWhatsAppBot(event: string, details = ""): void {
  console.info(`[WHATSAPP-BOT] ${event}${details ? ` ${details}` : ""}`);
}

export async function handleConversationalMessage(input: {
  from: string;
  text?: string;
  languageHint?: string;
  messageId?: string;
  messageType?: string;
  mediaId?: string;
  mimeType?: string;
}): Promise<void> {
  const phone = nationalPhone(input.from);
  if (!allowReply(phone)) {
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
    const [session, identity] = await Promise.all([
      WhatsAppSessionModel.findOne({ phone }).lean(),
      lookupAccount(phone),
    ]);
    timing.account_lookup = Date.now() - lookupStarted;
    timing.session_lookup = timing.account_lookup;
    logWhatsAppBot(
      "ACCOUNT_RESOLVED",
      `accountType=${accountLabel(identity.linked)} seeker=${identity.seekerId ? "yes" : "no"} employer=${identity.employerId ? "yes" : "no"}`,
    );

    let text = input.text?.trim() ?? "";
    let languageHint = input.languageHint;
    if (input.mediaId && !text) {
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
          voiceUnclearCopy((session?.language as "en" | "hi" | "te" | "ta" | "kn" | "ml") ?? "en"),
        );
        return;
      }
      if (!text) {
        await whatsAppService.sendTextMessage(
          input.from,
          voiceUnclearCopy((session?.language as "en" | "hi" | "te" | "ta" | "kn" | "ml") ?? "en"),
        );
        return;
      }
    }
    if (!text) {
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
    const merged = resolveTurnUnderstanding(
      text,
      understood.understanding,
      session
        ? {
            location: session.pendingLocation || session.lastLocation || "",
            category: session.pendingCategory || session.lastCategory || "",
            openSearch: Boolean(session.pendingOpenSearch),
            intent: session.pendingIntent || "",
          }
        : null,
    );
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
      merged.intent === "JOB_DETAILS" ? remembered : [],
      session?.activeRole ?? "",
    );
    timing.db_query = Date.now() - dbStarted;
    const waitingForLocation =
      merged.intent === "JOB_SEARCH" && !merged.location && Boolean(merged.category || merged.openSearch);
    const waitingForRole =
      merged.intent === "JOB_SEARCH" && Boolean(merged.location) && !merged.category && !merged.openSearch;
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
        lastLocation:
          merged.intent === "JOB_SEARCH" || merged.intent === "JOB_COUNT" || merged.intent === "JOB_DETAILS"
            ? merged.location || session?.lastLocation || ""
            : session?.lastLocation || "",
        lastCategory:
          merged.intent === "JOB_SEARCH" || merged.intent === "JOB_COUNT"
            ? merged.openSearch
              ? ""
              : merged.category || session?.lastCategory || ""
            : session?.lastCategory || "",
        ...(merged.intent === "JOB_SEARCH" || merged.intent === "JOB_COUNT" || merged.intent === "JOB_DETAILS"
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
    const replyText = localized.text;
    if (localized.skipped) {
      logWhatsAppBot("TEMPLATE_USED", `situation=${String(turn.facts.situation ?? "-")} language=${merged.language}`);
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
      `[WA-FLOW] accountType=${accountLabel(identity.linked)} intent=${merged.intent} language=${merged.language} understandingMode=${menuIntent ? "MENU" : llmUsed ? "LLM_FALLBACK" : "RULE"} llmUsed=${llmUsed} llmCalls=${plan.chatLlmCalls} dbService=${trace.service} responseType=deterministic latency=${Date.now() - started}`,
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
        `deterministic=yes`,
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
      linked === "none" ? { ...facts, registration: siteUrls() } : facts,
    );
  const asSeeker = accountType === "seeker";
  const asEmployer = accountType === "employer";

  const displayName = asEmployer
    ? employer?.companyName?.trim() || ""
    : seeker?.fullName?.trim() || "";

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
      return reply({ situation: "new_user", reason: "employer_account_required" });
    }
    if (action === "seeker_register") {
      return reply({ situation: "new_user", reason: "job_seeker_account_required" });
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
      if (remembered.length === 0) return reply({ situation: "clarify", missing: "which_job" });
      return reply(
        {
          situation: "job_details",
          focus: understanding.focus || "list",
          jobs: remembered.map(publicJobFact),
        },
        remembered,
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
      return coverageReply(understanding, seeker._id.toString(), seeker.city || "", meta);
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
      const urls = siteUrls();
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
      if (!asEmployer || !employer) return reply({ situation: "denied", reason: "employer_required" });
      const urls = siteUrls();
      return reply({
        situation: "account_status",
        verification: employer.verificationStatus || "pending",
        name: employer.companyName || "",
        profileUrl: urls.employerProfileUrl,
      });
    }
    case "JOB_COUNT":
    case "JOB_SEARCH":
    default: {
      if (understanding.intent === "UNKNOWN") {
        return reply({ situation: "clarify", missing: linked === "none" ? "purpose" : "intent" });
      }
      if (!understanding.location) {
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
      );
    }
  }
}

async function searchJobs(
  understanding: BotUnderstanding,
  jobSeekerId: string | undefined,
  meta: { accountType: AccountKind; activeRole: "" | "seeker" | "employer" },
  language?: string,
): Promise<BotTurn> {
  const lookup = toPublicJobsLookup(understanding);
  const role = lookup.search || "ANY";
  logWhatsAppBot(
    "JOB_SEARCH",
    `accountType=${meta.accountType} location=${lookup.city || "-"} role=${role} language=${language || "-"}`,
  );
  const primary = await loadJobs(lookup.search, lookup.city, jobSeekerId, language);
  if (primary.jobs.length > 0 || !understanding.location) {
    logWhatsAppJobs({
      intent: understanding.intent,
      location: lookup.city,
      role,
      dbMatches: primary.dbMatches,
      jobsReturned: primary.jobs.length,
      jobsForAI: primary.jobs.length,
      path: primary.jobs.length > 0 ? "primary" : "empty",
      cities: primary.jobs.map((job) => job.cityName),
    });
    console.info(
      `[WHATSAPP-BOT] ${primary.jobs.length > 0 ? "JOB_RESULTS" : "JOB_SEARCH_EMPTY"} accountType=${meta.accountType} location=${lookup.city || "-"} role=${role} count=${primary.jobs.length}`,
    );
    return say("", primary.jobs, meta, publicJobReplyFacts(meta, {
      situation: "jobs",
      location: understanding.location,
      role: understanding.category,
      empty: primary.total === 0,
      total: primary.total,
      more: primary.hasMore,
      jobs: primary.jobs.map(publicJobFact),
    }));
  }

  const widerCity = parentCity(understanding.location);
  const wider = widerCity
    ? await loadJobs(lookup.search, widerCity, jobSeekerId, language)
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
    empty: wider.total === 0,
    total: wider.total,
    more: wider.hasMore,
    widenedTo: wider.jobs.length > 0 ? widerCity : "",
    jobs: wider.jobs.map(publicJobFact),
  }));
}

function publicJobReplyFacts(
  meta: { accountType: AccountKind },
  facts: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...facts,
    accountType: meta.accountType,
    ...(meta.accountType === "none" ? { registration: siteUrls() } : {}),
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
): Promise<BotTurn> {
  const lookup = toPublicJobsLookup({
    category: understanding.category,
    location: understanding.location || profileCity,
    openSearch: !understanding.category,
  });
  const [jobs, applications] = await Promise.all([
    loadJobs(lookup.search, lookup.city, jobSeekerId),
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
 * Uses the website's public job search. Titles stay in the posted language:
 * role verification and reply localization match source titles, and translated
 * titles (e.g. Telugu spellings from the translation worker) would be dropped.
 */
async function loadJobs(
  search: string,
  city: string,
  jobSeekerId?: string,
  _language?: string,
): Promise<{ jobs: PublicJobFact[]; total: number; dbMatches: number; hasMore: boolean }> {
  const cityAliases = placeCityAliases(city);
  const query = publicJobsQuerySchema.parse({
    search,
    city: cityAliases.join(","),
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
    search,
    result.pagination.total - (result.jobs.length - inCity.length),
  );
  const jobs = selected.jobs.map((job) => ({
    jobTitle: job.jobTitle,
    companyName: job.companyName,
    cityName: job.cityName,
    stateName: job.stateName,
    jobId: job.jobId,
    salaryLabel: formatSalaryLabel(job),
  }));
  return {
    total: selected.total,
    dbMatches: result.pagination.total,
    hasMore: selected.hasMore,
    jobs,
  };
}
