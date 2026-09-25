import { JobSeekerLoginContent } from "@/components/job-seeker-login/JobSeekerLoginContent";
import { EmployerRegisterPanel } from "@/components/employer-register/EmployerRegisterPanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Seeker Login | AsliJobs",
  description: "Login to your AsliJobs job seeker account using WhatsApp",
};

export default function JobSeekerLoginPage() {
  return (
    <main className="employer-register-page job-seeker-register-page">
      <JobSeekerLoginContent>
        <EmployerRegisterPanel variant="seeker" />
      </JobSeekerLoginContent>
    </main>
  );
}
