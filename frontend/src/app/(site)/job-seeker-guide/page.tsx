import { JobSeekerContentPage } from "@/components/job-seeker-content/JobSeekerContentPage";
import { JOB_SEEKER_GUIDE_CONTENT } from "@/constants/job-seeker-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${JOB_SEEKER_GUIDE_CONTENT.title} | AsliJobs`,
  description: JOB_SEEKER_GUIDE_CONTENT.metaDescription,
};

export default function JobSeekerGuidePage() {
  return <JobSeekerContentPage content={JOB_SEEKER_GUIDE_CONTENT} />;
}
