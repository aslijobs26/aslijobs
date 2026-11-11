import { PublicJobDetailPage } from "@/components/jobs/PublicJobDetailPage";
import { getSiteUrl } from "@/constants/site-url";
import { loadPublicJobSeo } from "@/services/public-job-seo.service";
import {
  buildJobPostingJsonLd,
  serializeJsonLd,
} from "@/utils/seo/job-posting-json-ld";
import {
  buildFallbackJobMetadata,
  buildJobPageMetadata,
  buildUnavailableJobMetadata,
} from "@/utils/seo/job-page-metadata";
import type { Metadata } from "next";

type PublicJobPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function generateMetadata({
  params,
}: PublicJobPageProps): Promise<Metadata> {
  const { jobId } = await params;
  const siteUrl = getSiteUrl();
  const seo = await loadPublicJobSeo(jobId);

  if (seo.status === "available") {
    return buildJobPageMetadata(seo.job, siteUrl);
  }
  if (seo.status === "unavailable") {
    return buildUnavailableJobMetadata(siteUrl, seo.publicJobId);
  }
  return buildFallbackJobMetadata(siteUrl, jobId, seo.publicJobId);
}

export default async function PublicJobPage({ params }: PublicJobPageProps) {
  const { jobId } = await params;
  const seo = await loadPublicJobSeo(jobId);
  // Only jobs the public API still serves (active, verified employer) get JobPosting.
  const jsonLd =
    seo.status === "available"
      ? buildJobPostingJsonLd(seo.job, getSiteUrl())
      : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      ) : null}
      <PublicJobDetailPage publicJobId={jobId} />
    </>
  );
}
