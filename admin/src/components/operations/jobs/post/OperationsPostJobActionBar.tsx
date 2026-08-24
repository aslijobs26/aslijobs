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
  const secondaryButtonClassName =
    "inline-flex h-11 items-center justify-center rounded-md border border-primary-soft bg-surface px-6 text-sm font-bold text-primary-soft transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:min-w-[120px]";
  const primaryButtonClassName =
    "inline-flex h-11 items-center justify-center rounded-md bg-primary-soft px-8 text-sm font-bold text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:bg-primary-soft-hover disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:min-w-[148px]";

  return (
    <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end sm:pt-4">
      <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:justify-end">
        <Link
          to={OPERATIONS_ROUTES.JOBS}
          className={cn(secondaryButtonClassName, "w-full border-border text-foreground sm:w-auto")}
        >
          Cancel
        </Link>

        <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isSubmitting || activeStep === 1}
            onClick={onBack}
            className={cn(
              secondaryButtonClassName,
              "w-full border-border text-foreground sm:w-auto",
            )}
          >
            Back
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onSaveDraft}
            className={cn(
              secondaryButtonClassName,
              "w-full gap-2 border-border px-5 text-foreground sm:w-auto sm:min-w-[148px]",
            )}
          >
            {isSavingDraft ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            Save Draft
          </button>
          {!isLastStep ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onContinue}
              className={cn(primaryButtonClassName, "w-full gap-2 sm:w-auto sm:min-w-[156px]")}
            >
              Continue
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting || !publishReady}
              onClick={onPublish}
              className={cn(
                primaryButtonClassName,
                "w-full gap-2 sm:w-auto sm:min-w-[156px]",
                publishReady
                  ? ""
                  : "bg-muted/40 text-muted hover:bg-muted/40",
              )}
            >
              {isPublishing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Publish Job
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
