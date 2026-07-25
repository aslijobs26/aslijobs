import type { Metadata } from "next";
import { NotificationsPageContent } from "@/components/notifications/NotificationsPageContent";

export const metadata: Metadata = {
  title: "Notifications | Employer | AsliJobs",
  description: "Track new applications and candidate updates on AsliJobs.",
};

export default function EmployerNotificationsPage() {
  return <NotificationsPageContent title="Notifications" />;
}
