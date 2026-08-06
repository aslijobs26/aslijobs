import type { Metadata } from "next";
import { Suspense } from "react";
import { AppliedJobsPageContent } from "@/components/job-seeker-applications/AppliedJobsPageContent";

export const metadata: Metadata = {
  title: "My Applications | AsliJobs",
  description:
    "Track and manage all your job applications, interviews, and offers on AsliJobs.",
};

function AppliedJobsPageFallback() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-56 rounded bg-primary-light/50" />
        <div className="h-4 w-80 max-w-full rounded bg-primary-light/30" />
        <div className="mt-4 h-10 w-full rounded-full bg-primary-light/25" />
        <div className="mt-6 h-40 rounded-xl bg-primary-light/20" />
      </div>
    </div>
  );
}

export default function JobSeekerAppliedJobsPage() {
  return (
    <Suspense fallback={<AppliedJobsPageFallback />}>
      <AppliedJobsPageContent showBackLink={false} />
    </Suspense>
  );
}
