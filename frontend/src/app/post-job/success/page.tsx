import { JobPostedSuccessContent } from "@/components/job-posted-success/JobPostedSuccessContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Submitted for Review | AsliJobs",
  description:
    "Your job has been submitted and is pending Operations approval before going live on AsliJobs.",
};

export default function JobPostedSuccessPage() {
  return <JobPostedSuccessContent />;
}
