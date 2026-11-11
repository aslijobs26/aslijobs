/** Public job snapshot from `GET /jobs/public/:publicJobId/seo`. */
export type PublicJobSeo = {
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

/** Same pattern the public job detail API accepts. */
const PUBLIC_JOB_ID_PATTERN = /^AJ-\d{4}-\d{6}$/;

export function normalizePublicJobId(value: string): string | null {
  const publicJobId = value.trim().toUpperCase();
  return PUBLIC_JOB_ID_PATTERN.test(publicJobId) ? publicJobId : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function readAmount(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function readDate(record: Record<string, unknown>, key: string): string | null {
  const value = readText(record, key);
  return value && Number.isFinite(new Date(value).getTime()) ? value : null;
}

/** Validates the backend payload; null when it is not a usable public job. */
export function parsePublicJobSeoResponse(body: unknown): PublicJobSeo | null {
  const data = isRecord(body) ? body.data : undefined;
  const job = isRecord(data) ? data.job : undefined;
  if (!isRecord(job)) {
    return null;
  }

  const publicJobId = normalizePublicJobId(readText(job, "publicJobId"));
  if (!publicJobId) {
    return null;
  }

  return {
    publicJobId,
    jobTitle: readText(job, "jobTitle"),
    description: readText(job, "description"),
    companyName: readText(job, "companyName"),
    companyLogoUrl: readText(job, "companyLogoUrl"),
    companyWebsite: readText(job, "companyWebsite"),
    jobType: readText(job, "jobType"),
    workMode: readText(job, "workMode"),
    address: readText(job, "address"),
    city: readText(job, "city"),
    cityName: readText(job, "cityName"),
    state: readText(job, "state"),
    stateName: readText(job, "stateName"),
    salaryType: readText(job, "salaryType"),
    salaryPeriod: readText(job, "salaryPeriod"),
    fixedSalary: readAmount(job, "fixedSalary"),
    minimumSalary: readAmount(job, "minimumSalary"),
    maximumSalary: readAmount(job, "maximumSalary"),
    publishedAt: readDate(job, "publishedAt"),
    createdAt: readDate(job, "createdAt"),
  };
}

export function buildPublicJobUrl(siteUrl: string, publicJobId: string): string {
  return `${siteUrl}/jobs/${encodeURIComponent(publicJobId)}`;
}

/** City shown on the job page (`formatJobSearchLocation` order). */
export function publicJobCityLabel(job: PublicJobSeo): string {
  return job.cityName || job.city;
}

export function publicJobStateLabel(job: PublicJobSeo): string {
  return job.stateName || job.state;
}

/** Only absolute https assets are safe to hand to crawlers and social cards. */
export function toPublicHttpsUrl(value: string): string | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      host === "localhost" ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}
