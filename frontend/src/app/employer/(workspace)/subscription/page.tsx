import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import { EmployerSubscriptionPageContent } from "@/components/employer-subscription/EmployerSubscriptionPageContent";

export const metadata = createEmployerModuleMetadata({
  title: "Subscription",
  description: "Manage your AsliJobs employer subscription",
});

export default function EmployerSubscriptionPage() {
  return <EmployerSubscriptionPageContent />;
}
