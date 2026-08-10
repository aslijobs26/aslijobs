import type { Metadata } from "next";
import { Suspense } from "react";
import { JobSeekerNotificationsPageContent } from "@/components/job-seeker-notifications/JobSeekerNotificationsPageContent";

export const metadata: Metadata = {
  title: "Notifications | AsliJobs",
  description: "Track application, interview, and offer updates on AsliJobs.",
};

function NotificationsPageFallback() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-primary-light/50" />
        <div className="h-4 w-72 max-w-full rounded bg-primary-light/30" />
        <div className="mt-4 h-11 w-full rounded-xl bg-primary-light/25" />
        <div className="mt-3 flex gap-2">
          <div className="h-9 w-16 rounded-full bg-primary-light/30" />
          <div className="h-9 w-20 rounded-full bg-primary-light/20" />
          <div className="h-9 w-16 rounded-full bg-primary-light/20" />
        </div>
        <div className="mt-6 h-28 rounded-2xl bg-primary-light/20" />
        <div className="h-28 rounded-2xl bg-primary-light/15" />
      </div>
    </div>
  );
}

export default function JobSeekerNotificationsPage() {
  return (
    <Suspense fallback={<NotificationsPageFallback />}>
      <JobSeekerNotificationsPageContent />
    </Suspense>
  );
}
