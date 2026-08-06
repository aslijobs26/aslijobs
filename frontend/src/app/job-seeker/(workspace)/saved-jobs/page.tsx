import type { Metadata } from "next";
import { Suspense } from "react";
import { SavedJobsPageContent } from "@/components/job-seeker-saved-jobs/SavedJobsPageContent";

export const metadata: Metadata = {
  title: "Saved Jobs | AsliJobs",
  description:
    "View and manage jobs you saved for later — filter, sort, apply, and track matches on AsliJobs.",
};

function SavedJobsPageFallback() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-primary-light/50" />
        <div className="h-4 w-64 max-w-full rounded bg-primary-light/30" />
        <div className="mt-4 h-10 w-full rounded-full bg-primary-light/25" />
        <div className="mt-6 h-40 rounded-xl bg-primary-light/20" />
      </div>
    </div>
  );
}

export default function JobSeekerSavedJobsPage() {
  return (
    <Suspense fallback={<SavedJobsPageFallback />}>
      <SavedJobsPageContent />
    </Suspense>
  );
}
