import type { Metadata } from "next";
import { AppliedJobsPageContent } from "@/components/job-seeker-applications/AppliedJobsPageContent";

export const metadata: Metadata = {
  title: "Applied Jobs | AsliJobs",
  description: "Track your job applications, interviews, and offers on AsliJobs.",
};

export default function JobSeekerAppliedJobsPage() {
  return <AppliedJobsPageContent showBackLink={false} />;
}
