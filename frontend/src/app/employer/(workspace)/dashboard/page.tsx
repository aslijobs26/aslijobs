import { EmployerDashboardHome } from "@/components/employer-dashboard/EmployerDashboardHome";
import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";

export const metadata = createEmployerModuleMetadata({
  title: "Dashboard",
  description: "AsliJobs employer dashboard overview",
});

export default function EmployerDashboardPage() {
  return <EmployerDashboardHome />;
}
