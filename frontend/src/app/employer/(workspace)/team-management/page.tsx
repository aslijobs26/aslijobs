import { TeamManagementPageContent } from "@/components/employer-team-management/TeamManagementPageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Management | AsliJobs",
  description: "Manage your hiring team organization on AsliJobs",
};

export default function EmployerTeamManagementPage() {
  return <TeamManagementPageContent />;
}
