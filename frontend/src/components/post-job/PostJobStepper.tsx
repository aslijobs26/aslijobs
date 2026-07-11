"use client";

import { POST_JOB_STEPS } from "@/constants/post-job";
import type { PostJobActiveStep, PostJobStep, PostJobStepIcon } from "@/types/post-job";
import { cn } from "@/utils/cn";
import { Check, FileText, MapPin, UserRound } from "lucide-react";
import {
  postJobStepItemSpacingClassName,
  postJobStepperClassName,
  postJobStepperListClassName,
  postJobStepTopSurfaceClassName,
} from "./post-job-form-styles";

const STEP_ICON_GLYPH = "size-4";

const TOP_STEP_SURFACE_CLASS = "bg-post-job-step-active-surface";

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

const STEP_STATE_TRANSITION_CLASS =
  "transition-colors duration-300 ease-out motion-reduce:transition-none";

function StepIconBadge({ step, isActive, isCompleted }: StepIconBadgeProps) {
  const isFilled = isActive || isCompleted;

  return (
    <div
      className={cn(
        "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full",
        STEP_STATE_TRANSITION_CLASS,
        isFilled
          ? "bg-primary-soft text-surface"
          : "border border-primary-soft bg-surface text-primary-soft",
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          "flex items-center justify-center",
          STEP_STATE_TRANSITION_CLASS,
        )}
      >
        {isCompleted ? (
          <Check
            className={STEP_ICON_GLYPH}
            strokeWidth={2.5}
            aria-hidden="true"
          />
        ) : (
          <StepIcon icon={step.icon} />
        )}
      </span>
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
    <li className={cn("relative list-none", !isLast && postJobStepItemSpacingClassName)}>
      <button
        type="button"
        onClick={() => onSelect(step.stepNumber as PostJobActiveStep)}
        aria-current={isActive ? "step" : undefined}
        className={cn(
          "relative z-10 flex w-full gap-2.5 rounded-xl px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          STEP_STATE_TRANSITION_CLASS,
        )}
      >
        <div className="relative flex w-8 shrink-0 justify-center">
          {!isLast ? (
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-8 left-1/2 h-[calc(100%+1rem)] w-0.5 -translate-x-1/2",
                STEP_STATE_TRANSITION_CLASS,
                isCompleted ? "bg-primary-soft" : "bg-border",
              )}
            />
          ) : null}
          <StepIconBadge
            step={step}
            isActive={isActive}
            isCompleted={isCompleted}
          />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            STEP {step.stepNumber}
          </p>
          <p
            className={cn(
              "mt-0.5 text-sm font-bold leading-tight",
              STEP_STATE_TRANSITION_CLASS,
              isActive ? "text-foreground" : "text-foreground/90",
            )}
          >
            {step.title}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-muted">
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
    <aside
      aria-label="Post job progress"
      className={postJobStepperClassName}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-0 rounded-t-2xl",
          TOP_STEP_SURFACE_CLASS,
          postJobStepTopSurfaceClassName,
          "[mask-image:linear-gradient(to_bottom,black_80%,transparent)]",
        )}
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
    </aside>
  );
}
