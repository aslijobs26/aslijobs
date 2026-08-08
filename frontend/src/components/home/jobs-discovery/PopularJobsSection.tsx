import { DiscoverySectionHeader } from "@/components/home/discovery/DiscoverySectionHeader";
import {
  POPULAR_JOBS_HYDERABAD,
  POPULAR_JOBS_VIEW_ALL_HREF,
} from "@/constants/popular-jobs";
import { JobCard } from "./JobCard";

export function PopularJobsSection() {
  return (
    <section aria-labelledby="trending-jobs-in-hyderabad">
      <DiscoverySectionHeader
        title="Trending jobs in Hyderabad"
        titleId="trending-jobs-in-hyderabad"
        actionLabel="View all jobs →"
        actionHref={POPULAR_JOBS_VIEW_ALL_HREF}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {POPULAR_JOBS_HYDERABAD.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
}
