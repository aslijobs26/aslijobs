import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import dynamic from "next/dynamic";
import { Suspense } from "react";

export const metadata = createEmployerModuleMetadata({
  title: "Candidates",
  description:
    "Review candidates and submitted ATS resumes for your job openings",
});

const EmployerCandidatesPageContent = dynamic(
  () =>
    import("@/components/employer-candidates/EmployerCandidatesPageContent").then(
      (module) => module.EmployerCandidatesPageContent,
    ),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center px-6">
        <p className="text-sm text-muted">Loading candidates…</p>
      </div>
    ),
  },
);

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
