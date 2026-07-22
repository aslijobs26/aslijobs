import { PostJobPageClient } from "@/components/post-job/PostJobPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Draft Job | AsliJobs",
  description: "Continue editing your draft job on AsliJobs",
};

type PostJobEditPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function PostJobEditPage({ params }: PostJobEditPageProps) {
  const { jobId } = await params;

  return <PostJobPageClient draftJobId={jobId} />;
}
