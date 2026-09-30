import { EmployerDashboardPlaceholder } from "@/components/employer-dashboard/EmployerDashboardPlaceholder";
import type { MessageKey } from "@/i18n/translate";
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

export function EmployerModulePage({ titleKey }: { titleKey: MessageKey }) {
  return <EmployerDashboardPlaceholder titleKey={titleKey} />;
}
