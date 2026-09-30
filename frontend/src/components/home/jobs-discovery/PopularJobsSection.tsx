"use client";

import { DiscoverySectionHeader } from "@/components/home/discovery/DiscoverySectionHeader";
import {
  POPULAR_JOBS_HYDERABAD,
  POPULAR_JOBS_VIEW_ALL_HREF,
} from "@/constants/popular-jobs";
import { useTranslate } from "@/i18n/translate";
import { JobCard } from "./JobCard";

export function PopularJobsSection() {
  const t = useTranslate();

  return (
    <section aria-labelledby="trending-jobs-in-hyderabad">
      <DiscoverySectionHeader
        title={t("home.jobsDiscovery.trendingTitle")}
        titleId="trending-jobs-in-hyderabad"
        actionLabel={t("home.jobsDiscovery.viewAllJobs")}
        actionHref={POPULAR_JOBS_VIEW_ALL_HREF}
      />

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {POPULAR_JOBS_HYDERABAD.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
}
