import { EmployerProfilePageContent } from "@/components/employer-profile/EmployerProfilePageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Profile | AsliJobs",
  description: "Manage your employer profile on AsliJobs",
};

export default function EmployerCompanyProfilePage() {
  return <EmployerProfilePageContent />;
}
