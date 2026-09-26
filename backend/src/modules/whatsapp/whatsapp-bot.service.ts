import { createHash } from "node:crypto";
import { env } from "../../config/env.js";
import { JobSeekerModel } from "../job-seekers/job-seeker.model.js";
import { EmployerModel } from "../employers/employer.model.js";
import { applicationService } from "../applications/application.service.js";
import { jobService } from "../jobs/job.service.js";
import {
  listEmployerJobsQuerySchema,
  publicJobsQuerySchema,
} from "../jobs/job.validation.js";
import { WhatsAppSessionModel } from "./whatsapp-session.model.js";
import { WhatsAppService } from "./whatsapp.service.js";
import { generateFinalReply, understandMessage } from "./sarvam.client.js";
import {
  detectLanguage,
  detectProtocolTurn,
  formatSalaryLabel,
  greetingCopy,
  languageFromHint,
  mergePending,
  applyCurrentMessageSearchRules,
  nationalPhone,
  parentCity,
  PUBLIC_JOB_FETCH_LIMIT,
  selectVerifiedJobsForReply,
  protocolReply,
  renderApplicationReply,
  renderCoverageReply,
  renderEmployerReply,
  renderJobSearchReply,
  serviceErrorCopy,
  toPublicJobsLookup,
  type AccountKind,
  type BotLanguage,
  type BotUnderstanding,
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

function clip(text: string): string {
  return text.replace(/\s+/g, " ").slice(0, 180);
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
  employer: { _id: { toString(): string }; companyName?: string } | null;
  linked: AccountKind;
  seekerId: string;
  employerId: string;
};

async function lookupAccount(phone: string): Promise<LinkedAccount> {
  const cached = accountCache.get(phone);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  const [seeker, employer] = await Promise.all([
    JobSeekerModel.findOne({ whatsappNumber: phone })
      .select("fullName city jobRole skills preferredJobLocation")
      .lean(),
    EmployerModel.findOne({ whatsappNumber: phone }).select("companyName").lean(),
  ]);
  const linked: AccountKind =
    seeker && employer ? "both" : seeker ? "seeker" : employer ? "employer" : "none";
  const value: LinkedAccount = {
    seeker,
    employer,
    linked,
    seekerId: seeker?._id.toString() ?? "",
    employerId: employer?._id.toString() ?? "",
  };
  accountCache.set(phone, { value, expires: Date.now() + ACCOUNT_CACHE_MS });
  return value;
}

function fallbackFromFacts(
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
  if (situation === "jobs") {
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

function registrationFacts(): { seekerRegisterUrl: string; employerRegisterUrl: string } {
  const origin = env.FRONTEND_URL.replace(/\/+$/, "");
  return {
    seekerRegisterUrl: `${origin}/job-seeker/register`,
    employerRegisterUrl: `${origin}/employer/register`,
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
        : situation.startsWith("EMPLOYER_")
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

export async function handleConversationalMessage(input: {
  from: string;
  text: string;
  languageHint?: string;
  messageId?: string;
  messageType?: string;
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
    sarvam_final: 0,
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

    const hint = languageFromHint(input.languageHint);
    const protocol = detectProtocolTurn(input.text);
    if (protocol) {
      const language = detectLanguage(input.text, session?.language, hint);
      const name =
        identity.linked === "employer"
          ? identity.employer?.companyName?.trim() || ""
          : identity.seeker?.fullName?.trim() || "";
      const text = protocolReply(protocol, language, identity.linked, name);
      await WhatsAppSessionModel.findOneAndUpdate(
        { phone },
        { phone, language, lastInteractionAt: new Date() },
        { upsert: true },
      );
      const sendStarted = Date.now();
      await whatsAppService.sendTextMessage(input.from, text);
      timing.whatsapp_send = Date.now() - sendStarted;
      console.info(
        `[WA-PERF] protocol=${protocol} account_lookup=${timing.account_lookup}ms session_lookup=${timing.session_lookup}ms sarvam_understand=0ms db_query=0ms sarvam_final=0ms whatsapp_send=${timing.whatsapp_send}ms total=${Date.now() - started}ms`,
      );
      return;
    }

    const understandStarted = Date.now();
    const understood = await understandMessage(input.text, session?.language, hint, {
      accountType: accountLabel(identity.linked),
      priorLocation: session?.pendingLocation || session?.lastLocation || "",
      priorRole: session?.pendingCategory || session?.lastCategory || "",
    });
    timing.sarvam_understand = Date.now() - understandStarted;
    const understanding = understood.understanding;
    const merged = applyCurrentMessageSearchRules(
      input.text,
      mergePending(
        session
          ? {
              location: session.pendingLocation || session.lastLocation || "",
              category: session.pendingCategory || session.lastCategory || "",
            }
          : null,
        understanding,
      ),
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
    const turn = await buildReply(identity, merged, remembered, session?.activeRole ?? "");
    timing.db_query = Date.now() - dbStarted;
    const waitingForLocation =
      merged.intent === "JOB_SEARCH" && !merged.location && Boolean(merged.category || merged.openSearch);
    const waitingForRole =
      merged.intent === "JOB_SEARCH" && Boolean(merged.location) && !merged.category && !merged.openSearch;
    await WhatsAppSessionModel.findOneAndUpdate(
      { phone },
      {
        phone,
        language: merged.language,
        activeRole: turn.activeRole,
        pendingLocation: waitingForRole ? merged.location : "",
        pendingCategory: waitingForLocation ? merged.category : "",
        lastLocation: merged.location || session?.lastLocation || "",
        lastCategory: merged.openSearch ? "" : merged.category || session?.lastCategory || "",
        ...(turn.shownJobs.length > 0
          ? {
              lastJobs: turn.shownJobs.slice(0, 3).map((job) => ({
                jobId: job.jobId,
                jobTitle: job.jobTitle,
                companyName: job.companyName,
                cityName: job.cityName,
                salaryLabel: job.salaryLabel,
              })),
            }
          : {}),
        lastInteractionAt: new Date(),
      },
      { upsert: true },
    );
    const finalStarted = Date.now();
    const generated =
      understood.source === "sarvam"
        ? await generateFinalReply({
            originalText: input.text,
            language: merged.language,
            accountType: accountLabel(identity.linked),
            facts: turn.facts,
          })
        : null;
    timing.sarvam_final = Date.now() - finalStarted;
    const replyText =
      generated ?? fallbackFromFacts(merged.language, turn.facts) ?? serviceErrorCopy(merged.language);
    const trace = describeTurn(merged, turn);
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
        `rawMessage=${clip(input.text)}`,
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
        "[SARVAM FINAL]",
        `language=${merged.language}`,
        `responseGenerated=${generated ? "yes" : "no"}`,
      ].join(" "),
    );
    const sendStarted = Date.now();
    await whatsAppService.sendTextMessage(input.from, replyText);
    timing.whatsapp_send = Date.now() - sendStarted;
    console.info(
      `[WA-PERF] account_lookup=${timing.account_lookup}ms session_lookup=${timing.session_lookup}ms sarvam_understand=${timing.sarvam_understand}ms db_query=${timing.db_query}ms sarvam_final=${timing.sarvam_final}ms whatsapp_send=${timing.whatsapp_send}ms total=${Date.now() - started}ms`,
    );
  } catch (error) {
    console.error(
      `[WhatsAppBot] failed phone=${phoneHash(phone)} messageId=${input.messageId ?? "-"} type=${input.messageType ?? "text"} ms=${Date.now() - started} reason=${
        error instanceof Error ? error.name : "unknown"
      }`,
    );
    await whatsAppService.sendTextMessage(
      input.from,
      serviceErrorCopy(detectLanguage(input.text)),
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
      linked === "none" ? { ...facts, registration: registrationFacts() } : facts,
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
  if (linked === "none" && understanding.requiresAuth) {
    return reply({
      situation: "new_user",
      reason: understanding.scope === "OWN_EMPLOYER_DATA" ? "employer_account_required" : "job_seeker_account_required",
    });
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
      const location = seeker.preferredJobLocation || seeker.city || "";
      return searchJobs(
        {
          ...understanding,
          category: seeker.jobRole?.trim() || "",
          location,
          openSearch: !seeker.jobRole?.trim(),
        },
        seeker._id.toString(),
        meta,
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
    case "JOB_COUNT":
    case "JOB_SEARCH":
    default: {
      if (understanding.intent === "UNKNOWN") {
        return reply({ situation: "clarify", missing: "intent" });
      }
      if (!understanding.location && !understanding.category) {
        return reply({ situation: "clarify", missing: "location_and_role" });
      }
      if (!understanding.category && !understanding.openSearch) {
        return reply({ situation: "clarify", missing: "role" });
      }
      if (!understanding.location) {
        return reply({ situation: "clarify", missing: "location" });
      }
      return searchJobs(understanding, asSeeker ? seeker?._id.toString() : undefined, meta);
    }
  }
}

async function searchJobs(
  understanding: BotUnderstanding,
  jobSeekerId: string | undefined,
  meta: { accountType: AccountKind; activeRole: "" | "seeker" | "employer" },
): Promise<BotTurn> {
  const lookup = toPublicJobsLookup(understanding);
  const role = lookup.search || "ANY";
  const primary = await loadJobs(lookup.search, lookup.city, jobSeekerId);
  if (primary.jobs.length > 0 || !understanding.location) {
    logWhatsAppJobs({
      intent: understanding.intent,
      location: lookup.city,
      role,
      dbMatches: primary.dbMatches,
      jobsReturned: primary.jobs.length,
      jobsForAI: primary.jobs.length,
    });
    return say("", primary.jobs, meta, {
      situation: "jobs",
      location: understanding.location,
      role: understanding.category,
      empty: primary.total === 0,
      total: primary.total,
      more: primary.hasMore,
      jobs: primary.jobs.map(publicJobFact),
    });
  }

  const widerCity = parentCity(understanding.location);
  const wider = widerCity
    ? await loadJobs(lookup.search, widerCity, jobSeekerId)
    : { jobs: [], total: 0, dbMatches: 0, hasMore: false };
  logWhatsAppJobs({
    intent: understanding.intent,
    location: wider.jobs.length > 0 ? widerCity : lookup.city,
    role,
    dbMatches: wider.dbMatches,
    jobsReturned: wider.jobs.length,
    jobsForAI: wider.jobs.length,
  });
  return say("", wider.jobs, meta, {
    situation: "jobs",
    location: understanding.location,
    role: understanding.category,
    empty: wider.total === 0,
    total: wider.total,
    more: wider.hasMore,
    widenedTo: wider.jobs.length > 0 ? widerCity : "",
    jobs: wider.jobs.map(publicJobFact),
  });
}

function publicJobFact(job: PublicJobFact) {
  return {
    jobTitle: job.jobTitle,
    companyName: job.companyName,
    cityName: job.cityName,
    salary: job.salaryLabel,
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
}): void {
  console.info(
    `[WA-JOBS] intent=${input.intent} location=${input.location || "-"} role=${input.role} dbMatches=${input.dbMatches} jobsReturned=${input.jobsReturned} jobsForAI=${input.jobsForAI}`,
  );
}

async function loadJobs(
  search: string,
  city: string,
  jobSeekerId?: string,
): Promise<{ jobs: PublicJobFact[]; total: number; dbMatches: number; hasMore: boolean }> {
  const query = publicJobsQuerySchema.parse({
    search,
    city,
    limit: PUBLIC_JOB_FETCH_LIMIT,
    page: 1,
    sort: "latest",
  });
  const result = await jobService.listPublicActiveJobs(query, jobSeekerId);
  const selected = selectVerifiedJobsForReply(result.jobs, search, result.pagination.total);
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
