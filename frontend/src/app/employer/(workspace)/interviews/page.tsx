import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
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
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center px-6">
        <p className="text-sm text-muted">Loading interviews…</p>
      </div>
    ),
  },
);

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
