import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import { EmployerTablePageSkeleton } from "@/components/employer-dashboard/skeletons/EmployerPageSkeletons";
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
    loading: () => <EmployerTablePageSkeleton kpiCount={4} />,
  },
);

export default function EmployerSavedCandidatesPage() {
  return (
    <Suspense fallback={<EmployerTablePageSkeleton kpiCount={4} />}>
      <SavedCandidatesPageContent />
    </Suspense>
  );
}
