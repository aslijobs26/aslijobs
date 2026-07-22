import {
  createEmployerModuleMetadata,
  EmployerModulePage,
} from "@/components/employer-dashboard/EmployerModulePage";

export const metadata = createEmployerModuleMetadata({
  title: "Campaigns",
  description: "Manage hiring campaigns on AsliJobs",
});

export default function EmployerCampaignsPage() {
  return <EmployerModulePage title="Campaigns" />;
}
