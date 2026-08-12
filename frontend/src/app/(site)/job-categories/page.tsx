import { JobSeekerContentPage } from "@/components/job-seeker-content/JobSeekerContentPage";
import { JOB_CATEGORIES_CONTENT } from "@/constants/job-seeker-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${JOB_CATEGORIES_CONTENT.title} | AsliJobs`,
  description: JOB_CATEGORIES_CONTENT.metaDescription,
};

export default function JobCategoriesPage() {
  return <JobSeekerContentPage content={JOB_CATEGORIES_CONTENT} />;
}
