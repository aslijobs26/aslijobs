import { UploadedResumePreviewPageContent } from "@/components/job-seeker-resume/UploadedResumePreviewPageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uploaded Resume Preview | AsliJobs",
  description: "Preview your uploaded resume on AsliJobs.",
};

export default function JobSeekerUploadedResumePreviewPage() {
  return <UploadedResumePreviewPageContent />;
}
