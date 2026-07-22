import {
  createEmployerModuleMetadata,
  EmployerModulePage,
} from "@/components/employer-dashboard/EmployerModulePage";
import { EMPLOYER_DASHBOARD_HELP_CENTER_TITLE } from "@/constants/employer-dashboard";

export const metadata = createEmployerModuleMetadata({
  title: EMPLOYER_DASHBOARD_HELP_CENTER_TITLE,
  description: "AsliJobs employer help center",
});

export default function EmployerHelpCenterPage() {
  return <EmployerModulePage title={EMPLOYER_DASHBOARD_HELP_CENTER_TITLE} />;
}
