import { JobSeekerNotificationsPageSkeleton } from "@/components/job-seeker-dashboard/skeletons/JobSeekerPageSkeletons";
import type { Metadata } from "next";
import { Suspense } from "react";
import { JobSeekerNotificationsPageContent } from "@/components/job-seeker-notifications/JobSeekerNotificationsPageContent";

export const metadata: Metadata = {
  title: "Notifications | AsliJobs",
  description: "Track application, interview, and offer updates on AsliJobs.",
};

export default function JobSeekerNotificationsPage() {
  return (
    <Suspense fallback={<JobSeekerNotificationsPageSkeleton />}>
      <JobSeekerNotificationsPageContent />
    </Suspense>
  );
}
