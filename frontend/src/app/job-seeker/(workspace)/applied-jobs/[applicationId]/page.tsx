import type { Metadata } from "next";
import { AppliedJobDetailPageContent } from "@/components/job-seeker-applications/AppliedJobDetailPageContent";

export const metadata: Metadata = {
  title: "Application Details | AsliJobs",
  description:
    "View application timeline, interview details, and submitted resume.",
};

type AppliedJobDetailPageProps = {
  params: Promise<{ applicationId: string }>;
};

export default async function JobSeekerAppliedJobDetailPage({
  params,
}: AppliedJobDetailPageProps) {
  const { applicationId } = await params;

  return <AppliedJobDetailPageContent applicationId={applicationId} />;
}
