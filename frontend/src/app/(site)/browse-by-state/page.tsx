import { JobSeekerContentPage } from "@/components/job-seeker-content/JobSeekerContentPage";
import { BROWSE_BY_STATE_CONTENT } from "@/constants/job-seeker-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${BROWSE_BY_STATE_CONTENT.title} | AsliJobs`,
  description: BROWSE_BY_STATE_CONTENT.metaDescription,
};

export default function BrowseByStatePage() {
  return <JobSeekerContentPage content={BROWSE_BY_STATE_CONTENT} />;
}
