import { JobSeekerContentPage } from "@/components/job-seeker-content/JobSeekerContentPage";
import { POST_A_JOB_CONTENT } from "@/constants/employer-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${POST_A_JOB_CONTENT.title} | AsliJobs`,
  description: POST_A_JOB_CONTENT.metaDescription,
};

export default function PostAJobContentPage() {
  return <JobSeekerContentPage content={POST_A_JOB_CONTENT} />;
}
