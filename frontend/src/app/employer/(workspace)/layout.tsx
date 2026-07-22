import { EmployerDashboardLayout } from "@/components/employer-dashboard/EmployerDashboardLayout";
import type { ReactNode } from "react";

type EmployerWorkspaceLayoutProps = {
  children: ReactNode;
};

export default function EmployerWorkspaceLayout({
  children,
}: EmployerWorkspaceLayoutProps) {
  return <EmployerDashboardLayout>{children}</EmployerDashboardLayout>;
}
