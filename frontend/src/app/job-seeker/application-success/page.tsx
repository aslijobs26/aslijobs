import type { Metadata } from "next";
import { ApplicationSuccessPageContent } from "@/components/job-seeker-applications/ApplicationSuccessPageContent";

export const metadata: Metadata = {
  title: "Application Submitted | AsliJobs",
  description:
    "Your job application was submitted successfully. Track hiring updates from Applied Jobs.",
};

export default function JobSeekerApplicationSuccessPage() {
  return <ApplicationSuccessPageContent />;
}
