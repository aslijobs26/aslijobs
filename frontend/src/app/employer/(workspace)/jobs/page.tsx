import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import { EmployerJobsPageContent } from "@/components/employer-jobs/EmployerJobsPageContent";
import { Suspense } from "react";

export const metadata = createEmployerModuleMetadata({
  title: "Jobs",
  description: "Manage employer job listings on AsliJobs",
});

export default function EmployerJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-8 text-sm text-muted sm:px-6">Loading jobs…</div>
      }
    >
      <EmployerJobsPageContent />
    </Suspense>
  );
}
