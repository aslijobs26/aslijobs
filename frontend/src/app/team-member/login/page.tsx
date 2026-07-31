import { TeamMemberLoginPageClient } from "@/components/team-member-auth/TeamMemberLoginPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Member Login | AsliJobs",
  description: "Sign in to your AsliJobs team member account.",
};

export default function TeamMemberLoginPage() {
  return <TeamMemberLoginPageClient />;
}
