import { EmployerCandidateDetailPageContent } from "@/components/employer-candidates/EmployerCandidateDetailPageContent";
import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";

type EmployerCandidateDetailPageProps = {
  params: Promise<{ applicationId: string }>;
};

export const metadata = createEmployerModuleMetadata({
  title: "Candidate Profile",
  description: "View candidate profile and submitted ATS resume snapshot",
});

export default async function EmployerCandidateDetailPage({
  params,
}: EmployerCandidateDetailPageProps) {
  const { applicationId } = await params;

  return <EmployerCandidateDetailPageContent applicationId={applicationId} />;
}
