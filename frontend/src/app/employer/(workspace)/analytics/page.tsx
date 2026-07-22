import {
  createEmployerModuleMetadata,
  EmployerModulePage,
} from "@/components/employer-dashboard/EmployerModulePage";

export const metadata = createEmployerModuleMetadata({
  title: "Analytics",
  description: "Employer hiring analytics on AsliJobs",
});

export default function EmployerAnalyticsPage() {
  return <EmployerModulePage title="Analytics" />;
}
