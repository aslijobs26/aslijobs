"use client";

import {
  JOB_POSTED_SUCCESS_WHATSAPP_COMING_SOON,
  JOB_POSTED_SUCCESS_WHATSAPP_CTA,
  JOB_POSTED_SUCCESS_WHATSAPP_SUBTITLE,
  JOB_POSTED_SUCCESS_WHATSAPP_TITLE,
} from "@/constants/job-posted-success";
import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import { ExternalLink } from "lucide-react";

export function JobPostedSuccessWhatsAppBanner() {
  return (
    <section
      className="job-posted-success-fade-up job-posted-success-fade-up-delay-2 flex flex-col gap-4 rounded-2xl border border-whatsapp/20 bg-benefit-whatsapp-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5"
      aria-labelledby="job-posted-whatsapp-heading"
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-whatsapp text-surface sm:size-12">
          <WhatsAppIcon className="text-xl text-surface" />
        </span>
        <div className="min-w-0">
          <h2
            id="job-posted-whatsapp-heading"
            className="text-sm font-bold text-whatsapp-darker sm:text-base"
          >
            {JOB_POSTED_SUCCESS_WHATSAPP_TITLE}
          </h2>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">
            {JOB_POSTED_SUCCESS_WHATSAPP_SUBTITLE}
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled
        title={JOB_POSTED_SUCCESS_WHATSAPP_COMING_SOON}
        aria-label={`${JOB_POSTED_SUCCESS_WHATSAPP_CTA} (${JOB_POSTED_SUCCESS_WHATSAPP_COMING_SOON})`}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-whatsapp/40 bg-surface px-4 text-sm font-semibold text-whatsapp-dark opacity-70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp/30 disabled:cursor-not-allowed"
      >
        {JOB_POSTED_SUCCESS_WHATSAPP_CTA}
        <ExternalLink className="size-3.5" strokeWidth={2} aria-hidden="true" />
      </button>
    </section>
  );
}
