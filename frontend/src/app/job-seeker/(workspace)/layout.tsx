import { JobSeekerDashboardLayout } from "@/components/job-seeker-dashboard/JobSeekerDashboardLayout";
import type { ReactNode } from "react";

type JobSeekerWorkspaceLayoutProps = {
  children: ReactNode;
};

export default function JobSeekerWorkspaceLayout({
  children,
}: JobSeekerWorkspaceLayoutProps) {
  return <JobSeekerDashboardLayout>{children}</JobSeekerDashboardLayout>;
}
