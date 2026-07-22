"use client";

import { EmployerAuthGuard } from "@/components/employer-dashboard/EmployerAuthGuard";
import { JobPostedSuccessActions } from "@/components/job-posted-success/JobPostedSuccessActions";
import { JobPostedSuccessHero } from "@/components/job-posted-success/JobPostedSuccessHero";
import { JobPostedSuccessNextSteps } from "@/components/job-posted-success/JobPostedSuccessNextSteps";
import { JobPostedSuccessSummaryCard } from "@/components/job-posted-success/JobPostedSuccessSummaryCard";
import { JobPostedSuccessSupport } from "@/components/job-posted-success/JobPostedSuccessSupport";
import { JobPostedSuccessWhatsAppBanner } from "@/components/job-posted-success/JobPostedSuccessWhatsAppBanner";
import { ROUTES } from "@/constants/routes";
import type { JobPostedSuccessSummary } from "@/types/job-posted-success";
import { getJobPostedSuccessSummary } from "@/utils/job-posted-success-storage";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function JobPostedSuccessBody() {
  const router = useRouter();
  const [summary, setSummary] = useState<JobPostedSuccessSummary | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = getJobPostedSuccessSummary();

    if (!stored) {
      router.replace(ROUTES.EMPLOYER_JOBS);
      return;
    }

    setSummary(stored);
    setReady(true);
  }, [router]);

  if (!ready || !summary) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-hero-bg px-6">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-hero-bg">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:gap-7 sm:px-6 sm:py-10 lg:gap-8 lg:px-8 lg:py-12">
        <JobPostedSuccessHero />
        <JobPostedSuccessSummaryCard summary={summary} />
        <JobPostedSuccessWhatsAppBanner />
        <JobPostedSuccessNextSteps />
        <JobPostedSuccessActions />
        <JobPostedSuccessSupport />
      </div>
    </main>
  );
}

export function JobPostedSuccessContent() {
  return (
    <EmployerAuthGuard>
      <JobPostedSuccessBody />
    </EmployerAuthGuard>
  );
}
