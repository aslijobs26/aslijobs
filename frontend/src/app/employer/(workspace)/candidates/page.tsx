import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import { EmployerSplitPanelPageSkeleton } from "@/components/employer-dashboard/skeletons/EmployerPageSkeletons";
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
    loading: () => <EmployerSplitPanelPageSkeleton />,
  },
);

export default function EmployerCandidatesPage() {
  return (
    <Suspense fallback={<EmployerSplitPanelPageSkeleton />}>
      <EmployerCandidatesPageContent />
    </Suspense>
  );
}
