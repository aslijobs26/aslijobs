import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import { EmployerMessagesPageSkeleton } from "@/components/employer-dashboard/skeletons/EmployerPageSkeletons";
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
    loading: () => <EmployerMessagesPageSkeleton />,
  },
);

export default function EmployerMessagesPage() {
  return (
    <Suspense fallback={<EmployerMessagesPageSkeleton />}>
      <EmployerMessagesPageContent />
    </Suspense>
  );
}
