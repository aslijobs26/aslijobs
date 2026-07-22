import {
  createEmployerModuleMetadata,
  EmployerModulePage,
} from "@/components/employer-dashboard/EmployerModulePage";

export const metadata = createEmployerModuleMetadata({
  title: "Reports",
  description: "Employer reports on AsliJobs",
});

export default function EmployerReportsPage() {
  return <EmployerModulePage title="Reports" />;
}
