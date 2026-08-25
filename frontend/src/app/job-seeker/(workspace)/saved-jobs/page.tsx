import { JobSeekerListPageSkeleton } from "@/components/job-seeker-dashboard/skeletons/JobSeekerPageSkeletons";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SavedJobsPageContent } from "@/components/job-seeker-saved-jobs/SavedJobsPageContent";

export const metadata: Metadata = {
  title: "Saved Jobs | AsliJobs",
  description:
    "View and manage jobs you saved for later — filter, sort, apply, and track matches on AsliJobs.",
};

export default function JobSeekerSavedJobsPage() {
  return (
    <Suspense fallback={<JobSeekerListPageSkeleton />}>
      <SavedJobsPageContent />
    </Suspense>
  );
}
