import { JobSeekerContentPage } from "@/components/job-seeker-content/JobSeekerContentPage";
import { FIND_JOBS_CONTENT } from "@/constants/job-seeker-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${FIND_JOBS_CONTENT.title} | AsliJobs`,
  description: FIND_JOBS_CONTENT.metaDescription,
};

export default function FindJobsContentPage() {
  return <JobSeekerContentPage content={FIND_JOBS_CONTENT} />;
}
