import { EmployerCandidatesPageContent } from "@/components/employer-candidates/EmployerCandidatesPageContent";
import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import { Suspense } from "react";

export const metadata = createEmployerModuleMetadata({
  title: "Candidates",
  description: "Review candidates and submitted ATS resumes for your job openings",
});

export default function EmployerCandidatesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center px-6">
          <p className="text-sm text-muted">Loading candidates…</p>
        </div>
      }
    >
      <EmployerCandidatesPageContent />
    </Suspense>
  );
}
