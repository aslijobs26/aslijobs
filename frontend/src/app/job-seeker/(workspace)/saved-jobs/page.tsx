import type { Metadata } from "next";
import { JobSeekerDashboardPlaceholder } from "@/components/job-seeker-dashboard/JobSeekerDashboardPlaceholder";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Saved Jobs | AsliJobs",
  description: "Saved jobs for AsliJobs job seekers — coming soon.",
};

export default function JobSeekerSavedJobsPage() {
  return (
    <JobSeekerDashboardPlaceholder
      title="Saved Jobs"
      description="Saving jobs to your account is coming soon. Meanwhile, browse open roles and apply when you're ready."
      actionHref={ROUTES.FIND_JOBS}
      actionLabel="Browse Jobs"
    />
  );
}
