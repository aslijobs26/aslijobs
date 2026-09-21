import { AnalyticsBeacon } from "@/components/analytics/AnalyticsBeacon";
import { JobSeekerDashboardLayout } from "@/components/job-seeker-dashboard/JobSeekerDashboardLayout";
import type { ReactNode } from "react";

type JobSeekerWorkspaceLayoutProps = {
  children: ReactNode;
};

export default function JobSeekerWorkspaceLayout({
  children,
}: JobSeekerWorkspaceLayoutProps) {
  return (
    <>
      <AnalyticsBeacon portal="job_seeker" />
      <JobSeekerDashboardLayout>{children}</JobSeekerDashboardLayout>
    </>
  );
}
