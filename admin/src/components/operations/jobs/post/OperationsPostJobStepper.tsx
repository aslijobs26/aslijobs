import { Check, FileText, MapPin, UserRound } from "lucide-react";
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
  const stepDescriptions = {
    1: "Add the basic details about the job.",
    2: "Add the job location and Salary details.",
    3: "Add candidate requirements and Interview details.",
  } as const;

  return (
    <nav
      aria-label="Job posting steps"
      className="relative w-full shrink-0 overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-full [background-image:linear-gradient(to_right,var(--color-border-subtle)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border-subtle)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-primary-soft)_18%,transparent)_0%,color-mix(in_srgb,var(--color-surface)_96%,transparent)_100%)] [background-size:12px_12px,12px_12px,auto] [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
      />
      <ol className="relative z-10 flex flex-col gap-5 px-4 py-4 sm:flex-row sm:items-start sm:gap-0 sm:px-5 sm:py-5 lg:px-6">
        {OPERATIONS_POST_JOB_STEPS.map((step, index) => {
          const isActive = activeStep === step.step;
          const isComplete = activeStep > step.step;

          return (
            <li
              key={step.step}
              className={cn(
                "relative flex min-w-0 flex-1 list-none",
                index !== OPERATIONS_POST_JOB_STEPS.length - 1 && "pr-3 sm:pr-5 lg:pr-8",
              )}
            >
              {index !== OPERATIONS_POST_JOB_STEPS.length - 1 ? (
                <>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute top-9 bottom-[-1.25rem] left-[1.125rem] w-0.5 sm:hidden",
                      isComplete ? "bg-primary-soft" : "bg-border",
                    )}
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute top-[1.125rem] right-0 left-[calc(2.25rem+0.65rem)] hidden h-px sm:top-5 sm:left-[calc(2.5rem+0.75rem)] md:block",
                      isComplete ? "bg-primary-soft" : "bg-border",
                    )}
                  />
                </>
              ) : null}
              <button
                type="button"
                onClick={() => onStepChange(step.step)}
                className={cn(
                  "relative z-10 flex w-full min-w-0 items-start gap-2.5 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:gap-3",
                )}
              >
                <span
                  className={cn(
                    "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full sm:size-10",
                    isActive || isComplete
                      ? "bg-primary-soft text-surface"
                      : "border-[1.5px] border-primary-soft/70 bg-surface text-primary-soft",
                  )}
                  aria-hidden="true"
                >
                  {isComplete ? (
                    <Check className="size-4 sm:size-[1.125rem]" strokeWidth={2.5} />
                  ) : (
                    <>
                      {step.step === 1 ? (
                        <FileText className="size-4 sm:size-[1.125rem]" strokeWidth={2} />
                      ) : null}
                      {step.step === 2 ? (
                        <MapPin className="size-4 sm:size-[1.125rem]" strokeWidth={2} />
                      ) : null}
                      {step.step === 3 ? (
                        <UserRound className="size-4 sm:size-[1.125rem]" strokeWidth={2} />
                      ) : null}
                    </>
                  )}
                </span>
                <span className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.06em] text-muted sm:text-xs">
                    STEP {step.step}
                  </p>
                  <span
                    className={cn(
                      "mt-0.5 block text-sm font-bold leading-tight text-foreground sm:text-[0.9375rem]",
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="mt-0.5 hidden text-xs leading-snug text-muted sm:block">
                    {stepDescriptions[step.step]}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
