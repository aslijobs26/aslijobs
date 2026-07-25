"use client";

import { JobDetailsCenterPanel } from "@/components/jobs/JobDetailsCenterPanel";
import { JobDetailsLeftRail } from "@/components/jobs/JobDetailsLeftRail";
import { JobDetailsRightRail } from "@/components/jobs/JobDetailsRightRail";
import type { PublicJobDetail } from "@/services/public-jobs.service";
import { ArrowLeft } from "lucide-react";

type JobDetailsPageLayoutProps = {
  job: PublicJobDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  bookmarked: boolean;
  onBack: () => void;
  onToggleBookmark: () => void;
  onRetry?: () => void;
};

export function JobDetailsPageLayout({
  job,
  isLoading,
  isError,
  bookmarked,
  onBack,
  onToggleBookmark,
  onRetry,
}: JobDetailsPageLayoutProps) {
  const similarJobsSource = job
    ? {
        jobId: job.jobId,
        jobTitle: job.jobTitle,
        city: job.city,
        state: job.state,
      }
    : null;

  return (
    <main className="flex-1 bg-hero-bg">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7 xl:px-10">
        <div className="mb-5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Jobs
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)_250px] lg:items-start lg:gap-5 xl:grid-cols-[240px_minmax(0,1fr)_270px] xl:gap-6">
          <div className="order-2 hidden lg:sticky lg:top-24 lg:order-1 lg:block lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-1 scrollbar-hidden">
            <JobDetailsLeftRail job={similarJobsSource} />
          </div>

          <div className="order-1 min-w-0 lg:order-2">
            <JobDetailsCenterPanel
              job={job}
              isLoading={isLoading}
              isError={isError}
              bookmarked={bookmarked}
              onToggleBookmark={onToggleBookmark}
              onRetry={onRetry}
            />
          </div>

          <div className="order-3 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pl-1 scrollbar-hidden">
            <JobDetailsRightRail />
          </div>

          <div className="order-4 lg:hidden">
            <JobDetailsLeftRail job={similarJobsSource} />
          </div>
        </div>
      </div>
    </main>
  );
}
