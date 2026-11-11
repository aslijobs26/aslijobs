import { toPublicMediaUrl } from "../storage/public-media-url.js";
import { parseJobContentLanguage } from "./job-content-language.js";
import {
  presentPublicWebsiteJobContent,
  resolvePublicJobTranslationView,
} from "./job-content-translation.js";

/** Search engines crawl the public site in its default language. */
const PUBLIC_JOB_SEO_LANGUAGE = parseJobContentLanguage("en");

export const PUBLIC_JOB_SEO_EMPLOYER_FIELDS =
  "verificationStatus accountType companyName website companyLogo.url";

export type PublicJobSeoSource = {
  jobId?: string | null;
  jobTitle?: string | null;
  description?: string | null;
  interviewInstructions?: string | null;
  contentLanguage?: string | null;
  contentTranslations?: unknown;
  companyName?: string | null;
  jobType?: string | null;
  workMode?: string | null;
  address?: string | null;
  city?: string | null;
  cityName?: string | null;
  state?: string | null;
  stateName?: string | null;
  salaryType?: string | null;
  salaryPeriod?: string | null;
  fixedSalary?: number | null;
  minimumSalary?: number | null;
  maximumSalary?: number | null;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

export type PublicJobSeoEmployer = {
  accountType?: string | null;
  companyName?: string | null;
  website?: string | null;
  companyLogo?: { url?: string | null } | null;
} | null;

export type PublicJobSeoSnapshot = {
  publicJobId: string;
  jobTitle: string;
  description: string;
  companyName: string;
  companyLogoUrl: string;
  companyWebsite: string;
  jobType: string;
  workMode: string;
  address: string;
  city: string;
  cityName: string;
  state: string;
  stateName: string;
  salaryType: string;
  salaryPeriod: string;
  fixedSalary: number | null;
  minimumSalary: number | null;
  maximumSalary: number | null;
  publishedAt: string | null;
  createdAt: string | null;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null || value === "") {
    return null;
  }
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function toAmount(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function normalizeName(value: unknown): string {
  return text(value).toLowerCase().replace(/\s+/g, " ");
}

/** Public http(s) website; bare domains such as `www.example.com` get https. */
export function normalizeCompanyWebsite(value: unknown): string {
  const raw = text(value);
  if (!raw) {
    return "";
  }
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    const host = url.hostname.toLowerCase();
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password ||
      !host.includes(".") ||
      host === "localhost" ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)
    ) {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

/**
 * The employer account's logo and website describe the job's hiring
 * organization only when the job is posted under that same business name.
 * Consultancies often post for clients; individuals have no company logo.
 */
export function resolveHiringOrganizationAssets(
  jobCompanyName: string,
  employer: PublicJobSeoEmployer,
): { companyLogoUrl: string; companyWebsite: string } {
  if (
    !employer ||
    employer.accountType === "individual" ||
    !jobCompanyName ||
    normalizeName(employer.companyName) !== normalizeName(jobCompanyName)
  ) {
    return { companyLogoUrl: "", companyWebsite: "" };
  }

  return {
    companyLogoUrl: toPublicMediaUrl(text(employer.companyLogo?.url)),
    companyWebsite: normalizeCompanyWebsite(employer.website),
  };
}

/**
 * Public, read-only snapshot of a visible job for structured data and page
 * metadata. Mirrors the default-language public job page; never includes
 * recruiter contact details, internal ids or counters.
 */
export function toPublicJobSeoSnapshot(
  job: PublicJobSeoSource,
  employer: PublicJobSeoEmployer,
): PublicJobSeoSnapshot {
  const sourceTitle = text(job.jobTitle);
  const content = presentPublicWebsiteJobContent(
    resolvePublicJobTranslationView(
      {
        jobTitle: sourceTitle,
        description: text(job.description),
        interviewInstructions: text(job.interviewInstructions),
        contentLanguage: text(job.contentLanguage) || null,
        contentTranslations:
          job.contentTranslations && typeof job.contentTranslations === "object"
            ? (job.contentTranslations as never)
            : null,
      },
      PUBLIC_JOB_SEO_LANGUAGE,
    ).content,
    sourceTitle,
  );
  const companyName = text(job.companyName);

  return {
    publicJobId: text(job.jobId).toUpperCase(),
    jobTitle: content.jobTitle,
    description: content.description,
    companyName,
    ...resolveHiringOrganizationAssets(companyName, employer),
    jobType: text(job.jobType),
    workMode: text(job.workMode),
    address: text(job.address),
    city: text(job.city),
    cityName: text(job.cityName),
    state: text(job.state),
    stateName: text(job.stateName),
    salaryType: text(job.salaryType),
    salaryPeriod: text(job.salaryPeriod) || "per-month",
    fixedSalary: toAmount(job.fixedSalary),
    minimumSalary: toAmount(job.minimumSalary),
    maximumSalary: toAmount(job.maximumSalary),
    publishedAt: toIso(job.publishedAt),
    createdAt: toIso(job.createdAt),
  };
}
