import { Check } from "lucide-react";
import { OPERATIONS_POST_JOB_STEPS } from "../../../../constants/operations-post-job";
import type { OperationsPostJobActiveStep } from "../../../../types/operations-post-job";
import { cn } from "../../../../utils/cn";

interface OperationsPostJobStepperProps {
  activeStep: OperationsPostJobActiveStep;
  onStepChange: (step: OperationsPostJobActiveStep) => void;
}

export function OperationsPostJobStepper({
  activeStep,
  onStepChange,
}: OperationsPostJobStepperProps) {
  return (
    <nav
      aria-label="Job posting steps"
      className="rounded-xl border border-border-subtle bg-surface px-3 py-3 sm:px-4"
    >
      <ol className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
        {OPERATIONS_POST_JOB_STEPS.map((step, index) => {
          const isActive = activeStep === step.step;
          const isComplete = activeStep > step.step;

          return (
            <li
              key={step.step}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 sm:gap-0",
                index < OPERATIONS_POST_JOB_STEPS.length - 1 && "sm:flex-1",
              )}
            >
              <button
                type="button"
                onClick={() => onStepChange(step.step)}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:px-2",
                  isActive && "bg-primary-light/60",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    isComplete
                      ? "bg-primary-soft text-surface"
                      : isActive
                        ? "bg-primary-soft text-surface"
                        : "bg-hero-bg text-muted ring-1 ring-border-subtle",
                  )}
                  aria-hidden="true"
                >
                  {isComplete ? (
                    <Check className="size-3.5" strokeWidth={2.5} />
                  ) : (
                    step.step
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-[11px] font-semibold sm:text-xs",
                      isActive ? "text-primary" : "text-foreground",
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="hidden text-[10px] text-muted sm:block">
                    Step {step.step} of {OPERATIONS_POST_JOB_STEPS.length}
                  </span>
                </span>
              </button>
              {index < OPERATIONS_POST_JOB_STEPS.length - 1 ? (
                <div
                  className="mx-2 hidden h-px min-w-6 flex-1 bg-border-subtle sm:block"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
