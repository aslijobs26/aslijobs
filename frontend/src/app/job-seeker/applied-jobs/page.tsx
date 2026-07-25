import type { Metadata } from "next";
import { AppliedJobsPageContent } from "@/components/job-seeker-applications/AppliedJobsPageContent";
import { JobSeekerAuthGuard } from "@/components/job-seeker/JobSeekerAuthGuard";

export const metadata: Metadata = {
  title: "Applied Jobs | AsliJobs",
  description: "Track your job applications, interviews, and offers on AsliJobs.",
};

export default function JobSeekerAppliedJobsPage() {
  return (
    <JobSeekerAuthGuard>
      <main className="min-h-dvh bg-hero-bg">
        <AppliedJobsPageContent />
      </main>
    </JobSeekerAuthGuard>
  );
}
