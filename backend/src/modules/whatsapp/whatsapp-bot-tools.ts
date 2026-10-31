import { z } from "zod";
import { applicationService } from "../applications/application.service.js";
import { jobService } from "../jobs/job.service.js";
import { listEmployerJobsQuerySchema, publicJobsQuerySchema } from "../jobs/job.validation.js";
import type { AccountKind } from "./whatsapp-bot.logic.js";
import { authorizeWhatsAppRole } from "./whatsapp-role-policy.js";

/**
 * Finite, typed backend tools for WhatsApp. The LLM cannot invent tools or
 * query arbitrary collections — only these authorized operations.
 */

export const searchPublicJobsInputSchema = z.object({
  search: z.string().max(80).default(""),
  city: z.string().max(80).default(""),
  state: z.string().max(80).default(""),
  experience: z.string().max(40).default(""),
  minSalary: z.number().int().min(0).max(5_000_000).optional(),
  maxSalary: z.number().int().min(0).max(5_000_000).optional(),
  limit: z.number().int().min(1).max(20).default(8),
  page: z.number().int().min(1).max(20).default(1),
});

export type WhatsAppToolName =
  | "search_public_jobs"
  | "list_seeker_applications"
  | "list_employer_jobs"
  | "none";

export type WhatsAppToolAuth = {
  account: AccountKind;
  activeRole?: "" | "seeker" | "employer";
  seekerId?: string;
  employerId?: string;
};

function deny(tool: WhatsAppToolName, reason: string) {
  return { ok: false as const, tool, reason, result: null };
}

/** Map product intent → permitted tool (authorization still enforced at execute). */
export function selectWhatsAppTool(intent: string): WhatsAppToolName {
  switch (intent) {
    case "JOB_SEARCH":
    case "JOB_COUNT":
    case "JOB_DETAILS":
    case "PROFILE_JOBS":
    case "PROFILE_MATCH":
      return "search_public_jobs";
    case "MY_APPLICATIONS":
    case "APPLICATION_STATUS":
    case "APPLICATION_COUNT":
    case "APPLIED_COVERAGE":
      return "list_seeker_applications";
    case "EMPLOYER_JOBS":
    case "EMPLOYER_JOB_STATUS":
    case "EMPLOYER_APPLICATION_COUNT":
      return "list_employer_jobs";
    default:
      return "none";
  }
}

export async function executeSearchPublicJobs(
  auth: WhatsAppToolAuth,
  rawInput: z.input<typeof searchPublicJobsInputSchema>,
  jobSeekerId?: string,
) {
  const gate = authorizeWhatsAppRole({
    account: auth.account,
    intent: "JOB_SEARCH",
    activeRole: auth.activeRole,
  });
  if (!gate.allowed) {
    return deny("search_public_jobs", gate.reason);
  }
  const input = searchPublicJobsInputSchema.parse(rawInput);
  const query = publicJobsQuerySchema.parse({
    search: input.search,
    city: input.city,
    ...(input.state ? { state: input.state } : {}),
    ...(input.experience ? { experience: input.experience } : {}),
    ...(input.minSalary != null ? { minSalary: input.minSalary } : {}),
    ...(input.maxSalary != null ? { maxSalary: input.maxSalary } : {}),
    limit: input.limit,
    page: input.page,
    sort: "latest",
  });
  const result = await jobService.listPublicActiveJobs(query, jobSeekerId);
  return {
    ok: true as const,
    tool: "search_public_jobs" as const,
    reason: "ok",
    result: {
      total: result.pagination.total,
      jobs: result.jobs.slice(0, input.limit).map((job) => ({
        jobId: String(job.jobId ?? ""),
        jobTitle: String(job.jobTitle ?? ""),
        companyName: String(job.companyName ?? ""),
        cityName: String(job.cityName ?? job.city ?? ""),
        salaryType: String(job.salaryType ?? ""),
        fixedSalary: job.fixedSalary ?? null,
        minimumSalary: job.minimumSalary ?? null,
        maximumSalary: job.maximumSalary ?? null,
      })),
    },
  };
}

export async function executeListSeekerApplications(
  auth: WhatsAppToolAuth,
  input: { search?: string; limit?: number },
) {
  const gate = authorizeWhatsAppRole({
    account: auth.account,
    intent: "MY_APPLICATIONS",
    activeRole: auth.activeRole,
  });
  if (!gate.allowed || !auth.seekerId) {
    return deny("list_seeker_applications", gate.allowed ? "seeker_required" : gate.reason);
  }
  const result = await applicationService.listForSeeker({
    jobSeekerId: auth.seekerId,
    search: input.search || "",
    limit: Math.min(input.limit ?? 3, 10),
    page: 1,
    sort: "newest",
  });
  return {
    ok: true as const,
    tool: "list_seeker_applications" as const,
    reason: "ok",
    result: {
      total: result.pagination.total,
      applications: result.applications.slice(0, 3).map((item) => ({
        jobTitle: item.jobTitle,
        companyName: item.companyName,
        status: item.status,
      })),
    },
  };
}

export async function executeListEmployerJobs(
  auth: WhatsAppToolAuth,
  input: { search?: string; limit?: number },
) {
  const gate = authorizeWhatsAppRole({
    account: auth.account,
    intent: "EMPLOYER_JOBS",
    activeRole: auth.activeRole,
  });
  if (!gate.allowed || !auth.employerId) {
    return deny("list_employer_jobs", gate.allowed ? "employer_required" : gate.reason);
  }
  const query = listEmployerJobsQuerySchema.parse({
    limit: Math.min(input.limit ?? 5, 10),
    page: 1,
    search: input.search || "",
  });
  const listed = await jobService.listEmployerJobs(auth.employerId, query);
  return {
    ok: true as const,
    tool: "list_employer_jobs" as const,
    reason: "ok",
    result: {
      jobs: listed.jobs.slice(0, 5).map((job) => ({
        jobTitle: job.jobTitle,
        status: job.status,
        applications: job.applications,
      })),
    },
  };
}
