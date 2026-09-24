import { createHash } from "node:crypto";
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
  clarifyJobTitle,
  detectLanguage,
  fallbackCopy,
  formatSalaryLabel,
  greetingCopy,
  languageFromHint,
  mergePending,
  nationalPhone,
  parentCity,
  renderApplicationReply,
  renderCoverageReply,
  renderEmployerReply,
  renderJobSearchReply,
  toPublicJobsLookup,
  unauthorizedCopy,
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

    const turn = await buildReply(phone, merged, remembered);
    const waitingForLocation =
      merged.intent === "JOB_SEARCH" && !merged.location && Boolean(merged.category || merged.openSearch);
    const waitingForRole =
      merged.intent === "JOB_SEARCH" && Boolean(merged.location) && !merged.category && !merged.openSearch;
    await WhatsAppSessionModel.findOneAndUpdate(
      { phone },
      {
        phone,
        language: merged.language,
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
      `[WhatsAppBot] ok phone=${phoneHash(phone)} messageId=${input.messageId ?? "-"} type=${input.messageType ?? "text"} language=${merged.language} intent=${merged.intent} role=${merged.category || "-"} location=${merged.location || "-"} ms=${Date.now() - started}`,
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
      fallbackCopy(detectLanguage(input.text)),
    );
  }
}

type BotTurn = { text: string; shownJobs: PublicJobFact[] };

function say(text: string, shownJobs: PublicJobFact[] = []): BotTurn {
  return { text, shownJobs };
}

async function buildReply(
  phone: string,
  understanding: BotUnderstanding,
  remembered: PublicJobFact[],
): Promise<BotTurn> {
  const [seeker, employer] = await Promise.all([
    JobSeekerModel.findOne({ whatsappNumber: phone })
      .select("fullName city state jobRole skills preferredJobLocation experienceType")
      .lean(),
    EmployerModel.findOne({ whatsappNumber: phone })
      .select("companyName")
      .lean(),
  ]);

  switch (understanding.intent) {
    case "GREETING":
      return say(
        greetingCopy({
          language: understanding.language,
          known: Boolean(seeker || employer),
          name: seeker?.fullName?.trim() || employer?.companyName?.trim() || "",
        }),
      );
    case "HELP":
    case "UNRELATED":
      return say(capabilityCopy(understanding.language));
    case "HOW_TO_APPLY":
      return say(
        understanding.language === "te"
          ? "జాబ్ తెరిచి Apply బటన్ ఉపయోగించండి. లింక్ అయిన అకౌంట్ ఉంటే మీ ప్రొఫైల్‌తో apply అవుతుంది."
          : understanding.language === "hi"
            ? "नौकरी खोलकर Apply बटन दबाएँ. लिंक किया अकाउंट हो तो प्रोफाइल के साथ आवेदन होता है."
            : "Open a job and use Apply. A linked account applies with your profile.",
      );
    case "MY_SKILLS":
      if (!seeker) return say(unauthorizedCopy(understanding.language, "seeker"));
      return say(
        `Skills: ${(seeker.skills ?? []).slice(0, 12).join(", ") || "—"}\nRole: ${seeker.jobRole || "—"}`,
      );
    case "JOB_DETAILS": {
      if (remembered.length === 0) return say(clarifyJobTitle(understanding.language));
      return say(renderJobSearchReply({
        language: understanding.language,
        location: understanding.location,
        jobTitle: understanding.category,
        jobs: remembered,
      }), remembered);
    }
    case "PROFILE_MATCH":
    case "PROFILE_JOBS": {
      if (!seeker) return say(unauthorizedCopy(understanding.language, "seeker"));
      const location = seeker.preferredJobLocation || seeker.city || "";
      return searchJobs(
        {
          ...understanding,
          category: seeker.jobRole?.trim() || "",
          location,
          openSearch: !seeker.jobRole?.trim(),
        },
        seeker._id.toString(),
      );
    }
    case "APPLIED_COVERAGE": {
      if (!seeker) return say(unauthorizedCopy(understanding.language, "seeker"));
      return coverageReply(understanding, seeker._id.toString(), seeker.city || "");
    }
    case "MY_APPLICATIONS":
    case "APPLICATION_COUNT":
    case "APPLICATION_STATUS": {
      if (!seeker) return say(unauthorizedCopy(understanding.language, "seeker"));
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
      return say(
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
      if (!employer) return say(unauthorizedCopy(understanding.language, "employer"));
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
      return say(
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
        return say(clarifyJobTitle(understanding.language));
      }
      if (!understanding.location && !understanding.category) {
        return say(askLocationCopy(understanding.language));
      }
      if (!understanding.category && !understanding.openSearch) {
        return say(clarifyJobTitle(understanding.language));
      }
      if (!understanding.location) {
        return say(askLocationCopy(understanding.language));
      }
      return searchJobs(understanding, seeker?._id.toString());
    }
  }
}

async function searchJobs(
  understanding: BotUnderstanding,
  jobSeekerId?: string,
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
  );
}

async function coverageReply(
  understanding: BotUnderstanding,
  jobSeekerId: string,
  profileCity: string,
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
  return {
    total: result.pagination.total,
    jobs: result.jobs.map((job) => ({
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      cityName: job.cityName,
      stateName: job.stateName,
      jobId: job.jobId,
      salaryLabel: formatSalaryLabel(job),
    })),
  };
}
