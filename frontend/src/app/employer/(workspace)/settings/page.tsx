import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import { EmployerSettingsPageContent } from "@/components/employer-settings/EmployerSettingsPageContent";
import { Suspense } from "react";

export const metadata = createEmployerModuleMetadata({
  title: "Settings",
  description: "Manage your AsliJobs employer account settings",
});

export default function EmployerSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <p className="text-sm text-muted">Loading settings...</p>
        </div>
      }
    >
      <EmployerSettingsPageContent />
    </Suspense>
  );
}
