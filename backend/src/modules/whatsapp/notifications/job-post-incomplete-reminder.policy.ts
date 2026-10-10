import { createJobSchema } from "../../jobs/job.validation.js";

const MINUTES_TO_MS = 60_000;

/** Production wait after the employer leaves an incomplete job draft. */
export const JOB_POST_INCOMPLETE_PRODUCTION_DELAY_MINUTES = 30;

export type PersistedJobDraftSnapshot = {
  status?: string | null;
  employerId?: { toString(): string } | string | null;
  companyName?: string | null;
  industry?: string | null;
  businessCategory?: string | null;
  companySize?: string | null;
  jobTitle?: string | null;
  jobType?: string | null;
  contractPeriodFrom?: string | null;
  contractPeriodTo?: string | null;
  partTimeSchedule?: string | null;
  partTimeStartTime?: string | null;
  partTimeEndTime?: string | null;
  partTimeFlexibleHours?: string | null;
  workMode?: string | null;
  vacancies?: number | null;
  description?: string | null;
  state?: string | null;
  stateName?: string | null;
  city?: string | null;
  cityName?: string | null;
  address?: string | null;
  landmark?: string | null;
  salaryType?: string | null;
  salaryPeriod?: string | null;
  fixedSalary?: number | null;
  minimumSalary?: number | null;
  maximumSalary?: number | null;
  perks?: string[] | null;
  education?: string[] | null;
  experience?: string | null;
  languages?: string[] | null;
  gender?: string[] | null;
  minimumAge?: number | null;
  maximumAge?: number | null;
  walkInEnabled?: boolean | null;
  interviewAddress?: string | null;
  walkInStartDate?: string | null;
  walkInEndDate?: string | null;
  walkInStartTime?: string | null;
  walkInEndTime?: string | null;
  interviewInstructions?: string | null;
  contactPersonName?: string | null;
  contactEmail?: string | null;
  contactMobile?: string | null;
};

/**
 * Production always waits 30 minutes. A short local testing value must not
 * leak into production when the platform variable is missing or still set
 * to a testing delay.
 */
export function resolveJobPostIncompleteReminderDelayMinutes(
  configuredMinutes: number,
  nodeEnv: string,
): number {
  if (nodeEnv === "production") {
    return JOB_POST_INCOMPLETE_PRODUCTION_DELAY_MINUTES;
  }
  const minutes = Number.isFinite(configuredMinutes)
    ? Math.trunc(configuredMinutes)
    : JOB_POST_INCOMPLETE_PRODUCTION_DELAY_MINUTES;
  return Math.min(24 * 60, Math.max(1, minutes));
}

/**
 * Converts reminder delay minutes into milliseconds.
 */
export function jobPostIncompleteReminderDelayMs(delayMinutes: number): number {
  const minutes = Number.isFinite(delayMinutes)
    ? Math.max(1, Math.trunc(delayMinutes))
    : 1;
  return minutes * MINUTES_TO_MS;
}

function text(value: string | null | undefined): string {
  return typeof value === "string" ? value : "";
}

function reviewPayload(job: PersistedJobDraftSnapshot) {
  return {
    companyName: text(job.companyName),
    industry: text(job.industry),
    businessCategory: text(job.businessCategory),
    companySize: text(job.companySize),
    jobTitle: text(job.jobTitle),
    jobType: text(job.jobType),
    contractPeriodFrom: text(job.contractPeriodFrom),
    contractPeriodTo: text(job.contractPeriodTo),
    partTimeSchedule: text(job.partTimeSchedule),
    partTimeStartTime: text(job.partTimeStartTime),
    partTimeEndTime: text(job.partTimeEndTime),
    partTimeFlexibleHours: text(job.partTimeFlexibleHours),
    workMode: text(job.workMode),
    vacancies: job.vacancies ?? 0,
    description: text(job.description),
    state: text(job.state),
    stateName: text(job.stateName),
    city: text(job.city),
    cityName: text(job.cityName),
    address: text(job.address),
    landmark: text(job.landmark),
    salaryType: text(job.salaryType),
    salaryPeriod: text(job.salaryPeriod),
    fixedSalary: job.fixedSalary ?? null,
    minimumSalary: job.minimumSalary ?? null,
    maximumSalary: job.maximumSalary ?? null,
    perks: Array.isArray(job.perks) ? job.perks : [],
    education: Array.isArray(job.education) ? job.education : [],
    experience: text(job.experience),
    languages: Array.isArray(job.languages) ? job.languages : [],
    gender: Array.isArray(job.gender) ? job.gender : [],
    minimumAge: job.minimumAge ?? null,
    maximumAge: job.maximumAge ?? null,
    walkInEnabled: job.walkInEnabled === true,
    interviewAddress: text(job.interviewAddress),
    walkInStartDate: text(job.walkInStartDate),
    walkInEndDate: text(job.walkInEndDate),
    walkInStartTime: text(job.walkInStartTime),
    walkInEndTime: text(job.walkInEndTime),
    interviewInstructions: text(job.interviewInstructions),
    contactPersonName: text(job.contactPersonName),
    contactEmail: text(job.contactEmail),
    contactMobile: text(job.contactMobile),
    status: "draft" as const,
  };
}

/**
 * A draft is incomplete when it still cannot pass the existing publish schema.
 * A draft that already satisfies those rules is complete and is not reminded.
 */
export function isJobDraftIncomplete(
  job: PersistedJobDraftSnapshot | null,
): boolean {
  if (!job || String(job.status ?? "") !== "draft") {
    return false;
  }
  return !createJobSchema.safeParse(reviewPayload(job)).success;
}

export function persistedEmployerId(
  employerId: PersistedJobDraftSnapshot["employerId"],
): string {
  if (!employerId) {
    return "";
  }
  return typeof employerId === "string" ? employerId.trim() : employerId.toString();
}
