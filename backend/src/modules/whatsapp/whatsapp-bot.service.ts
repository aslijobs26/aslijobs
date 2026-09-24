import { JobSeekerModel } from "../job-seekers/job-seeker.model.js";
import { EmployerModel } from "../employers/employer.model.js";
import { ApplicationModel } from "../applications/application.model.js";
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
  detectLanguage,
  fallbackCopy,
  formatJobFacts,
  greetingCopy,
  mergePending,
  nationalPhone,
  unauthorizedCopy,
  type BotLanguage,
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

export async function handleConversationalMessage(input: {
  from: string;
  text: string;
}): Promise<void> {
  const phone = nationalPhone(input.from);
  if (!allowReply(phone)) {
    return;
  }

  try {
    const understanding = await understandMessage(input.text);
    const session = await WhatsAppSessionModel.findOne({ phone }).lean();
    const merged = mergePending(
      session
        ? {
            location: session.pendingLocation ?? "",
            category: session.pendingCategory ?? "",
          }
        : null,
      understanding,
    );

    const reply = await buildReply(phone, merged);
    await WhatsAppSessionModel.findOneAndUpdate(
      { phone },
      {
        phone,
        language: merged.language,
        pendingLocation:
          merged.intent === "JOB_SEARCH" && !merged.category ? merged.location : "",
        pendingCategory:
          merged.intent === "JOB_SEARCH" && !merged.location ? merged.category : "",
        lastInteractionAt: new Date(),
      },
      { upsert: true },
    );
    await whatsAppService.sendTextMessage(input.from, reply);
  } catch (error) {
    console.error(
      `[WhatsAppBot] processing failed reason=${
        error instanceof Error ? error.name : "unknown"
      }`,
    );
    await whatsAppService.sendTextMessage(
      input.from,
      fallbackCopy(detectLanguage(input.text)),
    );
  }
}

async function buildReply(phone: string, understanding: BotUnderstanding): Promise<string> {
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
      return greetingCopy({
        language: understanding.language,
        known: Boolean(seeker || employer),
        name: seeker?.fullName?.trim() || employer?.companyName?.trim() || "",
      });
    case "HOW_TO_APPLY":
      return understanding.language === "te"
        ? "Job open chesi Apply button use cheyyandi. Linked account unte mee profile tho apply avuthundi."
        : understanding.language === "hi"
          ? "Job kholkar Apply button use karein. Linked account ho to profile ke saath apply hota hai."
          : "Open a job and use Apply. A linked account applies with your profile.";
    case "MY_SKILLS":
      if (!seeker) return unauthorizedCopy(understanding.language, "seeker");
      return `Skills: ${(seeker.skills ?? []).slice(0, 12).join(", ") || "—"}\nRole: ${seeker.jobRole || "—"}`;
    case "PROFILE_MATCH": {
      if (!seeker) return unauthorizedCopy(understanding.language, "seeker");
      const search = [seeker.jobRole, ...(seeker.skills ?? []).slice(0, 3)]
        .filter(Boolean)
        .join(" ");
      const location = seeker.preferredJobLocation || seeker.city || "";
      return searchJobs(understanding.language, search, location, seeker._id.toString());
    }
    case "MY_APPLICATIONS":
    case "APPLICATION_STATUS": {
      if (!seeker) return unauthorizedCopy(understanding.language, "seeker");
      const result = await applicationService.listForSeeker({
        jobSeekerId: seeker._id.toString(),
        search: understanding.category || understanding.jobQuery,
        limit: 5,
        page: 1,
        sort: "newest",
      });
      if (result.applications.length === 0) {
        return understanding.language === "te"
          ? "Mee applications ippudu levu."
          : understanding.language === "hi"
            ? "Abhi koi application nahi mili."
            : "You do not have applications yet.";
      }
      const lines = result.applications.map(
        (item, index) =>
          `${index + 1}. ${item.jobTitle} — ${item.companyName} (${item.status})`,
      );
      return lines.join("\n");
    }
    case "EMPLOYER_JOBS":
    case "EMPLOYER_APPLICATION_COUNT": {
      if (!employer) return unauthorizedCopy(understanding.language, "employer");
      const query = listEmployerJobsQuerySchema.parse({ limit: 5, page: 1 });
      const listed = await jobService.listEmployerJobs(employer._id.toString(), query);
      if (understanding.intent === "EMPLOYER_APPLICATION_COUNT") {
        const total = await ApplicationModel.countDocuments({
          employerId: employer._id,
        });
        return `Applications on your jobs: ${total}`;
      }
      const lines = listed.jobOptions.slice(0, 5).map(
        (job, index) => `${index + 1}. ${job.jobTitle} (${job.status})`,
      );
      return lines.length > 0
        ? `Your jobs (${listed.pagination.total}):\n${lines.join("\n")}`
        : "You have no posted jobs yet.";
    }
    case "JOB_COUNT":
    case "JOB_SEARCH":
    default: {
      if (understanding.intent === "UNKNOWN") {
        return understanding.language === "te"
          ? "Job, application, leda profile gurinchi adagandi."
          : understanding.language === "hi"
            ? "Job, application, ya profile ke baare mein poochhiye."
            : "Ask about jobs, your applications, or your profile.";
      }
      const search = [understanding.category, understanding.jobQuery]
        .filter(Boolean)
        .join(" ");
      return searchJobs(
        understanding.language,
        search || understanding.category,
        understanding.location,
        seeker?._id.toString(),
      );
    }
  }
}

async function searchJobs(
  language: BotLanguage,
  search: string,
  location: string,
  jobSeekerId?: string,
): Promise<string> {
  const query = publicJobsQuerySchema.parse({
    search: search.trim(),
    city: location.trim(),
    limit: 5,
    page: 1,
    sort: "relevant",
  });
  const result = await jobService.listPublicActiveJobs(query, jobSeekerId);
  const facts: PublicJobFact[] = result.jobs.map((job) => ({
    jobTitle: job.jobTitle,
    companyName: job.companyName,
    cityName: job.cityName,
    stateName: job.stateName,
    jobId: job.jobId,
  }));
  const countLine =
    language === "te"
      ? `Kanipinchina active jobs: ${result.pagination?.total ?? facts.length}`
      : language === "hi"
        ? `Active jobs: ${result.pagination?.total ?? facts.length}`
        : `Active jobs found: ${result.pagination?.total ?? facts.length}`;
  return `${countLine}\n${formatJobFacts(facts, language)}`;
}
