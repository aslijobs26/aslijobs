"use client";

import {
  JOB_POSTED_SUCCESS_GO_TO_JOBS,
  JOB_POSTED_SUCCESS_POST_ANOTHER,
} from "@/constants/job-posted-success";
import { ROUTES } from "@/constants/routes";
import { BriefcaseBusiness, Plus } from "lucide-react";
import Link from "next/link";

export function JobPostedSuccessActions() {
  return (
    <div className="job-posted-success-fade-up job-posted-success-fade-up-delay-4 flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
      <Link
        href={ROUTES.EMPLOYER_JOBS}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-6 text-sm font-bold text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-12 sm:w-auto sm:min-w-[11rem]"
      >
        <BriefcaseBusiness className="size-4" strokeWidth={2} aria-hidden="true" />
        {JOB_POSTED_SUCCESS_GO_TO_JOBS}
      </Link>

      <Link
        href={ROUTES.POST_JOB}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary-soft px-6 text-sm font-bold text-surface transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-12 sm:w-auto sm:min-w-[11rem]"
      >
        <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
        {JOB_POSTED_SUCCESS_POST_ANOTHER}
      </Link>
    </div>
  );
}
