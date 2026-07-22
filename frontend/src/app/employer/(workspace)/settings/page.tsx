import {
  createEmployerModuleMetadata,
  EmployerModulePage,
} from "@/components/employer-dashboard/EmployerModulePage";

export const metadata = createEmployerModuleMetadata({
  title: "Settings",
  description: "Employer account settings on AsliJobs",
});

export default function EmployerSettingsPage() {
  return <EmployerModulePage title="Settings" />;
}
