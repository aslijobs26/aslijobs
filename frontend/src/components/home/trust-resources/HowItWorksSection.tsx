import {
  HOW_IT_WORKS_STEPS,
  HOW_IT_WORKS_SUBTITLE,
} from "@/constants/how-it-works";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { WorkflowStep } from "./WorkflowStep";

export function HowItWorksSection() {
  return (
    <section aria-labelledby="how-asli-jobs-works">
      <h2
        id="how-asli-jobs-works"
        className="text-center text-lg font-bold text-foreground sm:text-xl"
      >
        How AsliJobs Works
      </h2>

      <p className="mt-2 text-center text-sm text-muted sm:text-base">
        {HOW_IT_WORKS_SUBTITLE}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:mt-8 lg:flex lg:items-start lg:justify-between lg:gap-4">
        {HOW_IT_WORKS_STEPS.map((step, index) => (
          <Fragment key={step.id}>
            <div className="flex min-w-0 flex-1 justify-center">
              <WorkflowStep step={step} />
            </div>

            {index < HOW_IT_WORKS_STEPS.length - 1 ? (
              <div
                className="hidden items-center justify-center text-workflow-connector lg:flex lg:px-1 lg:pt-5"
                aria-hidden="true"
              >
                <ChevronRight className="size-5" strokeWidth={2} />
              </div>
            ) : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
