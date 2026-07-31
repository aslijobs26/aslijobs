import { MemberDetailsPageContent } from "@/components/employer-team-management/MemberDetailsPageContent";
import type { Metadata } from "next";

type MemberDetailsPageProps = {
  params: Promise<{ memberId: string }>;
};

export const metadata: Metadata = {
  title: "Team Member | AsliJobs",
  description: "View team member details on AsliJobs",
};

export default async function EmployerTeamMemberDetailsPage({
  params,
}: MemberDetailsPageProps) {
  const { memberId } = await params;
  return <MemberDetailsPageContent memberId={memberId} />;
}
