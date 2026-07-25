import type { Metadata } from "next";
import { JobSeekerAuthGuard } from "@/components/job-seeker/JobSeekerAuthGuard";
import { NotificationsPageContent } from "@/components/notifications/NotificationsPageContent";

export const metadata: Metadata = {
  title: "Notifications | AsliJobs",
  description: "Track application, interview, and offer updates on AsliJobs.",
};

export default function JobSeekerNotificationsPage() {
  return (
    <JobSeekerAuthGuard>
      <main className="min-h-dvh bg-hero-bg">
        <NotificationsPageContent />
      </main>
    </JobSeekerAuthGuard>
  );
}
