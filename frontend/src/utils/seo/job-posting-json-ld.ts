import {
  getJobDescriptionPlainText,
  looksLikeJobDescriptionHtml,
  sanitizeJobDescriptionHtml,
} from "../job-description-html";
import {
  buildPublicJobUrl,
  publicJobCityLabel,
  publicJobStateLabel,
  toPublicHttpsUrl,
  type PublicJobSeo,
} from "./public-job-seo";

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue | undefined };

export type JobPostingJsonLd = { [key: string]: JsonLdValue | undefined };

/** AsliJobs only lists jobs in India and pays in INR. */
const JOB_COUNTRY_CODE = "IN";
const JOB_COUNTRY_NAME = "India";
const SALARY_CURRENCY = "INR";

const EMPLOYMENT_TYPES: Record<string, string> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACTOR",
};

/** "Work from Home" is the only fully remote work mode; Office + Field is on-site. */
const REMOTE_WORK_MODE = "home";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Same content the job page renders: sanitized HTML, or legacy plain text
 * turned into paragraphs and line breaks (the page shows it pre-wrapped).
 */
export function toJobPostingDescriptionHtml(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) {
    return "";
  }
  if (looksLikeJobDescriptionHtml(trimmed)) {
    return sanitizeJobDescriptionHtml(trimmed);
  }
  return trimmed
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\r?\n/g, "<br>")}</p>`)
    .join("");
}

function toIsoDate(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

/** Mirrors `formatJobSearchSalary`: only amounts the employer entered. */
export function buildBaseSalary(job: PublicJobSeo): JobPostingJsonLd | null {
  const unitText = job.salaryPeriod === "per-year" ? "YEAR" : "MONTH";
  const amount = (value: Record<string, number>): JobPostingJsonLd => ({
    "@type": "MonetaryAmount",
    currency: SALARY_CURRENCY,
    value: { "@type": "QuantitativeValue", ...value, unitText },
  });

  if (job.salaryType === "fixed" && job.fixedSalary != null) {
    return amount({ value: job.fixedSalary });
  }
  if (
    job.salaryType === "range" &&
    job.minimumSalary != null &&
    job.maximumSalary != null
  ) {
    if (job.minimumSalary > job.maximumSalary) {
      return null;
    }
    return job.minimumSalary === job.maximumSalary
      ? amount({ value: job.minimumSalary })
      : amount({ minValue: job.minimumSalary, maxValue: job.maximumSalary });
  }
  if (job.minimumSalary != null) {
    return amount({ minValue: job.minimumSalary });
  }
  if (job.maximumSalary != null) {
    return amount({ maxValue: job.maximumSalary });
  }
  return null;
}

function buildHiringOrganization(job: PublicJobSeo): JobPostingJsonLd {
  const sameAs = /^https?:\/\//i.test(job.companyWebsite)
    ? job.companyWebsite
    : null;
  const logo = toPublicHttpsUrl(job.companyLogoUrl);
  return {
    "@type": "Organization",
    name: job.companyName,
    ...(sameAs ? { sameAs } : {}),
    ...(logo ? { logo } : {}),
  };
}

function buildJobLocation(job: PublicJobSeo): JobPostingJsonLd | null {
  const locality = publicJobCityLabel(job);
  const region = publicJobStateLabel(job);
  if (!locality && !region) {
    return null;
  }
  return {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      ...(job.address ? { streetAddress: job.address } : {}),
      ...(locality ? { addressLocality: locality } : {}),
      ...(region ? { addressRegion: region } : {}),
      addressCountry: JOB_COUNTRY_CODE,
    },
  };
}

/**
 * Schema.org JobPosting for a publicly visible job, or null when a property
 * Google requires (title, description, datePosted, hiringOrganization,
 * location) is missing. Never includes recruiter contact details.
 */
export function buildJobPostingJsonLd(
  job: PublicJobSeo,
  siteUrl: string,
): JobPostingJsonLd | null {
  const title = job.jobTitle.trim();
  const description = toJobPostingDescriptionHtml(job.description);
  const datePosted = toIsoDate(job.publishedAt ?? job.createdAt);
  const companyName = job.companyName.trim();
  const plainDescription = getJobDescriptionPlainText(description);

  if (
    !title ||
    !plainDescription ||
    plainDescription.toLowerCase() === title.toLowerCase() ||
    !datePosted ||
    !companyName
  ) {
    return null;
  }

  const isRemote = job.workMode === REMOTE_WORK_MODE;
  const jobLocation = isRemote ? null : buildJobLocation(job);
  if (!isRemote && !jobLocation) {
    return null;
  }

  const employmentType = EMPLOYMENT_TYPES[job.jobType];
  const baseSalary = buildBaseSalary(job);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description,
    identifier: {
      "@type": "PropertyValue",
      name: "AsliJobs",
      value: job.publicJobId,
    },
    url: buildPublicJobUrl(siteUrl, job.publicJobId),
    datePosted,
    ...(employmentType ? { employmentType } : {}),
    hiringOrganization: buildHiringOrganization(job),
    ...(jobLocation ? { jobLocation } : {}),
    ...(isRemote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: {
            "@type": "Country",
            name: JOB_COUNTRY_NAME,
          },
        }
      : {}),
    ...(baseSalary ? { baseSalary } : {}),
    // Applying needs sign-in, profile completion and a resume choice.
    directApply: false,
  };
}

/**
 * JSON for an inline `<script type="application/ld+json">`. Escapes every
 * character that could close the script element or break the HTML parser.
 */
export function serializeJsonLd(data: JobPostingJsonLd): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
