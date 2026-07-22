import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import { EmployerJobsPageContent } from "@/components/employer-jobs/EmployerJobsPageContent";

export const metadata = createEmployerModuleMetadata({
  title: "Jobs",
  description: "Manage employer job listings on AsliJobs",
});

export default function EmployerJobsPage() {
  return <EmployerJobsPageContent />;
}
