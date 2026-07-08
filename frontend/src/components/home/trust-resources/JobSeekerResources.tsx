import { DiscoverySectionHeader } from "@/components/home/discovery/DiscoverySectionHeader";
import { JOB_SEEKER_RESOURCES } from "@/constants/job-seeker-resources";
import { ROUTES } from "@/constants/routes";
import { ResourceCard } from "./ResourceCard";

export function JobSeekerResources() {
  return (
    <section aria-labelledby="job-seeker-resources">
      <DiscoverySectionHeader
        title="Job Seeker Resources"
        titleId="job-seeker-resources"
        actionLabel="View all resources →"
        actionHref={ROUTES.RESOURCES}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {JOB_SEEKER_RESOURCES.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );
}
