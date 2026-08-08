import { JobSeekerHelpSupportPageContent } from "@/components/job-seeker-help-support/JobSeekerHelpSupportPageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Support | AsliJobs",
  description:
    "Job seeker help and support — FAQs, popular topics, and ways to contact AsliJobs.",
};

export default function JobSeekerHelpSupportPage() {
  return <JobSeekerHelpSupportPageContent />;
}
