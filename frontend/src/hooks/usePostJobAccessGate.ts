"use client";

import { useEmployerProfile } from "@/hooks/useEmployerProfile";
import { resolveEmployerJobPostingAccess } from "@/utils/employer-job-posting-access";
import { useCallback, useState, type MouseEvent } from "react";

function isPlainLeftClick(event: MouseEvent<HTMLElement>): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export type PostJobAccessGate = {
  isUnderReview: boolean;
  isUnderReviewModalOpen: boolean;
  openUnderReviewModal: () => void;
  closeUnderReviewModal: () => void;
  /** Attach to Post Job links: opens the under-review modal instead of navigating. */
  handlePostJobClick: (event: MouseEvent<HTMLElement>) => void;
};

/**
 * Intercepts Post Job entry points for signed-in employers whose account is
 * still under review. Non-employer sessions resolve no profile and pass through.
 * Modified clicks (new tab) still navigate; the Post Job page guard covers them.
 */
export function usePostJobAccessGate(): PostJobAccessGate {
  const { data: employer } = useEmployerProfile();
  const [isUnderReviewModalOpen, setIsUnderReviewModalOpen] = useState(false);

  const isUnderReview =
    employer !== undefined &&
    resolveEmployerJobPostingAccess(employer.verificationStatus) ===
      "under_review";

  const openUnderReviewModal = useCallback(() => {
    setIsUnderReviewModalOpen(true);
  }, []);

  const closeUnderReviewModal = useCallback(() => {
    setIsUnderReviewModalOpen(false);
  }, []);

  const handlePostJobClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!isUnderReview || !isPlainLeftClick(event)) {
        return;
      }

      event.preventDefault();
      setIsUnderReviewModalOpen(true);
    },
    [isUnderReview],
  );

  return {
    isUnderReview,
    isUnderReviewModalOpen,
    openUnderReviewModal,
    closeUnderReviewModal,
    handlePostJobClick,
  };
}
