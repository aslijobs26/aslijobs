import { EmployerProfilePageSkeleton } from "@/components/employer-dashboard/skeletons/EmployerPageSkeletons";
import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employer Profile | AsliJobs",
  description: "Manage your employer profile on AsliJobs",
};

const EmployerProfilePageContent = dynamic(
  () =>
    import("@/components/employer-profile/EmployerProfilePageContent").then(
      (module) => module.EmployerProfilePageContent,
    ),
  {
    loading: () => <EmployerProfilePageSkeleton />,
  },
);

export default function EmployerCompanyProfilePage() {
  return <EmployerProfilePageContent />;
}
