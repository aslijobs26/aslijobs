"use client";

import {
  JOB_POSTED_SUCCESS_SUPPORT_CTA,
  JOB_POSTED_SUCCESS_SUPPORT_SUBTITLE,
  JOB_POSTED_SUCCESS_SUPPORT_TITLE,
} from "@/constants/job-posted-success";
import { ROUTES } from "@/constants/routes";
import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import { Headset } from "lucide-react";
import Link from "next/link";

export function JobPostedSuccessSupport() {
  return (
    <section
      className="job-posted-success-fade-up job-posted-success-fade-up-delay-5 flex flex-col gap-4 rounded-2xl border border-primary-soft/20 bg-primary-light p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5"
      aria-labelledby="job-posted-support-heading"
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-primary sm:size-11">
          <Headset className="size-5" strokeWidth={2} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2
            id="job-posted-support-heading"
            className="text-sm font-bold text-foreground sm:text-base"
          >
            {JOB_POSTED_SUCCESS_SUPPORT_TITLE}
          </h2>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">
            {JOB_POSTED_SUCCESS_SUPPORT_SUBTITLE}
          </p>
        </div>
      </div>

      <Link
        href={ROUTES.EMPLOYER_HELP_CENTER}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-primary-soft/40 bg-surface px-4 text-sm font-semibold text-primary transition-colors hover:bg-surface/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <WhatsAppIcon className="text-base text-whatsapp" />
        {JOB_POSTED_SUCCESS_SUPPORT_CTA}
      </Link>
    </section>
  );
}
