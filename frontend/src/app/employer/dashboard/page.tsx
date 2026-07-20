import { EmployerDashboardLayout } from "@/components/employer-dashboard/EmployerDashboardLayout";
import { EmployerDashboardPlaceholder } from "@/components/employer-dashboard/EmployerDashboardPlaceholder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employer Dashboard | AsliJobs",
  description: "AsliJobs employer dashboard",
};

export default function EmployerDashboardPage() {
  return (
    <EmployerDashboardLayout>
      <EmployerDashboardPlaceholder />
    </EmployerDashboardLayout>
  );
}
