"use client";

import { EmployerAuthGuard } from "@/components/employer-dashboard/EmployerAuthGuard";
import { EmployerWorkspaceShellSkeleton } from "@/components/employer-dashboard/skeletons/EmployerPageSkeletons";
import { EmployerVerificationUnderReviewModal } from "@/components/post-job/EmployerVerificationUnderReviewModal";
import { PostJobContent } from "@/components/post-job/PostJobContent";
import { PostJobHeader } from "@/components/post-job/PostJobHeader";
import { ROUTES } from "@/constants/routes";
import { useEmployerProfile } from "@/hooks/useEmployerProfile";
import { resolveEmployerJobPostingAccess } from "@/utils/employer-job-posting-access";
import {
  isEmployerAccountPostJobLink,
  resolvePostJobDraftId,
} from "@/utils/post-job-route";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

type PostJobPageClientProps = {
  draftJobId?: string;
};

function PostJobAccessGate({ draftJobId }: PostJobPageClientProps) {
  const router = useRouter();
  const { data: employer } = useEmployerProfile();

  const leaveToDashboard = useCallback(() => {
    router.replace(ROUTES.EMPLOYER_DASHBOARD);
  }, [router]);

  const opensNewJobForm = isEmployerAccountPostJobLink(
    draftJobId,
    employer?.id,
  );
  const jobDraftId = employer
    ? resolvePostJobDraftId(draftJobId, employer.id)
    : undefined;
  const canonicalDraftPath =
    jobDraftId && /^[a-f0-9]{24}$/i.test(jobDraftId)
      ? ROUTES.postJobEdit(jobDraftId)
      : null;

  useEffect(() => {
    if (!opensNewJobForm) {
      return;
    }
    router.replace(ROUTES.POST_JOB);
  }, [opensNewJobForm, router]);

  useEffect(() => {
    if (!canonicalDraftPath || draftJobId?.trim() === jobDraftId) {
      return;
    }
    router.replace(canonicalDraftPath);
  }, [canonicalDraftPath, draftJobId, jobDraftId, router]);

  if (!employer || opensNewJobForm) {
    return <EmployerWorkspaceShellSkeleton />;
  }

  const isUnderReview =
    resolveEmployerJobPostingAccess(employer.verificationStatus) ===
    "under_review";
  return (
    <main className="flex min-h-dvh flex-col bg-hero-bg">
      <PostJobHeader />
      {isUnderReview ? (
        <EmployerVerificationUnderReviewModal onClose={leaveToDashboard} />
      ) : (
        <PostJobContent draftJobId={jobDraftId} />
      )}
    </main>
  );
}

export function PostJobPageClient({ draftJobId }: PostJobPageClientProps) {
  return (
    <EmployerAuthGuard>
      <PostJobAccessGate draftJobId={draftJobId} />
    </EmployerAuthGuard>
  );
}
