import { TeamMemberMyProfilePageContent } from "@/components/employer-team-management/TeamMemberMyProfilePageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile | AsliJobs",
  description: "View your team member profile on AsliJobs",
};

export default function EmployerTeamMemberMyProfilePage() {
  return <TeamMemberMyProfilePageContent />;
}
