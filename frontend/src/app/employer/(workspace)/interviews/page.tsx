import {
  createEmployerModuleMetadata,
  EmployerModulePage,
} from "@/components/employer-dashboard/EmployerModulePage";

export const metadata = createEmployerModuleMetadata({
  title: "Interviews",
  description: "Schedule and manage candidate interviews",
});

export default function EmployerInterviewsPage() {
  return <EmployerModulePage title="Interviews" />;
}
