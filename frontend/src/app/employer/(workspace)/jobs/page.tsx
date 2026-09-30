import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import { EmployerJobsPageContent } from "@/components/employer-jobs/EmployerJobsPageContent";
import { EmployerJobsPageFallback } from "@/components/employer-jobs/EmployerJobsPageFallback";
import { Suspense } from "react";

export const metadata = createEmployerModuleMetadata({
  title: "Jobs",
  description: "Manage employer job listings on AsliJobs",
});

export default function EmployerJobsPage() {
  return (
    <Suspense fallback={<EmployerJobsPageFallback />}>
      <EmployerJobsPageContent />
    </Suspense>
  );
}
