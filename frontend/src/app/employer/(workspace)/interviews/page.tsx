import { EmployerInterviewsPageContent } from "@/components/employer-interviews/EmployerInterviewsPageContent";
import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import { Suspense } from "react";

export const metadata = createEmployerModuleMetadata({
  title: "Interviews",
  description: "Schedule, manage and track all interviews in one place",
});

export default function EmployerInterviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center px-6">
          <p className="text-sm text-muted">Loading interviews…</p>
        </div>
      }
    >
      <EmployerInterviewsPageContent />
    </Suspense>
  );
}
