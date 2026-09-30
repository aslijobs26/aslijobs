"use client";

import { useTranslate } from "@/i18n/translate";

export function EmployerJobsPageFallback() {
  const t = useTranslate();

  return (
    <div className="px-4 py-8 text-sm text-muted sm:px-6" role="status">
      {t("employer.jobs.loadingJobs")}
    </div>
  );
}
