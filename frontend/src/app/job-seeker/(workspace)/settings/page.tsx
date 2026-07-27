import type { Metadata } from "next";
import { JobSeekerDashboardPlaceholder } from "@/components/job-seeker-dashboard/JobSeekerDashboardPlaceholder";

export const metadata: Metadata = {
  title: "Account Settings | AsliJobs",
  description: "Job seeker account settings — coming soon.",
};

export default function JobSeekerSettingsPage() {
  return (
    <JobSeekerDashboardPlaceholder
      title="Account Settings"
      description="Account preferences and privacy settings will be available here in a future update."
    />
  );
}
