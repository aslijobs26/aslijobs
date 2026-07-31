import { RoleDetailsPageContent } from "@/components/employer-team-management/RoleDetailsPageContent";
import type { Metadata } from "next";

type RoleDetailsPageProps = {
  params: Promise<{ roleId: string }>;
};

export const metadata: Metadata = {
  title: "Role Details | AsliJobs",
  description: "View role details and permissions on AsliJobs Team Management",
};

export default async function EmployerTeamRoleDetailsPage({
  params,
}: RoleDetailsPageProps) {
  const { roleId } = await params;
  return <RoleDetailsPageContent roleId={roleId} />;
}
