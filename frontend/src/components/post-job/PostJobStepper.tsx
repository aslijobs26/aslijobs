"use client";

import { POST_JOB_STEPS } from "@/constants/post-job";
import type {
  PostJobActiveStep,
  PostJobStep,
  PostJobStepIcon,
} from "@/types/post-job";
import { cn } from "@/utils/cn";
import { Check, FileText, MapPin, UserRound } from "lucide-react";
import {
  postJobStepperClassName,
  postJobStepperListClassName,
} from "./post-job-form-styles";

const STEP_ICON_GLYPH = "size-4 sm:size-[1.125rem]";

const STEP_STATE_TRANSITION_CLASS =
  "transition-colors duration-300 ease-out motion-reduce:transition-none";

function StepIcon({ icon }: { icon: PostJobStepIcon }) {
  switch (icon) {
    case "job-information":
      return (
        <FileText
          className={STEP_ICON_GLYPH}
          strokeWidth={2}
          aria-hidden="true"
        />
      );
    case "location":
      return (
        <MapPin className={STEP_ICON_GLYPH} strokeWidth={2} aria-hidden="true" />
      );
    case "candidate":
      return (
        <UserRound
          className={STEP_ICON_GLYPH}
          strokeWidth={2}
          aria-hidden="true"
        />
      );
    default:
      return null;
  }
}

type StepIconBadgeProps = {
  step: PostJobStep;
  isActive: boolean;
  isCompleted: boolean;
};

function StepIconBadge({ step, isActive, isCompleted }: StepIconBadgeProps) {
  const isFilled = isActive || isCompleted;

  return (
    <div
      className={cn(
        "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full sm:size-10",
        STEP_STATE_TRANSITION_CLASS,
        isFilled
          ? "bg-primary-soft text-surface"
          : "border-[1.5px] border-primary-soft bg-surface text-primary-soft",
      )}
      aria-hidden="true"
    >
      {isCompleted && !isActive ? (
        <Check className={STEP_ICON_GLYPH} strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <StepIcon icon={step.icon} />
      )}
    </div>
  );
}

type StepItemProps = {
  step: PostJobStep;
  isActive: boolean;
  isCompleted: boolean;
  isLast: boolean;
  onSelect: (step: PostJobActiveStep) => void;
};

function StepItem({
  step,
  isActive,
  isCompleted,
  isLast,
  onSelect,
}: StepItemProps) {
  return (
    <li
      className={cn(
        "relative flex min-w-0 flex-1 list-none",
        !isLast && "pr-3 sm:pr-5 lg:pr-8",
      )}
    >
      {!isLast ? (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-9 bottom-[-1.25rem] left-[1.125rem] w-0.5 sm:hidden",
              STEP_STATE_TRANSITION_CLASS,
              isCompleted ? "bg-primary-soft" : "bg-border",
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-[1.125rem] right-0 left-[calc(2.25rem+0.65rem)] hidden h-px sm:top-5 sm:left-[calc(2.5rem+0.75rem)] md:block",
              STEP_STATE_TRANSITION_CLASS,
              isCompleted ? "bg-primary-soft" : "bg-border",
            )}
          />
        </>
      ) : null}

      <button
        type="button"
        onClick={() => onSelect(step.stepNumber as PostJobActiveStep)}
        aria-current={isActive ? "step" : undefined}
        className={cn(
          "relative z-10 flex w-full min-w-0 items-start gap-2.5 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:gap-3",
          STEP_STATE_TRANSITION_CLASS,
        )}
      >
        <StepIconBadge
          step={step}
          isActive={isActive}
          isCompleted={isCompleted}
        />

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.06em] text-muted sm:text-xs">
            STEP {step.stepNumber}
          </p>
          <p
            className={cn(
              "mt-0.5 text-sm font-bold leading-tight sm:text-[0.9375rem]",
              STEP_STATE_TRANSITION_CLASS,
              isActive ? "text-foreground" : "text-foreground/90",
            )}
          >
            {step.title}
          </p>
          <p className="mt-0.5 hidden text-xs leading-snug text-muted sm:block">
            {step.description}
          </p>
        </div>
      </button>
    </li>
  );
}

type PostJobStepperProps = {
  activeStep: PostJobActiveStep;
  onStepChange: (step: PostJobActiveStep) => void;
};

export function PostJobStepper({
  activeStep,
  onStepChange,
}: PostJobStepperProps) {
  return (
    <nav
      aria-label="Post job progress"
      className={postJobStepperClassName}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-full bg-post-job-step-active-surface [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
      />
      <ol className={postJobStepperListClassName}>
        {POST_JOB_STEPS.map((step, index) => (
          <StepItem
            key={step.id}
            step={step}
            isActive={step.stepNumber === activeStep}
            isCompleted={step.stepNumber < activeStep}
            isLast={index === POST_JOB_STEPS.length - 1}
            onSelect={onStepChange}
          />
        ))}
      </ol>
    </nav>
  );
}
