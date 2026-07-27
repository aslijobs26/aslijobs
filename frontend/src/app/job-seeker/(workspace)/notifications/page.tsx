import type { Metadata } from "next";
import { NotificationsPageContent } from "@/components/notifications/NotificationsPageContent";

export const metadata: Metadata = {
  title: "Notifications | AsliJobs",
  description: "Track application, interview, and offer updates on AsliJobs.",
};

export default function JobSeekerNotificationsPage() {
  return <NotificationsPageContent />;
}
