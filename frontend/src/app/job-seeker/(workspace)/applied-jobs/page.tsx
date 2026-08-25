import { JobSeekerListPageSkeleton } from "@/components/job-seeker-dashboard/skeletons/JobSeekerPageSkeletons";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AppliedJobsPageContent } from "@/components/job-seeker-applications/AppliedJobsPageContent";

export const metadata: Metadata = {
  title: "My Applications | AsliJobs",
  description:
    "Track and manage all your job applications, interviews, and offers on AsliJobs.",
};

function AppliedJobsPageFallback() {
  return <JobSeekerListPageSkeleton />;
}

export default function JobSeekerAppliedJobsPage() {
  return (
    <Suspense fallback={<AppliedJobsPageFallback />}>
      <AppliedJobsPageContent showBackLink={false} />
    </Suspense>
  );
}
