import {
  createEmployerModuleMetadata,
  EmployerModulePage,
} from "@/components/employer-dashboard/EmployerModulePage";

export const metadata = createEmployerModuleMetadata({
  title: "Messages",
  description: "Employer messaging inbox on AsliJobs",
});

export default function EmployerMessagesPage() {
  return <EmployerModulePage title="Messages" />;
}
