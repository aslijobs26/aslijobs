import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import { EmployerSettingsPageSkeleton } from "@/components/employer-dashboard/skeletons/EmployerPageSkeletons";
import { EmployerSettingsPageContent } from "@/components/employer-settings/EmployerSettingsPageContent";
import { Suspense } from "react";

export const metadata = createEmployerModuleMetadata({
  title: "Settings",
  description: "Manage your AsliJobs employer account settings",
});

export default function EmployerSettingsPage() {
  return (
    <Suspense fallback={<EmployerSettingsPageSkeleton />}>
      <EmployerSettingsPageContent />
    </Suspense>
  );
}
