import type { Metadata } from "next";
import { JobSeekerAuthGuard } from "@/components/job-seeker/JobSeekerAuthGuard";
import { MyResumePageContent } from "@/components/job-seeker-resume/MyResumePageContent";

export const metadata: Metadata = {
  title: "My Resume | AsliJobs",
  description: "View, download, and regenerate your ATS-friendly AsliJobs resume.",
};

export default function JobSeekerMyResumePage() {
  return (
    <JobSeekerAuthGuard>
      <main className="min-h-dvh bg-hero-bg">
        <MyResumePageContent />
      </main>
    </JobSeekerAuthGuard>
  );
}
