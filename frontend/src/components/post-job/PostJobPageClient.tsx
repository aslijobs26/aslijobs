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

  useEffect(() => {
    if (!opensNewJobForm) {
      return;
    }
    window.history.replaceState(null, "", ROUTES.POST_JOB);
  }, [opensNewJobForm]);

  if (!employer) {
    return <EmployerWorkspaceShellSkeleton />;
  }

  const isUnderReview =
    resolveEmployerJobPostingAccess(employer.verificationStatus) ===
    "under_review";
  const jobDraftId = resolvePostJobDraftId(draftJobId, employer.id);

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
