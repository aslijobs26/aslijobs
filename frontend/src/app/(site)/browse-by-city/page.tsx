import { JobSeekerContentPage } from "@/components/job-seeker-content/JobSeekerContentPage";
import { BROWSE_BY_CITY_CONTENT } from "@/constants/job-seeker-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${BROWSE_BY_CITY_CONTENT.title} | AsliJobs`,
  description: BROWSE_BY_CITY_CONTENT.metaDescription,
};

export default function BrowseByCityPage() {
  return <JobSeekerContentPage content={BROWSE_BY_CITY_CONTENT} />;
}
