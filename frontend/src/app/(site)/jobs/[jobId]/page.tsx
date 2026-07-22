import { PublicJobDetailPage } from "@/components/jobs/PublicJobDetailPage";
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
  return {
    title: `${jobId} | AsliJobs`,
    description: "View this job opportunity on AsliJobs",
  };
}

export default async function PublicJobPage({ params }: PublicJobPageProps) {
  const { jobId } = await params;
  return <PublicJobDetailPage publicJobId={jobId} />;
}
