import { JobSeekerSettingsPageSkeleton } from "@/components/job-seeker-dashboard/skeletons/JobSeekerPageSkeletons";
import type { Metadata } from "next";
import { JobSeekerSettingsPageContent } from "@/components/job-seeker-settings/JobSeekerSettingsPageContent";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Settings | AsliJobs",
  description:
    "Manage your job seeker account, preferences and privacy settings.",
};

export default function JobSeekerSettingsPage() {
  return (
    <Suspense fallback={<JobSeekerSettingsPageSkeleton />}>
      <JobSeekerSettingsPageContent />
    </Suspense>
  );
}
