import type { SitemapEntry } from "./sitemap-xml";

/**
 * Indexable public pages under `src/app/(site)`. Category, city and state
 * browsing only exists as `/jobs` query filters, which are not listed.
 */
export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/jobs",
  "/find-jobs",
  "/job-categories",
  "/browse-by-city",
  "/browse-by-state",
  "/salary-guide",
  "/career-advice",
  "/interview-tips",
  "/job-seeker-guide",
  "/post-a-job",
  "/pricing-plans",
  "/employer-guide",
  "/employer-login-info",
  "/resources",
  "/help-center",
  "/faqs",
  "/guidelines",
  "/contact",
  "/privacy-policy",
  "/terms-and-conditions",
] as const;

/**
 * Authenticated workspaces, sign-in/registration and the job posting wizard.
 * Trailing slashes keep public pages such as `/employer-guide` crawlable.
 * robots.txt is crawl guidance only; these routes stay protected by auth.
 */
export const PRIVATE_CRAWL_PATHS = [
  "/employer/",
  "/job-seeker/",
  "/login",
  "/post-job",
  "/team/",
  "/team-member/",
] as const;

/**
 * Jobs per sitemap file. Stays below the 50,000 URL protocol limit so the
 * single-file sitemap still has room for every public page.
 */
export const JOBS_PER_SITEMAP = 45_000;

/** Same pattern the public job detail API accepts. */
const PUBLIC_JOB_ID_PATTERN = /^AJ-\d{4}-\d{6}$/;

const PAGES_SITEMAP_FILE = "pages.xml";
const JOBS_SITEMAP_FILE_PATTERN = /^jobs-([1-9]\d{0,5})\.xml$/;

export type SitemapJob = {
  publicJobId: string;
  lastModified: string | null;
};

export type SitemapJobsPage = {
  jobs: SitemapJob[];
  total: number;
  totalPages: number;
};

export type SitemapFile =
  | { kind: "pages" }
  | { kind: "jobs"; page: number };

export function buildPageUrl(siteUrl: string, path: string): string {
  return path === "/" ? `${siteUrl}/` : `${siteUrl}${path}`;
}

export function buildPublicPageEntries(siteUrl: string): SitemapEntry[] {
  return PUBLIC_SITEMAP_PATHS.map((path) => ({
    loc: buildPageUrl(siteUrl, path),
  }));
}

export function buildJobEntries(
  siteUrl: string,
  jobs: readonly SitemapJob[],
): SitemapEntry[] {
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [];

  for (const job of jobs) {
    const publicJobId = job.publicJobId.trim().toUpperCase();
    if (!PUBLIC_JOB_ID_PATTERN.test(publicJobId) || seen.has(publicJobId)) {
      continue;
    }
    seen.add(publicJobId);
    entries.push({
      loc: `${siteUrl}/jobs/${encodeURIComponent(publicJobId)}`,
      lastModified: job.lastModified,
    });
  }

  return entries;
}

/** Index entries when public URLs no longer fit in one sitemap file. */
export function buildSitemapIndexEntries(
  siteUrl: string,
  jobPages: number,
): SitemapEntry[] {
  const entries: SitemapEntry[] = [
    { loc: `${siteUrl}/sitemaps/${PAGES_SITEMAP_FILE}` },
  ];
  for (let page = 1; page <= jobPages; page += 1) {
    entries.push({ loc: `${siteUrl}/sitemaps/jobs-${page}.xml` });
  }
  return entries;
}

export function needsSitemapIndex(jobsPage: SitemapJobsPage): boolean {
  return jobsPage.totalPages > 1;
}

export function parseSitemapFile(file: string): SitemapFile | null {
  if (file === PAGES_SITEMAP_FILE) {
    return { kind: "pages" };
  }
  const match = JOBS_SITEMAP_FILE_PATTERN.exec(file);
  return match ? { kind: "jobs", page: Number(match[1]) } : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNonNegativeInt(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

/** Validates `GET /jobs/public/sitemap`; throws on an unexpected payload. */
export function parseSitemapJobsResponse(body: unknown): SitemapJobsPage {
  const data = isRecord(body) ? body.data : undefined;
  const jobs = isRecord(data) ? data.jobs : undefined;
  const pagination = isRecord(data) ? data.pagination : undefined;
  const total = isRecord(pagination) ? toNonNegativeInt(pagination.total) : null;
  const totalPages = isRecord(pagination)
    ? toNonNegativeInt(pagination.totalPages)
    : null;

  if (!Array.isArray(jobs) || total === null || totalPages === null) {
    throw new Error("Unexpected public job sitemap response");
  }

  return {
    jobs: jobs.flatMap((job): SitemapJob[] =>
      isRecord(job) && typeof job.publicJobId === "string"
        ? [
            {
              publicJobId: job.publicJobId,
              lastModified:
                typeof job.lastModified === "string" ? job.lastModified : null,
            },
          ]
        : [],
    ),
    total,
    totalPages: Math.max(1, totalPages),
  };
}
