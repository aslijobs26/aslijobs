"use client";

import {
  JOB_POSTED_SUCCESS_HEADING_EMPHASIS,
  JOB_POSTED_SUCCESS_HEADING_PREFIX,
  JOB_POSTED_SUCCESS_SUBTITLE,
  JOB_POSTED_SUCCESS_WHATSAPP_BADGE,
} from "@/constants/job-posted-success";
import { JobPostedSuccessIcon } from "@/components/job-posted-success/JobPostedSuccessIcon";
import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";

export function JobPostedSuccessHero() {
  return (
    <section
      className="job-posted-success-hero flex flex-col items-center text-center"
      aria-labelledby="job-posted-success-heading"
    >
      <div className="mb-5 sm:mb-6">
        <JobPostedSuccessIcon />
      </div>

      <h1
        id="job-posted-success-heading"
        className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
      >
        {JOB_POSTED_SUCCESS_HEADING_PREFIX}{" "}
        <span className="text-primary-soft">
          {JOB_POSTED_SUCCESS_HEADING_EMPHASIS}
        </span>
      </h1>

      <p className="mt-2 max-w-xl text-sm text-muted sm:mt-3 sm:text-base">
        {JOB_POSTED_SUCCESS_SUBTITLE}
      </p>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary-soft/30 bg-benefit-whatsapp-surface px-3.5 py-1.5 text-xs font-semibold text-primary sm:mt-5 sm:text-sm">
        <WhatsAppIcon className="text-base text-whatsapp" />
        <span>{JOB_POSTED_SUCCESS_WHATSAPP_BADGE}</span>
      </div>
    </section>
  );
}
