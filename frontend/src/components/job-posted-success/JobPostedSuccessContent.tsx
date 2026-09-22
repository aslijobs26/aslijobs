"use client";

import { EmployerAuthGuard } from "@/components/employer-dashboard/EmployerAuthGuard";
import { ROUTES } from "@/constants/routes";
import { getJobPostedSuccessSummary } from "@/utils/job-posted-success-storage";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Legacy `/post-job/success` route.
 * New submissions navigate to `/employer/jobs/:jobId/under-review`.
 * Keep this page as a bridge for older bookmarks / session summaries.
 */
function JobPostedSuccessRedirectBody() {
  const router = useRouter();

  useEffect(() => {
    const stored = getJobPostedSuccessSummary();
    const jobId = stored?.jobMongoId?.trim() ?? "";

    if (jobId) {
      router.replace(ROUTES.employerJobUnderReview(jobId));
      return;
    }

    router.replace(ROUTES.EMPLOYER_JOBS);
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-hero-bg px-6">
      <p className="text-sm text-muted">Loading…</p>
    </div>
  );
}

export function JobPostedSuccessContent() {
  return (
    <EmployerAuthGuard>
      <JobPostedSuccessRedirectBody />
    </EmployerAuthGuard>
  );
}
