import { EmployerDashboardPlaceholder } from "@/components/employer-dashboard/EmployerDashboardPlaceholder";
import type { Metadata } from "next";

type EmployerModulePageConfig = {
  title: string;
  description: string;
};

export function createEmployerModuleMetadata({
  title,
  description,
}: EmployerModulePageConfig): Metadata {
  return {
    title: `${title} | AsliJobs`,
    description,
  };
}

export function EmployerModulePage({ title }: { title: string }) {
  return <EmployerDashboardPlaceholder title={title} />;
}
