"use client";

import {
  JOB_POSTED_SUCCESS_NEXT_HEADING,
  JOB_POSTED_SUCCESS_NEXT_STEPS,
  JOB_POSTED_SUCCESS_NEXT_STEP_TONE_CLASS,
} from "@/constants/job-posted-success";
import { cn } from "@/utils/cn";

export function JobPostedSuccessNextSteps() {
  return (
    <section
      className="job-posted-success-fade-up job-posted-success-fade-up-delay-3"
      aria-labelledby="job-posted-next-heading"
    >
      <h2
        id="job-posted-next-heading"
        className="text-lg font-bold text-foreground sm:text-xl"
      >
        {JOB_POSTED_SUCCESS_NEXT_HEADING}
      </h2>

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {JOB_POSTED_SUCCESS_NEXT_STEPS.map((step) => {
          const Icon = step.icon;
          const tone = JOB_POSTED_SUCCESS_NEXT_STEP_TONE_CLASS[step.tone];

          return (
            <li key={step.id}>
              <article className="flex h-full flex-col rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-5">
                <span
                  className={cn(
                    "mb-3 inline-flex size-10 items-center justify-center rounded-full sm:mb-4 sm:size-11",
                    tone.surface,
                    tone.icon,
                  )}
                >
                  <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
                </span>
                <h3 className="text-sm font-bold text-foreground sm:text-base">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted sm:mt-2 sm:text-sm">
                  {step.description}
                </p>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
