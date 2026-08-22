import { ArrowRight, Loader2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import type { OperationsPostJobActiveStep } from "../../../../types/operations-post-job";
import { cn } from "../../../../utils/cn";

interface OperationsPostJobActionBarProps {
  activeStep: OperationsPostJobActiveStep;
  isSubmitting: boolean;
  isSavingDraft: boolean;
  isPublishing: boolean;
  publishReady: boolean;
  onBack: () => void;
  onSaveDraft: () => void;
  onContinue: () => void;
  onPublish: () => void;
}

export function OperationsPostJobActionBar({
  activeStep,
  isSubmitting,
  isSavingDraft,
  isPublishing,
  publishReady,
  onBack,
  onSaveDraft,
  onContinue,
  onPublish,
}: OperationsPostJobActionBarProps) {
  const isLastStep = activeStep === 3;

  return (
    <div className="sticky bottom-0 z-10 -mx-2 mt-1 border-t border-border-subtle bg-surface/95 px-2 py-2.5 backdrop-blur-sm sm:-mx-3 sm:px-3 lg:-mx-3.5 lg:px-3.5">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to={OPERATIONS_ROUTES.JOBS}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Cancel
        </Link>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            disabled={isSubmitting || activeStep === 1}
            onClick={onBack}
            className="inline-flex h-9 items-center rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onSaveDraft}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSavingDraft ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-3.5" aria-hidden="true" />
            )}
            Save Draft
          </button>
          {!isLastStep ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onContinue}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary-soft px-3.5 text-xs font-semibold text-surface shadow-[0_1px_2px_rgba(0,186,165,0.35)] transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting || !publishReady}
              onClick={onPublish}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold text-surface shadow-[0_1px_2px_rgba(0,186,165,0.35)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
                publishReady
                  ? "bg-primary-soft hover:bg-primary-soft-hover"
                  : "bg-muted/40 text-muted shadow-none",
              )}
            >
              {isPublishing ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : null}
              Publish Job
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
