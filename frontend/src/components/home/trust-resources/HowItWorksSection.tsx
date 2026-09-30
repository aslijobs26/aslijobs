"use client";

import { WORKFLOW_STEP_KEYS } from "@/components/home/home-i18n";
import { HOW_IT_WORKS_STEPS } from "@/constants/how-it-works";
import { useTranslate } from "@/i18n/translate";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { WorkflowStep } from "./WorkflowStep";

export function HowItWorksSection() {
  const t = useTranslate();

  return (
    <section aria-labelledby="how-asli-jobs-works">
      <h2
        id="how-asli-jobs-works"
        className="text-balance break-words text-center text-lg font-bold text-foreground sm:text-xl"
      >
        {t("home.trust.howTitle")}
      </h2>

      <p className="mt-2 text-balance break-words text-center text-sm text-muted sm:text-base">
        {t("home.trust.howSubtitle")}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:mt-8 lg:flex lg:items-start lg:justify-between lg:gap-4">
        {HOW_IT_WORKS_STEPS.map((step, index) => (
          <Fragment key={step.id}>
            <div className="flex min-w-0 flex-1 justify-center">
              <WorkflowStep
                step={{
                  ...step,
                  title: t(WORKFLOW_STEP_KEYS[step.icon].title),
                  description: t(WORKFLOW_STEP_KEYS[step.icon].description),
                }}
              />
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
