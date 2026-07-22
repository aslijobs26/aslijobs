import {
  createEmployerModuleMetadata,
  EmployerModulePage,
} from "@/components/employer-dashboard/EmployerModulePage";

export const metadata = createEmployerModuleMetadata({
  title: "Subscription",
  description: "Manage your AsliJobs employer subscription",
});

export default function EmployerSubscriptionPage() {
  return <EmployerModulePage title="Subscription" />;
}
