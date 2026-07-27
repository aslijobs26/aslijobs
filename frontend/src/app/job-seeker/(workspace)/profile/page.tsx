import type { Metadata } from "next";
import { JobSeekerProfilePageContent } from "@/components/job-seeker-dashboard/JobSeekerProfilePageContent";

export const metadata: Metadata = {
  title: "Profile | AsliJobs",
  description: "View your AsliJobs job seeker profile details.",
};

export default function JobSeekerProfilePage() {
  return <JobSeekerProfilePageContent />;
}
