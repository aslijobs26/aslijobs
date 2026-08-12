import { JobSeekerContentPage } from "@/components/job-seeker-content/JobSeekerContentPage";
import { EMPLOYER_GUIDE_CONTENT } from "@/constants/employer-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${EMPLOYER_GUIDE_CONTENT.title} | AsliJobs`,
  description: EMPLOYER_GUIDE_CONTENT.metaDescription,
};

export default function EmployerGuidePage() {
  return <JobSeekerContentPage content={EMPLOYER_GUIDE_CONTENT} />;
}
