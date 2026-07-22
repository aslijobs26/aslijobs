import {
  createEmployerModuleMetadata,
  EmployerModulePage,
} from "@/components/employer-dashboard/EmployerModulePage";

export const metadata = createEmployerModuleMetadata({
  title: "Saved Candidates",
  description: "View your saved candidates on AsliJobs",
});

export default function EmployerSavedCandidatesPage() {
  return <EmployerModulePage title="Saved Candidates" />;
}
