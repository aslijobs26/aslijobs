import { DepartmentDetailsPageContent } from "@/components/employer-team-management/DepartmentDetailsPageContent";
import type { Metadata } from "next";

type DepartmentDetailsPageProps = {
  params: Promise<{ departmentId: string }>;
};

export const metadata: Metadata = {
  title: "Department Details | AsliJobs",
  description: "View department details on AsliJobs Team Management",
};

export default async function EmployerTeamDepartmentDetailsPage({
  params,
}: DepartmentDetailsPageProps) {
  const { departmentId } = await params;
  return <DepartmentDetailsPageContent departmentId={departmentId} />;
}
