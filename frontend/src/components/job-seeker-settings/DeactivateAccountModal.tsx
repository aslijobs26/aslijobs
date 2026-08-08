"use client";

import { JobSeekerProfileDialog } from "@/components/job-seeker-profile/JobSeekerProfileDialog";
import { showAppToast } from "@/utils/share-job";
import { useState } from "react";

type DeactivateAccountModalProps = {
  onClose: () => void;
};

export function DeactivateAccountModal({ onClose }: DeactivateAccountModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = () => {
    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      onClose();
      showAppToast(
        "Account deactivation is not available in the API yet. Contact support if you need help.",
        "error",
      );
    }, 400);
  };

  return (
    <JobSeekerProfileDialog
      onClose={onClose}
      title="Deactivate your account?"
      description="Are you sure you want to deactivate your job seeker account?"
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted">
          Deactivating pauses your visibility to employers. Your applications,
          saved jobs, resume, and profile data are retained according to AsliJobs
          policies. This does not permanently delete your account until a
          dedicated deletion workflow is available.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-pin-state/40 bg-benefit-ai-matching-surface px-4 text-sm font-semibold text-pin-state transition-colors hover:bg-benefit-ai-matching-surface/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30 disabled:opacity-60"
          >
            {isSubmitting ? "Please wait…" : "Deactivate Account"}
          </button>
        </div>
      </div>
    </JobSeekerProfileDialog>
  );
}
