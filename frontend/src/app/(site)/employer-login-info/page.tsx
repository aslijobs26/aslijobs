import { JobSeekerContentPage } from "@/components/job-seeker-content/JobSeekerContentPage";
import { EMPLOYER_LOGIN_CONTENT } from "@/constants/employer-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${EMPLOYER_LOGIN_CONTENT.title} | AsliJobs`,
  description: EMPLOYER_LOGIN_CONTENT.metaDescription,
};

export default function EmployerLoginInfoPage() {
  return <JobSeekerContentPage content={EMPLOYER_LOGIN_CONTENT} />;
}
