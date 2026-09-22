import { JobUnderReviewPageContent } from "@/components/employer-jobs/under-review/JobUnderReviewPageContent";
import {
  JOB_UNDER_REVIEW_PAGE_DESCRIPTION,
  JOB_UNDER_REVIEW_PAGE_TITLE,
} from "@/constants/job-under-review";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: JOB_UNDER_REVIEW_PAGE_TITLE,
  description: JOB_UNDER_REVIEW_PAGE_DESCRIPTION,
};

type JobUnderReviewPageProps = {
  params: Promise<{ jobId: string }>;
};

export default async function JobUnderReviewPage({
  params,
}: JobUnderReviewPageProps) {
  const { jobId } = await params;

  return <JobUnderReviewPageContent jobMongoId={jobId} />;
}
