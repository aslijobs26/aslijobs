import type { Metadata } from "next";
import { DashboardHomeContent } from "@/components/job-seeker-dashboard/DashboardHomeContent";

export const metadata: Metadata = {
  title: "Job Seeker Dashboard | AsliJobs",
  description:
    "Your AsliJobs job seeker dashboard — applications, resume, notifications, and profile.",
};

export default function JobSeekerDashboardPage() {
  return <DashboardHomeContent />;
}
