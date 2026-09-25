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
import { understandMessage } from "./sarvam.client.js";
import {
  askLocationCopy,
  capabilityCopy,
  chooseAccountRole,
  clarifyAmbiguousCopy,
  denyPrivateCopy,
  clarifyJobTitle,
  detectLanguage,
  formatSalaryLabel,
  greetingCopy,
  registrationCopy,
  languageFromHint,
  mergePending,
  nationalPhone,
  parentCity,
  renderApplicationReply,
  renderCoverageReply,
  renderEmployerReply,
  matchesRequestedRole,
  renderJobSearchReply,
  serviceErrorCopy,
  toPublicJobsLookup,
  unauthorizedCopy,
  type AccountKind,
  type BotUnderstanding,
  type PublicJobFact,
} from "./whatsapp-bot.logic.js";

const whatsAppService = new WhatsAppService();

const recentReplies = new Map<string, number[]>();

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
  try {
    const session = await WhatsAppSessionModel.findOne({ phone }).lean();
    const hint = languageFromHint(input.languageHint);
    const understanding = await understandMessage(
      input.text,
      session?.language,
      hint,
    );
    const merged = mergePending(
      session
        ? {
            location: session.pendingLocation || session.lastLocation || "",
            category: session.pendingCategory || session.lastCategory || "",
          }
        : null,
      understanding,
    );
    const remembered = (session?.lastJobs ?? []).map((job) => ({
      jobId: job.jobId ?? "",
      jobTitle: job.jobTitle ?? "",
      companyName: job.companyName ?? "",
      cityName: job.cityName ?? "",
      stateName: "",
      salaryLabel: job.salaryLabel ?? "",
    }));

    const turn = await buildReply(phone, merged, remembered, session?.activeRole ?? "", input.text);
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
        lastCategory: merged.category || session?.lastCategory || "",
        ...(turn.shownJobs.length > 0
          ? {
              lastJobs: turn.shownJobs.slice(0, 5).map((job) => ({
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
    console.info(
      `[WhatsAppBot] ok phone=${phoneHash(phone)} messageId=${input.messageId ?? "-"} type=${input.messageType ?? "text"} account=${turn.accountType} language=${merged.language} intent=${merged.intent} role=${merged.category || "-"} location=${merged.location || "-"} ms=${Date.now() - started}`,
    );
    await whatsAppService.sendTextMessage(input.from, turn.text);
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
): BotTurn {
  return { text, shownJobs, ...meta };
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
  phone: string,
  understanding: BotUnderstanding,
  remembered: PublicJobFact[],
  savedRole: string,
  text: string,
): Promise<BotTurn> {
  const [seeker, employer] = await Promise.all([
    JobSeekerModel.findOne({ whatsappNumber: phone })
      .select("fullName city state jobRole skills preferredJobLocation experienceType")
      .lean(),
    EmployerModel.findOne({ whatsappNumber: phone })
      .select("companyName")
      .lean(),
  ]);
  const linked: AccountKind =
    seeker && employer ? "both" : seeker ? "seeker" : employer ? "employer" : "none";
  const picked = chooseAccountRole(text);
  const activeRole = resolveActiveRole(linked, savedRole, picked);
  const accountType: AccountKind =
    linked === "both" ? (activeRole === "employer" ? "employer" : activeRole === "seeker" ? "seeker" : "both") : linked;
  const meta = { accountType: linked === "both" && !activeRole ? "both" : accountType, activeRole };
  const reply = (text: string, shownJobs: PublicJobFact[] = []) => say(text, shownJobs, meta);
  const asSeeker = accountType === "seeker";
  const asEmployer = accountType === "employer";

  if (linked === "both" && !activeRole) {
    return reply(greetingCopy({ language: understanding.language, account: "both", name: "" }));
  }
  if (linked === "none" && picked) {
    const origin = env.FRONTEND_URL.replace(/\/+$/, "");
    const url = picked === "employer" ? `${origin}/employer/register` : `${origin}/job-seeker/register`;
    return reply(registrationCopy({ language: understanding.language, role: picked, url }));
  }

  switch (understanding.intent) {
    case "GREETING":
      return reply(
        greetingCopy({
          language: understanding.language,
          account: accountType,
          name: asEmployer ? employer?.companyName?.trim() || "" : seeker?.fullName?.trim() || "",
        }),
      );
    case "HELP":
    case "UNRELATED":
      return reply(capabilityCopy(understanding.language, accountType));
    case "CLARIFY":
      return reply(clarifyAmbiguousCopy(understanding.language));
    case "HOW_TO_APPLY":
      return reply(
        understanding.language === "te"
          ? "జాబ్ తెరిచి Apply బటన్ ఉపయోగించండి. లింక్ అయిన అకౌంట్ ఉంటే మీ ప్రొఫైల్‌తో apply అవుతుంది."
          : understanding.language === "hi"
            ? "नौकरी खोलकर Apply बटन दबाएँ. लिंक किया अकाउंट हो तो प्रोफाइल के साथ आवेदन होता है."
            : "Open a job and use Apply. A linked account applies with your profile.",
      );
    case "MY_SKILLS":
      if (!asSeeker || !seeker) return reply(unauthorizedCopy(understanding.language, "seeker"));
      return reply(
        `Skills: ${(seeker.skills ?? []).slice(0, 12).join(", ") || "—"}\nRole: ${seeker.jobRole || "—"}`,
      );
    case "JOB_DETAILS": {
      if (remembered.length === 0) return reply(clarifyJobTitle(understanding.language));
      if (understanding.focus === "company") {
        const names = remembered
          .map((job, index) => `${index + 1}. ${job.companyName || "—"} — ${job.jobTitle}`)
          .join("\n");
        return reply(names, remembered);
      }
      return reply(renderJobSearchReply({
        language: understanding.language,
        location: understanding.location,
        jobTitle: understanding.category,
        jobs: remembered,
      }), remembered);
    }
    case "PROFILE_MATCH":
    case "PROFILE_JOBS": {
      if (!asSeeker || !seeker) return reply(unauthorizedCopy(understanding.language, "seeker"));
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
      if (!asSeeker || !seeker) return reply(unauthorizedCopy(understanding.language, "seeker"));
      return coverageReply(understanding, seeker._id.toString(), seeker.city || "", meta);
    }
    case "MY_APPLICATIONS":
    case "APPLICATION_COUNT":
    case "APPLICATION_STATUS": {
      if (!asSeeker || !seeker) return reply(unauthorizedCopy(understanding.language, "seeker"));
      const result = await applicationService.listForSeeker({
        jobSeekerId: seeker._id.toString(),
        search: understanding.category || understanding.jobQuery,
        limit: 5,
        page: 1,
        sort: "newest",
      });
      const mode =
        understanding.intent === "APPLICATION_COUNT"
          ? "count"
          : understanding.intent === "APPLICATION_STATUS"
            ? "status"
            : "list";
      const lines = result.applications.map(
        (item, index) =>
          `${index + 1}. ${item.jobTitle} — ${item.companyName} (${item.status})`,
      );
      return reply(
        renderApplicationReply({
          language: understanding.language,
          total: result.pagination.total,
          lines,
          mode,
        }),
      );
    }
    case "EMPLOYER_JOBS":
    case "EMPLOYER_JOB_STATUS":
    case "EMPLOYER_APPLICATION_COUNT": {
      if (!asEmployer || !employer) return reply(denyPrivateCopy(understanding.language));
      const query = listEmployerJobsQuerySchema.parse({
        limit: 20,
        page: 1,
        search: understanding.category || "",
      });
      const listed = await jobService.listEmployerJobs(employer._id.toString(), query);
      const ranked = [...listed.jobs].sort((a, b) => b.applications - a.applications);
      const totalApplications = ranked.reduce((sum, job) => sum + job.applications, 0);
      const lines = ranked.slice(0, 5).map((job, index) =>
        understanding.intent === "EMPLOYER_APPLICATION_COUNT"
          ? `${index + 1}. ${job.jobTitle} — ${job.applications}`
          : `${index + 1}. ${job.jobTitle} (${job.status})`,
      );
      return reply(
        renderEmployerReply({
          language: understanding.language,
          lines,
          totalApplications,
          mode:
            understanding.intent === "EMPLOYER_APPLICATION_COUNT"
              ? "count"
              : understanding.intent === "EMPLOYER_JOB_STATUS"
                ? "status"
                : "jobs",
        }),
      );
    }
    case "JOB_COUNT":
    case "JOB_SEARCH":
    default: {
      if (understanding.intent === "UNKNOWN") {
        return reply(clarifyJobTitle(understanding.language));
      }
      if (!understanding.location && !understanding.category) {
        return reply(askLocationCopy(understanding.language));
      }
      if (!understanding.category && !understanding.openSearch) {
        return reply(clarifyJobTitle(understanding.language));
      }
      if (!understanding.location) {
        return reply(askLocationCopy(understanding.language));
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
  const primary = await loadJobs(lookup.search, lookup.city, jobSeekerId);
  if (primary.jobs.length > 0 || !understanding.location) {
    return say(
      renderJobSearchReply({
        language: understanding.language,
        location: understanding.location,
        jobTitle: understanding.category,
        jobs: primary.jobs,
      }),
      primary.jobs,
      meta,
    );
  }

  const widerCity = parentCity(understanding.location);
  const wider = widerCity
    ? await loadJobs(lookup.search, widerCity, jobSeekerId)
    : { jobs: [], total: 0 };
  return say(
    renderJobSearchReply({
      language: understanding.language,
      location: understanding.location,
      jobTitle: understanding.category,
      jobs: wider.jobs,
      widenedTo: wider.jobs.length > 0 ? widerCity : undefined,
    }),
    wider.jobs,
    meta,
  );
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
      limit: 50,
      page: 1,
      sort: "newest",
    }),
  ]);
  const appliedIds = new Set(applications.applications.map((item) => item.publicJobId));
  const matched = jobs.jobs.filter((job) => appliedIds.has(job.jobId)).length;
  return say(
    renderCoverageReply({
      language: understanding.language,
      applied: applications.pagination.total,
      compared: jobs.jobs.length,
      matched,
      totalListed: jobs.total,
      bounded: jobs.total > jobs.jobs.length,
    }),
    [],
    meta,
  );
}

async function loadJobs(
  search: string,
  city: string,
  jobSeekerId?: string,
): Promise<{ jobs: PublicJobFact[]; total: number }> {
  const query = publicJobsQuerySchema.parse({
    search,
    city,
    limit: 5,
    page: 1,
    sort: "latest",
  });
  const result = await jobService.listPublicActiveJobs(query, jobSeekerId);
  const jobs = result.jobs
    .filter((job) => matchesRequestedRole(job.jobTitle, search))
    .map((job) => ({
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      cityName: job.cityName,
      stateName: job.stateName,
      jobId: job.jobId,
      salaryLabel: formatSalaryLabel(job),
    }));
  return {
    total: jobs.length,
    jobs,
  };
}
