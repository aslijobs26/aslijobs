import {
  createEmployerModuleMetadata,
  EmployerModulePage,
} from "@/components/employer-dashboard/EmployerModulePage";

export const metadata = createEmployerModuleMetadata({
  title: "Team Management",
  description: "Manage your hiring team on AsliJobs",
});

export default function EmployerTeamManagementPage() {
  return <EmployerModulePage title="Team Management" />;
}
