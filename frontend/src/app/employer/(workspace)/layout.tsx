import { AnalyticsBeacon } from "@/components/analytics/AnalyticsBeacon";
import { EmployerDashboardLayout } from "@/components/employer-dashboard/EmployerDashboardLayout";
import type { ReactNode } from "react";

type EmployerWorkspaceLayoutProps = {
  children: ReactNode;
};

export default function EmployerWorkspaceLayout({
  children,
}: EmployerWorkspaceLayoutProps) {
  return (
    <>
      <AnalyticsBeacon portal="employer" />
      <EmployerDashboardLayout>{children}</EmployerDashboardLayout>
    </>
  );
}
