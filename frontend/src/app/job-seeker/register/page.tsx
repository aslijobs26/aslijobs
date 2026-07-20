import { JobSeekerRegisterContent } from "@/components/job-seeker-register/JobSeekerRegisterContent";
import { EmployerRegisterPanel } from "@/components/employer-register/EmployerRegisterPanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a Job Seeker Account | AsliJobs",
  description: "Register as a job seeker on AsliJobs",
};

export default function JobSeekerRegisterPage() {
  return (
    <main className="employer-register-page job-seeker-register-page">
      <JobSeekerRegisterContent>
        <EmployerRegisterPanel />
      </JobSeekerRegisterContent>
    </main>
  );
}
