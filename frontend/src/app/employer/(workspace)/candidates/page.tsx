import {
  createEmployerModuleMetadata,
  EmployerModulePage,
} from "@/components/employer-dashboard/EmployerModulePage";

export const metadata = createEmployerModuleMetadata({
  title: "Candidates",
  description: "Review candidates for your job openings",
});

export default function EmployerCandidatesPage() {
  return <EmployerModulePage title="Candidates" />;
}
