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
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-16 text-center text-sm text-muted">
          Loading settings…
        </div>
      }
    >
      <JobSeekerSettingsPageContent />
    </Suspense>
  );
}
