import type { Metadata } from "next";
import {
  buildPublicJobUrl,
  publicJobCityLabel,
  publicJobStateLabel,
  toPublicHttpsUrl,
  type PublicJobSeo,
} from "./public-job-seo";

const SITE_NAME = "AsliJobs";

/** "Delivery Boy Jobs" rather than "Delivery Boy Jobs Jobs". */
function jobsPhrase(jobTitle: string): string {
  const base = jobTitle.trim().replace(/\s+jobs?$/i, "").trim() || jobTitle.trim();
  return `${base} Jobs`;
}

export function buildJobPageMetadata(
  job: PublicJobSeo,
  siteUrl: string,
): Metadata {
  const canonical = buildPublicJobUrl(siteUrl, job.publicJobId);
  const location = publicJobCityLabel(job) || publicJobStateLabel(job);
  const jobTitle = job.jobTitle.trim();

  if (!jobTitle) {
    return {
      title: `${job.publicJobId} | ${SITE_NAME}`,
      alternates: { canonical },
    };
  }

  const phrase = jobsPhrase(jobTitle);
  const title = `${phrase}${location ? ` in ${location}` : ""} | ${SITE_NAME}`;
  const description = [
    `Apply for ${phrase.replace(/Jobs$/, "jobs")}`,
    location ? ` in ${location}` : "",
    job.companyName ? ` at ${job.companyName}` : "",
    `. View salary, job requirements and application details on ${SITE_NAME}.`,
  ].join("");
  const image = toPublicHttpsUrl(job.companyLogoUrl);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: canonical,
      title,
      description,
      ...(image ? { images: [{ url: image, alt: job.companyName || SITE_NAME }] } : {}),
    },
  };
}

/** Closed, expired, deleted or never-public jobs: keep them out of the index. */
export function buildUnavailableJobMetadata(
  siteUrl: string,
  publicJobId: string | null,
): Metadata {
  return {
    title: `Job not available | ${SITE_NAME}`,
    description: `This job is no longer accepting applications on ${SITE_NAME}.`,
    robots: { index: false, follow: true },
    ...(publicJobId
      ? { alternates: { canonical: buildPublicJobUrl(siteUrl, publicJobId) } }
      : {}),
  };
}

/** Backend temporarily unreachable: previous generic metadata, no index change. */
export function buildFallbackJobMetadata(
  siteUrl: string,
  rawJobId: string,
  publicJobId: string | null,
): Metadata {
  return {
    title: `${publicJobId ?? rawJobId} | ${SITE_NAME}`,
    description: `View this job opportunity on ${SITE_NAME}`,
    ...(publicJobId
      ? { alternates: { canonical: buildPublicJobUrl(siteUrl, publicJobId) } }
      : {}),
  };
}
