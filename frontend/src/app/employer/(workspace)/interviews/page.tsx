import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import { EmployerSplitPanelPageSkeleton } from "@/components/employer-dashboard/skeletons/EmployerPageSkeletons";
import dynamic from "next/dynamic";
import { Suspense } from "react";

export const metadata = createEmployerModuleMetadata({
  title: "Interviews",
  description: "Schedule, manage and track all interviews in one place",
});

const EmployerInterviewsPageContent = dynamic(
  () =>
    import("@/components/employer-interviews/EmployerInterviewsPageContent").then(
      (module) => module.EmployerInterviewsPageContent,
    ),
  {
    loading: () => <EmployerSplitPanelPageSkeleton />,
  },
);

export default function EmployerInterviewsPage() {
  return (
    <Suspense fallback={<EmployerSplitPanelPageSkeleton />}>
      <EmployerInterviewsPageContent />
    </Suspense>
  );
}
