import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import dynamic from "next/dynamic";
import { Suspense } from "react";

export const metadata = createEmployerModuleMetadata({
  title: "Messages",
  description:
    "Review candidate application activity and hiring notifications in one place",
});

const EmployerMessagesPageContent = dynamic(
  () =>
    import("@/components/employer-messages/EmployerMessagesPageContent").then(
      (module) => module.EmployerMessagesPageContent,
    ),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center px-6">
        <p className="text-sm text-muted">Loading messages…</p>
      </div>
    ),
  },
);

export default function EmployerMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center px-6">
          <p className="text-sm text-muted">Loading messages…</p>
        </div>
      }
    >
      <EmployerMessagesPageContent />
    </Suspense>
  );
}
