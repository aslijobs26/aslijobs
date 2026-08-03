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
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center px-6">
        <p className="text-sm text-muted">Loading profile…</p>
      </div>
    ),
  },
);

export default function EmployerCompanyProfilePage() {
  return <EmployerProfilePageContent />;
}
