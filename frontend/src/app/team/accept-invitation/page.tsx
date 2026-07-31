import { AcceptInvitationPageClient } from "@/components/team-invitation/AcceptInvitationPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accept Team Invitation | AsliJobs",
  description: "Activate your AsliJobs team member account and create a password.",
};

export default function AcceptTeamInvitationPage() {
  return <AcceptInvitationPageClient />;
}
