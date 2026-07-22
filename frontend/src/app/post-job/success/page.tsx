import { JobPostedSuccessContent } from "@/components/job-posted-success/JobPostedSuccessContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Posted Successfully | AsliJobs",
  description:
    "Your job has been posted successfully and is now live for job seekers on AsliJobs.",
};

export default function JobPostedSuccessPage() {
  return <JobPostedSuccessContent />;
}
