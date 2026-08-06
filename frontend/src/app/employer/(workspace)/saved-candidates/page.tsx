import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import dynamic from "next/dynamic";
import { Suspense } from "react";

export const metadata = createEmployerModuleMetadata({
  title: "Shortlisted Candidates",
  description: "View your shortlisted candidates on AsliJobs",
});

const SavedCandidatesPageContent = dynamic(
  () =>
    import("@/components/employer-saved-candidates/SavedCandidatesPageContent").then(
      (module) => module.SavedCandidatesPageContent,
    ),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center px-6">
        <p className="text-sm text-muted">Loading saved candidates…</p>
      </div>
    ),
  },
);

export default function EmployerSavedCandidatesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center px-6">
          <p className="text-sm text-muted">Loading saved candidates…</p>
        </div>
      }
    >
      <SavedCandidatesPageContent />
    </Suspense>
  );
}
